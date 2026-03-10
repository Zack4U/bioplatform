#!/usr/bin/env python3
"""
Model Download / Sync Script
===============================
Downloads or verifies CNN model weights for the BioPlatform AI service.
Supports multiple backends: DVC, Google Drive, Azure Blob, or local copy.

Usage:
    python scripts/download_model.py                    # auto-detect method
    python scripts/download_model.py --method dvc       # use DVC
    python scripts/download_model.py --method gdrive    # direct Google Drive link
    python scripts/download_model.py --method local     # copy from local path
    python scripts/download_model.py --verify           # check integrity only

Environment variables (set in .env):
    MODEL_REMOTE_URL   — Direct download URL (GDrive, Azure, S3 presigned)
    MODEL_SHA256        — Expected SHA256 hash for integrity verification
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
WEIGHTS_DIR = PROJECT_ROOT / "data" / "weights"
TARGET_FILE = WEIGHTS_DIR / "best_model.pth"
CONFIG_FILE = WEIGHTS_DIR / "training_config.json"


def sha256_file(path: Path) -> str:
    """Compute SHA256 hash of a file."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_model() -> bool:
    """Check that the model file exists and optionally verify its hash."""
    if not TARGET_FILE.exists():
        logger.error(f"Model file not found: {TARGET_FILE}")
        return False

    if not CONFIG_FILE.exists():
        logger.error(f"Training config not found: {CONFIG_FILE}")
        return False

    size_mb = TARGET_FILE.stat().st_size / (1024 * 1024)
    logger.info(f"Model file: {TARGET_FILE} ({size_mb:.1f} MB)")

    expected_hash = os.getenv("MODEL_SHA256")
    if expected_hash:
        actual_hash = sha256_file(TARGET_FILE)
        if actual_hash != expected_hash:
            logger.error(f"Hash mismatch! Expected: {expected_hash[:16]}... Got: {actual_hash[:16]}...")
            return False
        logger.info(f"Hash verified: {actual_hash[:16]}...")
    else:
        logger.info("No MODEL_SHA256 set, skipping hash verification.")

    logger.info("Model verification passed.")
    return True


def download_dvc() -> bool:
    """Pull model weights using DVC."""
    logger.info("Pulling model weights with DVC...")
    try:
        subprocess.run(
            ["dvc", "pull", str(TARGET_FILE) + ".dvc"],
            cwd=str(PROJECT_ROOT),
            check=True,
        )
        return True
    except FileNotFoundError:
        logger.error("DVC not installed. Run: pip install dvc dvc-gdrive")
        return False
    except subprocess.CalledProcessError as e:
        logger.error(f"DVC pull failed: {e}")
        return False


def download_url() -> bool:
    """Download model from a direct URL (Google Drive, S3 presigned, etc.)."""
    url = os.getenv("MODEL_REMOTE_URL")
    if not url:
        logger.error("MODEL_REMOTE_URL not set in .env")
        return False

    logger.info("Downloading model from URL...")
    try:
        import requests

        WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
        response = requests.get(url, stream=True, timeout=300)
        response.raise_for_status()

        total = int(response.headers.get("content-length", 0))
        downloaded = 0

        with open(TARGET_FILE, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total > 0:
                    pct = downloaded / total * 100
                    print(f"\r  Downloading: {pct:.1f}%", end="", flush=True)

        print()  # newline after progress
        logger.info(f"Downloaded to {TARGET_FILE}")
        return True
    except Exception as e:
        logger.error(f"Download failed: {e}")
        return False


def copy_local() -> bool:
    """Copy model from a local path (shared drive, USB, etc.)."""
    source = os.getenv("MODEL_LOCAL_PATH")
    if not source:
        logger.error("MODEL_LOCAL_PATH not set in .env")
        return False

    source_path = Path(source)
    if not source_path.exists():
        logger.error(f"Source not found: {source_path}")
        return False

    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_path, TARGET_FILE)
    logger.info(f"Copied from {source_path} to {TARGET_FILE}")
    return True


def auto_detect() -> bool:
    """Try methods in order: DVC → URL → verify existing."""
    dvc_file = PROJECT_ROOT / "data" / "weights" / "best_model.pth.dvc"
    if dvc_file.exists():
        logger.info("Found .dvc file. Using DVC to pull weights...")
        if download_dvc():
            return True

    if os.getenv("MODEL_REMOTE_URL"):
        logger.info("Found MODEL_REMOTE_URL. Downloading...")
        if download_url():
            return True

    if TARGET_FILE.exists():
        logger.info("Model file already exists. Verifying...")
        return verify_model()

    logger.error(
        "No model weights found. Options:\n"
        "  1. Set up DVC:  dvc pull\n"
        "  2. Set MODEL_REMOTE_URL in .env\n"
        "  3. Manually place best_model.pth in data/weights/\n"
        "  4. Train a model: python scripts/04_train_cnn.py"
    )
    return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Download or verify CNN model weights")
    parser.add_argument(
        "--method",
        choices=["auto", "dvc", "url", "local"],
        default="auto",
        help="Download method (default: auto-detect)",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Only verify existing model (no download)",
    )
    args = parser.parse_args()

    if args.verify:
        ok = verify_model()
        sys.exit(0 if ok else 1)

    methods = {
        "auto": auto_detect,
        "dvc": download_dvc,
        "url": download_url,
        "local": copy_local,
    }

    ok = methods[args.method]()
    if ok:
        verify_model()
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
