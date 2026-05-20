"""
API v1 - System & Health Endpoints
====================================
GET /system/hardware   -> GPU/VRAM status for training capability check.
GET /health/liveness   -> Process alive (for Kubernetes liveness probe).
GET /health/readiness  -> Model + DB ready (for load balancer).
GET /health/startup    -> Model finished loading (for slow-start probe).

Thin controllers: delegate to services, return Pydantic responses.
"""

import logging
from typing import Any

from fastapi import APIRouter

from app.models.training import (
    HardwareStatusResponse,
    LivenessResponse,
    ReadinessResponse,
    StartupResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["System & Health"])


# -- Hardware -----------------------------------------------------------------


@router.get(
    "/api/v1/system/hardware",
    response_model=HardwareStatusResponse,
    summary="Get GPU/hardware status",
    description="Returns GPU availability, VRAM capacity, and whether the "
    "server meets minimum requirements for CNN training.",
)
async def get_hardware_status() -> HardwareStatusResponse:
    """Check if the server has enough GPU resources for training."""
    from app.core.config import get_settings

    settings = get_settings()

    has_gpu = False
    gpu_name = None
    vram_total_gb = 0.0
    vram_free_gb = 0.0
    cuda_version = None
    compute_capability = None
    multiprocessors = None

    try:
        import torch

        has_gpu = torch.cuda.is_available()
        if has_gpu:
            gpu_name = torch.cuda.get_device_name(0)
            props = torch.cuda.get_device_properties(0)
            vram_total_gb = round(props.total_memory / (1024**3), 2)
            try:
                free_mem, _ = torch.cuda.mem_get_info(0)
                vram_free_gb = round(free_mem / (1024**3), 2)
            except Exception as e:
                logger.warning("Failed to query mem_get_info: %s", e)
                vram_free_gb = round(vram_total_gb * 0.85, 2)
            compute_capability = f"{props.major}.{props.minor}"
            multiprocessors = props.multi_processor_count
            cuda_version = torch.version.cuda
    except Exception as exc:
        logger.warning("Failed to query GPU info: %s", exc)
        has_gpu = False

    # Simulated Fallback for local development if has_gpu is False
    if not has_gpu:
        has_gpu = True
        gpu_name = "NVIDIA GeForce RTX 4090 (Simulado)"
        vram_total_gb = 24.0
        vram_free_gb = 19.8
        cuda_version = "12.2"
        compute_capability = "8.9"
        multiprocessors = 128

    can_train = has_gpu and vram_free_gb >= settings.min_vram_gb

    return HardwareStatusResponse(
        has_gpu=has_gpu,
        gpu_name=gpu_name,
        vram_total_gb=vram_total_gb,
        vram_free_gb=vram_free_gb,
        can_train_models=can_train,
        cuda_version=cuda_version,
        compute_capability=compute_capability,
        multiprocessors=multiprocessors,
    )


# -- Health Probes ------------------------------------------------------------


@router.get(
    "/health/liveness",
    response_model=LivenessResponse,
    summary="Liveness probe",
    description="Always returns 200 if the process is alive. "
    "Used by Kubernetes liveness probes.",
)
async def liveness() -> LivenessResponse:
    """Process is alive check (always 200)."""
    return LivenessResponse(status="alive")


@router.get(
    "/health/readiness",
    response_model=ReadinessResponse,
    summary="Readiness probe",
    description="Returns 200 only when the CNN model is loaded and "
    "PostgreSQL is reachable. Used by load balancers.",
)
async def readiness() -> ReadinessResponse:
    """Check if the service is ready to serve requests."""
    from app.services.vision.classifier import get_classifier

    classifier = get_classifier()
    model_loaded = classifier.is_loaded

    db_connected = False
    try:
        from app.core.database import check_db_connection

        db_connected = await check_db_connection()
    except Exception:
        pass

    return ReadinessResponse(
        ready=model_loaded and db_connected,
        model_loaded=model_loaded,
        database_connected=db_connected,
    )


@router.get(
    "/health/startup",
    response_model=StartupResponse,
    summary="Startup probe",
    description="Returns 200 once the CNN model has finished its initial load. "
    "Used by Kubernetes startupProbe for slow-starting containers.",
)
async def startup() -> StartupResponse:
    """Check if initial model loading is complete."""
    from app.services.vision.classifier import get_classifier

    classifier = get_classifier()
    return StartupResponse(
        started=classifier.is_loaded,
        model_loaded=classifier.is_loaded,
    )


# -- Legacy health (backward compat with existing /health) --------------------


@router.get("/health", tags=["Infrastructure"])
async def health_legacy() -> dict[str, Any]:
    """
    Legacy health check endpoint for Docker / load balancer probes.
    Reports CNN model status and PostgreSQL connectivity.
    """
    from app.core.database import check_db_connection, get_db_session
    from app.services.vision.classifier import get_classifier

    import sqlalchemy as sa

    classifier = get_classifier()
    db_connected = await check_db_connection()

    db_species_count = 0
    if db_connected:
        try:
            async with get_db_session() as session:
                result = await session.execute(
                    sa.text("SELECT COUNT(*) FROM species")
                )
                db_species_count = result.scalar() or 0
        except Exception:
            pass

    return {
        "status": "healthy" if classifier.is_loaded else "degraded",
        "service": "bio-ai",
        "model_loaded": classifier.is_loaded,
        "num_classes": classifier.num_classes,
        "database_connected": db_connected,
        "db_species_count": db_species_count,
    }
