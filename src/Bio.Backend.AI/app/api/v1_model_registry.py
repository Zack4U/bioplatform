"""
API v1 - Model Registry Endpoints
====================================
POST /api/v1/model/upload    -> Upload model files (202 + async DVC push).
POST /api/v1/model/reload    -> Hot-reload active model (Pointer Swap).
POST /api/v1/model/validate  -> Pre-activation validation against test set.

Thin controllers: receive requests, delegate to services, return responses.
"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Annotated, Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)

from app.models.training import (
    ModelReloadRequest,
    ModelReloadResponse,
    ModelUploadResponse,
    ModelValidateResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/model", tags=["Model Registry"])

# -- Resolve paths ------------------------------------------------------------
_APP_DIR = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _APP_DIR.parent
_WEIGHTS_DIR = _PROJECT_ROOT / "data" / "weights"


# -- Helpers ------------------------------------------------------------------


def _generate_version_tag() -> str:
    """Generate a version tag: PREFIX.YYYYMMDDHHMMSS."""
    from app.core.config import get_settings

    settings = get_settings()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    return f"{settings.prefix_ai_version}.{ts}"


async def _dvc_push_and_notify(version_dir: Path, version: str) -> None:
    """Run dvc add + push in background, then notify .NET webhook."""
    import asyncio
    import subprocess

    from app.core.config import get_settings

    settings = get_settings()

    try:
        loop = asyncio.get_event_loop()

        # DVC add + push (blocking subprocess in thread)
        def _dvc_ops() -> None:
            subprocess.run(
                ["dvc", "add", str(version_dir)],
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

        await loop.run_in_executor(None, _dvc_ops)
        logger.info("DVC push completed for version %s", version)

        # Read config and metrics JSONs
        config_json = None
        metrics_json = None
        config_path = version_dir / "training_config.json"
        metrics_path = version_dir / "evaluation_metrics.json"

        if config_path.exists():
            with open(config_path, encoding="utf-8") as f:
                config_json = json.load(f)
        if metrics_path.exists():
            with open(metrics_path, encoding="utf-8") as f:
                metrics_json = json.load(f)

        # Notify .NET webhook
        import httpx

        payload = {
            "jobId": "",
            "status": "Completed",
            "statusMessage": f"Manual upload {version} - DVC push complete",
            "version": version,
            "accuracy": config_json.get("best_val_accuracy") if config_json else None,
            "configJson": config_json,
            "metricsJson": metrics_json,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(settings.dotnet_webhook_url, json=payload)
            logger.info(
                ".NET webhook response: %d %s", resp.status_code, resp.text[:200]
            )

    except Exception as exc:
        logger.error("DVC push / webhook failed for %s: %s", version, exc)


# -- Upload ------------------------------------------------------------------


@router.post(
    "/upload",
    response_model=ModelUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Upload model files (manual flow)",
    description="Receives model weights (.pth), training_config.json, and "
    "evaluation_metrics.json. Saves to versioned directory, then "
    "runs DVC push asynchronously. Returns 202 immediately.",
)
async def upload_model(
    weights_file: Annotated[
        UploadFile, File(description="Model weights file (.pth)")
    ],
    config_file: Annotated[
        UploadFile, File(description="training_config.json")
    ],
    metrics_file: Annotated[
        UploadFile, File(description="evaluation_metrics.json")
    ],
    notes: Annotated[
        Optional[str], Form(description="Optional notes/comments")
    ] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),  # noqa: B008
) -> ModelUploadResponse:
    """Save uploaded model files and queue DVC push in background."""
    version = _generate_version_tag()
    version_dir = _WEIGHTS_DIR / version
    version_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Save weights
        weights_path = version_dir / "best_model.pth"
        content = await weights_file.read()
        weights_path.write_bytes(content)

        # Save config
        config_content = await config_file.read()
        (version_dir / "training_config.json").write_bytes(config_content)

        # Save metrics
        metrics_content = await metrics_file.read()
        (version_dir / "evaluation_metrics.json").write_bytes(metrics_content)

        # Save notes if provided
        if notes:
            (version_dir / "notes.txt").write_text(notes, encoding="utf-8")

    except Exception as exc:
        logger.error("Failed to save uploaded files: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save files: {exc}",
        )

    # Queue DVC push + .NET notification in background (non-blocking)
    background_tasks.add_task(_dvc_push_and_notify, version_dir, version)

    logger.info("Model upload accepted: version=%s, notes=%s", version, notes)

    return ModelUploadResponse(
        status="accepted",
        version=version,
        message="Files saved. DVC push running in background.",
    )


# -- Reload (Pointer Swap) ---------------------------------------------------


@router.post(
    "/reload",
    response_model=ModelReloadResponse,
    summary="Hot-reload active model (Pointer Swap)",
    description="Loads the specified model version in a background thread, "
    "then atomically swaps the reference. Zero downtime.",
)
async def reload_model(
    request: ModelReloadRequest,
) -> ModelReloadResponse:
    """Trigger Pointer Swap hot-reload of the CNN model."""
    from app.services.vision.classifier import get_classifier

    classifier = get_classifier()

    # Determine version path
    if request.version:
        version_path = _WEIGHTS_DIR / request.version
    else:
        # Find any versioned directory or fall back to flat
        version_path = _WEIGHTS_DIR

    if not version_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version directory not found: {version_path}",
        )

    # Check that weights exist
    weights_file = version_path / "best_model.pth"
    if not weights_file.exists():
        # Try flat layout
        weights_file = _WEIGHTS_DIR / "best_model.pth"
        if not weights_file.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No best_model.pth found in version directory.",
            )

    try:
        await classifier.reload_model(version_path)
        return ModelReloadResponse(
            status="reloaded",
            version=classifier.active_version,
            message=f"Model reloaded via Pointer Swap. Active: {classifier.active_version}",
        )
    except Exception as exc:
        logger.error("Model reload failed: %s", exc, exc_info=True)
        return ModelReloadResponse(
            status="error",
            version=classifier.active_version,
            message=f"Reload failed: {exc}",
        )


# -- Validate (Pre-activation) -----------------------------------------------


@router.post(
    "/validate",
    response_model=ModelValidateResponse,
    summary="Validate model before activation",
    description="Loads the candidate model and runs inference on a test "
    "subset to check accuracy. Compares against the active model.",
)
async def validate_model(
    version: str,
    background_tasks: BackgroundTasks,
) -> ModelValidateResponse:
    """Run pre-activation validation against test subset."""
    version_path = _WEIGHTS_DIR / version

    if not version_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version not found: {version}",
        )

    weights_path = version_path / "best_model.pth"
    if not weights_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No best_model.pth in version: {version}",
        )

    from app.core.config import get_settings
    from app.services.vision.classifier import SpeciesClassifier, get_classifier

    settings = get_settings()

    # Load candidate model in a temporary classifier
    candidate = SpeciesClassifier()
    try:
        candidate.load_model(weights_path)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to load candidate model: {exc}",
        )

    # Quick validation: classify test images and measure accuracy
    test_dir = _PROJECT_ROOT / "data" / "processed" / "test"
    if not test_dir.exists():
        return ModelValidateResponse(
            version=version,
            accuracy=0.0,
            current_active_accuracy=None,
            accuracy_drop=None,
            is_safe_to_activate=True,
            message="No test directory found. Skipping validation.",
        )

    # Sample up to 50 images for fast validation
    import random

    test_images: list[tuple[Path, str]] = []
    for class_dir in test_dir.iterdir():
        if not class_dir.is_dir():
            continue
        images = list(class_dir.glob("*.jpg")) + list(class_dir.glob("*.png"))
        for img_path in images:
            test_images.append((img_path, class_dir.name))

    if not test_images:
        return ModelValidateResponse(
            version=version,
            accuracy=0.0,
            current_active_accuracy=None,
            accuracy_drop=None,
            is_safe_to_activate=True,
            message="No test images found.",
        )

    # Sample subset
    sample_size = min(50, len(test_images))
    sample = random.sample(test_images, sample_size)

    correct = 0
    for img_path, expected_class in sample:
        try:
            img_bytes = img_path.read_bytes()
            result = candidate.classify(img_bytes, top_k=1)
            if result["predictions"]:
                predicted = result["predictions"][0]["species"].replace(" ", "_")
                if predicted == expected_class:
                    correct += 1
        except Exception:
            pass

    accuracy = correct / sample_size if sample_size > 0 else 0.0

    # Compare with active model
    active_classifier = get_classifier()
    current_acc = None
    acc_drop = None

    if active_classifier.is_loaded and active_classifier.config:
        current_acc = active_classifier.config.get("best_val_accuracy")
        if current_acc is not None:
            acc_drop = round(accuracy - current_acc, 4)

    threshold = settings.validation_accuracy_drop_threshold
    is_safe = acc_drop is None or acc_drop >= -threshold

    message = f"Validation accuracy: {accuracy:.1%} on {sample_size} test images."
    if acc_drop is not None and acc_drop < -threshold:
        message += (
            f" WARNING: accuracy dropped by {abs(acc_drop):.1%} "
            f"(threshold: {threshold:.1%}). Activation requires confirmation."
        )

    return ModelValidateResponse(
        version=version,
        accuracy=round(accuracy, 4),
        current_active_accuracy=current_acc,
        accuracy_drop=acc_drop,
        is_safe_to_activate=is_safe,
        message=message,
    )
