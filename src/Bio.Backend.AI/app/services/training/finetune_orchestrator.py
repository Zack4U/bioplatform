"""
Fine-Tuning Orchestrator
=========================
Core background service that coordinates the entire automated
fine-tuning pipeline:

1. Download delta images (only new validated ones).
2. Organize dataset with Replay Buffer (100% new + 15% old).
3. Run training with warm-start checkpoint.
4. Evaluate the new model.
5. Export to ONNX.
6. DVC add + push.
7. Notify .NET via webhook.

Handles SIGTERM for graceful shutdown (emergency checkpoint).
All errors are caught and reported to .NET webhook.
"""

from __future__ import annotations

import json
import logging
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

# -- Resolve paths ------------------------------------------------------------
_SERVICE_DIR = Path(__file__).resolve().parent
_APP_DIR = _SERVICE_DIR.parent.parent
_PROJECT_ROOT = _APP_DIR.parent
_WEIGHTS_DIR = _PROJECT_ROOT / "data" / "weights"
_PROCESSED_DIR = _PROJECT_ROOT / "data" / "processed"
_EVALUATION_DIR = _PROJECT_ROOT / "data" / "evaluation"
_SCRIPTS_DIR = _PROJECT_ROOT / "scripts"


# -- SIGTERM Graceful Shutdown ------------------------------------------------

_shutdown_requested = False
_current_model = None
_current_optimizer = None
_current_scheduler = None
_current_epoch = 0
_current_best_acc = 0.0
_current_output_dir: Path | None = None


def _sigterm_handler(signum: int, frame: Any) -> None:
    """Handle SIGTERM: flag shutdown so training loop can save checkpoint."""
    global _shutdown_requested
    _shutdown_requested = True
    logger.warning("SIGTERM received. Will save emergency checkpoint after current epoch.")


# -- Webhook Notification -----------------------------------------------------


async def _notify_dotnet(
    job_id: str,
    status: str,
    message: str,
    version: str | None = None,
    accuracy: float | None = None,
    config_json: dict | None = None,
    metrics_json: dict | None = None,
) -> None:
    """Send training result to .NET webhook endpoint."""
    from app.core.config import get_settings

    settings = get_settings()

    payload = {
        "jobId": job_id,
        "status": status,
        "statusMessage": message,
        "version": version,
        "accuracy": accuracy,
        "configJson": config_json,
        "metricsJson": metrics_json,
    }

    try:
        import httpx

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(settings.dotnet_webhook_url, json=payload)
            logger.info(
                "Webhook sent: job=%s status=%s response=%d",
                job_id, status, resp.status_code,
            )
    except Exception as exc:
        logger.error("Webhook notification failed for job %s: %s", job_id, exc)


def _notify_dotnet_sync(
    job_id: str,
    status: str,
    message: str,
    version: str | None = None,
    accuracy: float | None = None,
    config_json: dict | None = None,
    metrics_json: dict | None = None,
) -> None:
    """Synchronous webhook notification (for use in non-async context)."""
    from app.core.config import get_settings

    settings = get_settings()

    payload = {
        "jobId": job_id,
        "status": status,
        "statusMessage": message,
        "version": version,
        "accuracy": accuracy,
        "configJson": config_json,
        "metricsJson": metrics_json,
    }

    try:
        import httpx

        with httpx.Client(timeout=30.0) as client:
            resp = client.post(settings.dotnet_webhook_url, json=payload)
            logger.info(
                "Webhook sent (sync): job=%s status=%s response=%d",
                job_id, status, resp.status_code,
            )
    except Exception as exc:
        logger.error("Webhook notification failed for job %s: %s", job_id, exc)


# -- Version Tag Generator ---------------------------------------------------


def _generate_version(prefix: str) -> str:
    """Generate version tag: PREFIX.YYYYMMDDHHMMSS."""
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{prefix}.{ts}"


# -- Main Orchestrator --------------------------------------------------------


