"""
Script 07: Local Fine-Tuning CLI
==================================
Convenience wrapper for manual local fine-tuning of the species CNN.
Automates the full pipeline:
    0. Delta download: fetch new validated images from S3 (optional)
    1. Organize dataset with Replay Buffer (100% new + replay% old)
    2. Run training with warm-start from active checkpoint
    3. Evaluate the new model
    4. Export to ONNX
    5. Print activation instructions

Usage:
    python scripts/cnn/07_local_finetune.py
    python scripts/cnn/07_local_finetune.py --epochs 20 --lr 0.00005
    python scripts/cnn/07_local_finetune.py --skip-download --skip-organize
    python scripts/cnn/07_local_finetune.py --replay-ratio 0.20

Output:
    data/weights/{version}/
        best_model.pth
        checkpoint.pth
        training_config.json
        model.onnx (optional)
"""

import argparse
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import os

from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
WEIGHTS_DIR = PROJECT_ROOT / "data" / "weights"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
ANALYSIS_DIR = PROJECT_ROOT / "data" / "dataset_analysis"
DELTA_MANIFEST = ANALYSIS_DIR / "delta_manifest.json"

load_dotenv(PROJECT_ROOT / ".env")


def _find_latest_checkpoint() -> Path | None:
    """Find the latest checkpoint.pth in versioned directories."""
    version_dirs = sorted(
        [d for d in WEIGHTS_DIR.iterdir() if d.is_dir() and d.name.startswith("v")],
        reverse=True,
    )
    for vdir in version_dirs:
        ckpt = vdir / "checkpoint.pth"
        if ckpt.exists():
            return ckpt
        best = vdir / "best_model.pth"
        if best.exists():
            return best

    # Flat layout fallback
    flat_ckpt = WEIGHTS_DIR / "checkpoint.pth"
    if flat_ckpt.exists():
        return flat_ckpt
    flat_best = WEIGHTS_DIR / "best_model.pth"
    if flat_best.exists():
        return flat_best
    return None


