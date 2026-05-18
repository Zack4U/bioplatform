"""
API v1 - Training Endpoints
==============================
POST /api/v1/training/finetune  -> Trigger fine-tuning in background.

Thin controller: validates request, queues background task, returns 202.
"""

import logging

from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from app.models.training import FineTuneAcceptedResponse, FineTuneRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/training", tags=["Training"])


@router.post(
    "/finetune",
    response_model=FineTuneAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger CNN fine-tuning",
    description="Validates GPU capability and queues fine-tuning as a "
    "background task. Returns 202 immediately. Results are sent "
    "to .NET via webhook on completion.",
)
async def start_finetune(
    request: FineTuneRequest,
    background_tasks: BackgroundTasks,
) -> FineTuneAcceptedResponse:
    """Queue a fine-tuning job in background after VRAM validation."""
    # Hardware guard: check GPU availability
    try:
        import torch

        if not torch.cuda.is_available():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No CUDA GPU available. Use manual upload flow instead.",
            )

        from app.core.config import get_settings

        settings = get_settings()
        free_mem, _ = torch.cuda.mem_get_info(0)
        free_gb = free_mem / (1024**3)
        if free_gb < settings.min_vram_gb:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    f"Insufficient VRAM: {free_gb:.1f} GB free, "
                    f"minimum {settings.min_vram_gb:.1f} GB required."
                ),
            )
    except ImportError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="PyTorch not installed. Cannot train on this server.",
        )

    # Queue the fine-tuning orchestrator in background
    from app.services.training.finetune_orchestrator import run_finetune

    background_tasks.add_task(
        run_finetune,
        job_id=request.job_id,
        epochs=request.epochs,
        learning_rate=request.learning_rate,
        replay_buffer_ratio=request.replay_buffer_ratio,
    )

    logger.info("Fine-tuning queued for job_id=%s", request.job_id)

    return FineTuneAcceptedResponse(
        status="accepted",
        job_id=request.job_id,
        message="Fine-tuning task queued in background",
    )