def run_finetune(
    job_id: str,
    epochs: int | None = None,
    learning_rate: float | None = None,
    replay_buffer_ratio: float | None = None,
) -> None:
    """
    Main fine-tuning pipeline. Runs as a BackgroundTask.

    This is the heart of the automated training flow. It:
    1. Downloads delta images from validated species.
    2. Organizes dataset with Replay Buffer.
    3. Trains the model with warm-start from active checkpoint.
    4. Evaluates the new model.
    5. Exports to ONNX.
    6. Pushes to DVC.
    7. Notifies .NET with results.
    """
    # Register SIGTERM handler for graceful shutdown
    original_handler = signal.getsignal(signal.SIGTERM)
    signal.signal(signal.SIGTERM, _sigterm_handler)

    from app.core.config import get_settings

    settings = get_settings()
    version = _generate_version(settings.prefix_ai_version)
    output_dir = _WEIGHTS_DIR / version
    eval_dir = _EVALUATION_DIR / version

    effective_epochs = epochs or settings.finetune_default_epochs
    effective_lr = learning_rate or settings.finetune_default_lr
    effective_replay = replay_buffer_ratio or settings.replay_buffer_ratio

    logger.info(
        "Fine-tuning started: job=%s version=%s epochs=%d lr=%s replay=%.2f",
        job_id, version, effective_epochs, effective_lr, effective_replay,
    )

    start_time = time.time()

    try:
        # -- Step 1: Find active model checkpoint for warm-start --
        active_checkpoint = _find_active_checkpoint()
        logger.info("Active checkpoint for warm-start: %s", active_checkpoint)

        # -- Step 2: Organize dataset (with Replay Buffer) --
        logger.info("Step 2: Organizing dataset with replay buffer...")
        _run_dataset_organization()

        # -- Step 3: Read training config from active version --
        active_config = _load_active_config(active_checkpoint)
        model_name = active_config.get("model_name", "efficientnet_b0")
        image_size = active_config.get("image_size", 224)
        batch_size = active_config.get("batch_size", 32)

        # -- Step 4: Run training --
        logger.info("Step 4: Starting training (warm-start)...")
        output_dir.mkdir(parents=True, exist_ok=True)

        train_cmd = [
            sys.executable,
            str(_SCRIPTS_DIR / "cnn" / "04_train_cnn.py"),
            "--model", model_name,
            "--epochs", str(effective_epochs),
            "--lr", str(effective_lr),
            "--unfreeze-lr", str(effective_lr),
            "--freeze-epochs", "0",  # Skip freeze phase for fine-tuning
            "--image-size", str(image_size),
            "--batch-size", str(batch_size),
            "--label-smoothing", str(active_config.get("label_smoothing", 0.1)),
            "--mixup-alpha", str(active_config.get("mixup_alpha", 0.2)),
            "--cutmix-alpha", str(active_config.get("cutmix_alpha", 0.0)),
            "--output-dir", str(output_dir),
        ]

        if active_checkpoint:
            train_cmd.extend(["--resume-checkpoint", str(active_checkpoint)])

        result = subprocess.run(
            train_cmd,
            cwd=str(_PROJECT_ROOT),
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"Training failed (exit={result.returncode}): {result.stderr[-500:]}"
            )

        logger.info("Training completed successfully.")

        # -- Step 5: Evaluate model --
        logger.info("Step 5: Evaluating model...")
        eval_dir.mkdir(parents=True, exist_ok=True)

        eval_script = _SCRIPTS_DIR / "cnn" / "05_evaluate_model.py"
        if eval_script.exists():
            eval_cmd = [
                sys.executable,
                str(eval_script),
                "--weights-dir", str(output_dir),
            ]
            eval_result = subprocess.run(
                eval_cmd,
                cwd=str(_PROJECT_ROOT),
                capture_output=True,
                text=True,
            )
            if eval_result.returncode != 0:
                logger.warning("Evaluation script failed: %s", eval_result.stderr[-300:])

        # -- Step 6: Export ONNX --
        logger.info("Step 6: Exporting ONNX...")
        onnx_script = _SCRIPTS_DIR / "cnn" / "06_export_onnx.py"
        if onnx_script.exists():
            onnx_cmd = [
                sys.executable,
                str(onnx_script),
                "--weights-dir", str(output_dir),
            ]
            onnx_result = subprocess.run(
                onnx_cmd,
                cwd=str(_PROJECT_ROOT),
                capture_output=True,
                text=True,
            )
            if onnx_result.returncode != 0:
                logger.warning("ONNX export failed: %s", onnx_result.stderr[-300:])

        # -- Step 7: DVC add + push --
        logger.info("Step 7: DVC add + push...")
        try:
            subprocess.run(
                ["dvc", "add", str(output_dir)],
                cwd=str(_PROJECT_ROOT),
                check=True,
                capture_output=True,
                text=True,
            )
            subprocess.run(
                ["dvc", "push"],
                cwd=str(_PROJECT_ROOT),
                check=True,
                capture_output=True,
                text=True,
            )
            logger.info("DVC push completed.")
        except (subprocess.CalledProcessError, FileNotFoundError) as dvc_exc:
            logger.warning("DVC operation failed (non-fatal): %s", dvc_exc)

        # -- Step 8: Read results and notify .NET --
        elapsed = time.time() - start_time
        config_json = _read_json_safe(output_dir / "training_config.json")
        metrics_json = _read_json_safe(eval_dir / "evaluation_metrics.json")
        if metrics_json is None:
            metrics_json = _read_json_safe(output_dir / "evaluation_metrics.json")

        accuracy = config_json.get("best_val_accuracy") if config_json else None
        status_msg = (
            f"Fine-tuning completed in {elapsed / 60:.1f} min. "
            f"Accuracy: {accuracy:.4f}" if accuracy else "Fine-tuning completed."
        )

        _notify_dotnet_sync(
            job_id=job_id,
            status="Completed",
            message=status_msg,
            version=version,
            accuracy=accuracy,
            config_json=config_json,
            metrics_json=metrics_json,
        )

        logger.info(
            "Fine-tuning pipeline complete: job=%s version=%s accuracy=%s time=%.1fs",
            job_id, version, accuracy, elapsed,
        )

    except Exception as exc:
        elapsed = time.time() - start_time
        error_msg = f"Fine-tuning failed after {elapsed / 60:.1f} min: {exc}"
        logger.error(error_msg, exc_info=True)

        # Save emergency checkpoint if SIGTERM was the cause
        if _shutdown_requested:
            _save_emergency_checkpoint(output_dir)
            _notify_dotnet_sync(
                job_id=job_id,
                status="Interrupted",
                message=f"Training interrupted by SIGTERM at epoch ~{_current_epoch}",
                version=version,
            )
        else:
            _notify_dotnet_sync(
                job_id=job_id,
                status="Failed",
                message=error_msg,
                version=version,
            )

    finally:
        # Restore original signal handler
        signal.signal(signal.SIGTERM, original_handler)