def _run(cmd: list[str], label: str) -> bool:
    """Run a subprocess and print output. Returns True on success."""
    print(f"\n{'=' * 60}")
    print(f"  {label}")
    print(f"{'=' * 60}\n")

    result = subprocess.run(
        cmd,
        cwd=str(PROJECT_ROOT),
    )

    if result.returncode != 0:
        print(f"\n[ERROR] {label} failed (exit code {result.returncode})")
        return False
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Local fine-tuning CLI for BioPlatform CNN"
    )
    parser.add_argument(
        "--version", type=str, default=None,
        help="Version prefix (default: auto-generated from timestamp)",
    )
    parser.add_argument("--epochs", type=int, default=15)
    parser.add_argument("--lr", type=float, default=1e-5)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument(
        "--model", type=str, default=None,
        help="Model architecture (default: use active model's architecture)",
    )
    parser.add_argument(
        "--skip-organize", action="store_true",
        help="Skip dataset organization step",
    )
    parser.add_argument(
        "--skip-eval", action="store_true",
        help="Skip evaluation step",
    )
    parser.add_argument(
        "--skip-onnx", action="store_true",
        help="Skip ONNX export step",
    )
    parser.add_argument(
        "--no-warm-start", action="store_true",
        help="Train from scratch (ImageNet) instead of warm-starting",
    )
    parser.add_argument(
        "--skip-download", action="store_true",
        help="Skip delta download step (use existing raw images)",
    )
    parser.add_argument(
        "--replay-ratio", type=float, default=None,
        help="Fraction of old images to keep in Replay Buffer "
             "(default: REPLAY_BUFFER_RATIO from .env, typically 0.15)",
    )
    args = parser.parse_args()

    # Resolve replay ratio from env
    if args.replay_ratio is None:
        args.replay_ratio = float(os.environ.get("REPLAY_BUFFER_RATIO", "0.15"))
    seed = int(os.environ.get("DATASET_SPLIT_SEED", "42"))

    # Generate version tag
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    version = args.version or f"v1.0.{ts}"
    output_dir = WEIGHTS_DIR / version

    print(f"\n{'=' * 60}")
    print("  BioPlatform Local Fine-Tuning")
    print(f"{'=' * 60}")
    print(f"  Version:   {version}")
    print(f"  Output:    {output_dir}")
    print(f"  Epochs:    {args.epochs}")
    print(f"  LR:        {args.lr}")
    print(f"  Batch:     {args.batch_size}")

    # Determine model architecture from active checkpoint config
    model_name = args.model
    checkpoint_path = None

    if not args.no_warm_start:
        checkpoint_path = _find_latest_checkpoint()
        if checkpoint_path:
            print(f"  Checkpoint: {checkpoint_path}")
            # Read model name from config
            import json

            config_path = checkpoint_path.parent / "training_config.json"
            if not config_path.exists():
                config_path = WEIGHTS_DIR / "training_config.json"
            if config_path.exists():
                with open(config_path, encoding="utf-8") as f:
                    config = json.load(f)
                if model_name is None:
                    model_name = config.get("model_name", "efficientnet_b0")
        else:
            print("  Checkpoint: None (training from scratch)")
    else:
        print("  Checkpoint: Disabled (--no-warm-start)")

    if model_name is None:
        model_name = "efficientnet_b0"
    print(f"  Model:     {model_name}")
    print(f"{'=' * 60}")

    start_time = time.time()

    # Step 0: Delta download
    if not args.skip_download:
        delta_script = SCRIPT_DIR.parent / "dataset" / "02f_download_delta.py"
        if delta_script.exists():
            ok = _run(
                [sys.executable, str(delta_script)],
                "Step 0/5: Delta Download (validated images from S3)",
            )
            if not ok:
                print("[ERROR] Delta download failed. Aborting.")
                sys.exit(1)

            # Check if any new images were downloaded
            if DELTA_MANIFEST.exists():
                import json
                try:
                    with open(DELTA_MANIFEST, "r", encoding="utf-8") as f:
                        manifest_data = json.load(f)
                    
                    if manifest_data.get("total_downloaded", 0) == 0:
                        ans = input("\n[PROMPT] No new images were downloaded. Do you want to continue training with the existing dataset? [y/N]: ")
                        if ans.lower() not in ["y", "yes"]:
                            print("\n[INFO] Aborting fine-tuning process as per user request.")
                            sys.exit(0)
                except Exception as e:
                    print(f"[WARN] Could not read manifest to verify downloaded images: {e}")
                    
        else:
            print("[WARN] Delta download script not found. Skipping.")
    else:
        print("\n[INFO] Skipping delta download (--skip-download)")

    # Step 1: Organize dataset (with Replay Buffer)
    if not args.skip_organize:
        organize_script = SCRIPT_DIR.parent / "dataset" / "03_organize_dataset.py"
        if organize_script.exists():
            organize_cmd = [
                sys.executable, str(organize_script),
                "--seed", str(seed),
            ]
            # Clean only if training from scratch (no-warm-start)
            if args.no_warm_start:
                organize_cmd.append("--clean")

            # Enable Replay Buffer / incremental delta organization if manifest exists
            if DELTA_MANIFEST.exists():
                organize_cmd.extend([
                    "--new-images-manifest", str(DELTA_MANIFEST),
                    "--replay-ratio", str(args.replay_ratio),
                ])

            ok = _run(
                organize_cmd,
                f"Step 1/5: Organizing Dataset (replay={args.replay_ratio:.0%})",
            )
            if not ok:
                print("[ERROR] Dataset organization failed. Aborting.")
                sys.exit(1)
        else:
            print("[WARN] Organize script not found. Skipping.")
    else:
        print("\n[INFO] Skipping dataset organization (--skip-organize)")

    # Verify dataset exists
    train_dir = PROCESSED_DIR / "train"
    if not train_dir.exists():
        print(f"\n[ERROR] Training data not found: {train_dir}")
        print("  Run: python scripts/dataset/03_organize_dataset.py")
        sys.exit(1)

    # Step 2: Train
    train_cmd = [
        sys.executable,
        str(SCRIPT_DIR / "04_train_cnn.py"),
        "--model", model_name,
        "--epochs", str(args.epochs),
        "--lr", str(args.lr),
        "--unfreeze-lr", str(args.lr),
        "--freeze-epochs", "0",
        "--batch-size", str(args.batch_size),
        "--output-dir", str(output_dir),
    ]
    if checkpoint_path and not args.no_warm_start:
        train_cmd.extend(["--resume-checkpoint", str(checkpoint_path)])

    ok = _run(train_cmd, "Step 2/5: Training CNN (Fine-Tuning)")
    if not ok:
        print("[ERROR] Training failed. Aborting.")
        sys.exit(1)

    # Step 3: Evaluate
    if not args.skip_eval:
        eval_script = SCRIPT_DIR / "05_evaluate_model.py"
        if eval_script.exists():
            ok = _run(
                [sys.executable, str(eval_script), "--weights-dir", str(output_dir)],
                "Step 3/5: Evaluating Model",
            )
            if not ok:
                print("[ERROR] Evaluation failed. Aborting.")
                sys.exit(1)
        else:
            print("[WARN] Evaluation script not found. Skipping.")
    else:
        print("\n[INFO] Skipping evaluation (--skip-eval)")

    # Step 4: ONNX export
    if not args.skip_onnx:
        onnx_script = SCRIPT_DIR / "06_export_onnx.py"
        if onnx_script.exists():
            ok = _run(
                [sys.executable, str(onnx_script), "--weights-dir", str(output_dir)],
                "Step 4/5: Exporting ONNX",
            )
            if not ok:
                print("[ERROR] ONNX export failed. Aborting.")
                sys.exit(1)
        else:
            print("[WARN] ONNX export script not found. Skipping.")
    else:
        print("\n[INFO] Skipping ONNX export (--skip-onnx)")

    # Summary
    elapsed = time.time() - start_time
    print(f"\n{'=' * 60}")
    print("  LOCAL FINE-TUNING COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Version:     {version}")
    print(f"  Output:      {output_dir}")
    print(f"  Total Time:  {elapsed / 60:.1f} minutes")
    print()
    print("  To activate this model:")
    print(f"    1. Upload: POST /api/v1/model/upload (files from {output_dir})")
    print(f"    2. Validate: POST /api/v1/model/validate?version={version}")
    print(f"    3. Activate: POST /api/v1/ai/models/{{id}}/activate")
    print()
    print("  Or manually reload:")
    print(f'    POST /api/v1/model/reload  {{"version": "{version}"}}')


if __name__ == "__main__":
    main()