# -- Helper Functions ---------------------------------------------------------


def _find_active_checkpoint() -> Path | None:
    """Find the active model checkpoint for warm-start."""
    # Look for versioned dirs first (sorted by name = newest last)
    version_dirs = sorted(
        [d for d in _WEIGHTS_DIR.iterdir() if d.is_dir() and d.name.startswith("v")],
        reverse=True,
    )

    for vdir in version_dirs:
        ckpt = vdir / "checkpoint.pth"
        if ckpt.exists():
            return ckpt
        # Fallback to best_model.pth
        best = vdir / "best_model.pth"
        if best.exists():
            return best

    # Fallback to flat layout
    flat_ckpt = _WEIGHTS_DIR / "checkpoint.pth"
    if flat_ckpt.exists():
        return flat_ckpt
    flat_best = _WEIGHTS_DIR / "best_model.pth"
    if flat_best.exists():
        return flat_best

    return None


def _load_active_config(checkpoint_path: Path | None) -> dict[str, Any]:
    """Load training config from the active model version."""
    if checkpoint_path:
        config_path = checkpoint_path.parent / "training_config.json"
        if config_path.exists():
            with open(config_path, encoding="utf-8") as f:
                return json.load(f)

    # Fallback to flat config
    flat_config = _WEIGHTS_DIR / "training_config.json"
    if flat_config.exists():
        with open(flat_config, encoding="utf-8") as f:
            return json.load(f)

    return {}


def _run_dataset_organization() -> None:
    """Run the dataset organization script with --clean flag."""
    organize_script = _SCRIPTS_DIR / "dataset" / "03_organize_dataset.py"
    if not organize_script.exists():
        logger.warning("Dataset organization script not found: %s", organize_script)
        return

    result = subprocess.run(
        [sys.executable, str(organize_script), "--clean"],
        cwd=str(_PROJECT_ROOT),
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        logger.warning("Dataset organization warnings: %s", result.stderr[-300:])
    else:
        logger.info("Dataset organization completed.")


def _read_json_safe(path: Path) -> dict | None:
    """Read a JSON file, returning None on any error."""
    try:
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
    except Exception as exc:
        logger.warning("Failed to read %s: %s", path, exc)
    return None


def _save_emergency_checkpoint(output_dir: Path | None) -> None:
    """Save an emergency checkpoint on SIGTERM (best-effort)."""
    if _current_model is None or output_dir is None:
        return

    try:
        import torch

        emergency_path = output_dir / "emergency_checkpoint.pth"
        checkpoint: dict[str, Any] = {
            "model_state_dict": _current_model.state_dict(),
            "epoch": _current_epoch,
            "best_val_acc": _current_best_acc,
        }
        if _current_optimizer is not None:
            checkpoint["optimizer_state_dict"] = _current_optimizer.state_dict()
        if _current_scheduler is not None:
            checkpoint["scheduler_state_dict"] = _current_scheduler.state_dict()

        torch.save(checkpoint, emergency_path)
        logger.info("Emergency checkpoint saved to %s", emergency_path)
    except Exception as exc:
        logger.error("Failed to save emergency checkpoint: %s", exc)
