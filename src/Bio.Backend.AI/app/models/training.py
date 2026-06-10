"""
Pydantic Models for Training & System API
============================================
Strict Pydantic schemas for fine-tuning, hardware,
model registry, and webhook endpoints.

Follows FastAPI + Pydantic v2 patterns with Type Hints.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field

# -- Hardware -----------------------------------------------------------------


class HardwareStatusResponse(BaseModel):
    """GPU / system capability snapshot."""

    has_gpu: bool = Field(..., description="Whether CUDA GPU is available")
    gpu_name: Optional[str] = Field(None, description="GPU device name")
    vram_total_gb: float = Field(0.0, description="Total VRAM in GB")
    vram_free_gb: float = Field(0.0, description="Free VRAM in GB")
    can_train_models: bool = Field(
        ..., description="True when GPU meets minimum VRAM threshold"
    )
    cuda_version: Optional[str] = Field(None, description="CUDA Toolkit version")
    compute_capability: Optional[str] = Field(
        None, description="CUDA Compute Capability"
    )
    multiprocessors: Optional[int] = Field(
        None, description="CUDA Multiprocessor count"
    )


# -- Training -----------------------------------------------------------------


class FineTuneRequest(BaseModel):
    """Payload sent by .NET Hangfire to trigger fine-tuning."""

    job_id: str = Field(..., description="AiTrainingJob UUID from .NET")
    epochs: Optional[int] = Field(None, description="Override default epochs")
    learning_rate: Optional[float] = Field(None, description="Override default LR")
    replay_buffer_ratio: Optional[float] = Field(
        None, description="Override replay buffer ratio (0.0-1.0)"
    )


class FineTuneAcceptedResponse(BaseModel):
    """Returned immediately when fine-tuning is queued."""

    status: str = Field(default="accepted", description="Always 'accepted'")
    job_id: str = Field(..., description="Echo of the job ID")
    message: str = Field(
        default="Fine-tuning task queued in background",
        description="Human-readable status",
    )


class TrainingWebhookPayload(BaseModel):
    """Payload sent FROM Python TO .NET webhook on completion."""

    job_id: str = Field(..., description="AiTrainingJob UUID")
    status: str = Field(..., description="Completed | Failed | Interrupted")
    status_message: str = Field(..., description="Human-readable result")
    version: Optional[str] = Field(None, description="Version tag if successful")
    accuracy: Optional[float] = Field(None, description="Best val accuracy")
    config_json: Optional[dict[str, Any]] = Field(
        None, description="training_config.json contents"
    )
    metrics_json: Optional[dict[str, Any]] = Field(
        None, description="evaluation_metrics.json contents"
    )


# -- Model Registry ----------------------------------------------------------


class ModelUploadResponse(BaseModel):
    """Returned when model upload is accepted for async DVC push."""

    status: str = Field(default="accepted", description="Always 'accepted'")
    version: str = Field(..., description="Generated version tag")
    message: str = Field(
        default="Files saved. DVC push running in background.",
        description="Human-readable status",
    )


class ModelReloadRequest(BaseModel):
    """Payload to trigger model hot-reload (Pointer Swap)."""

    version: Optional[str] = Field(
        None,
        description="Version to load. None = reload active from DB.",
    )


class ModelReloadResponse(BaseModel):
    """Response after Pointer Swap completes."""

    status: str = Field(..., description="'reloaded' or 'error'")
    version: Optional[str] = Field(None, description="Version now active in memory")
    message: str = Field(..., description="Human-readable result")


class ModelValidateResponse(BaseModel):
    """Result of pre-activation validation against test subset."""

    version: str = Field(..., description="Version that was validated")
    accuracy: float = Field(..., description="Accuracy on test subset")
    current_active_accuracy: Optional[float] = Field(
        None, description="Current active model accuracy for comparison"
    )
    accuracy_drop: Optional[float] = Field(
        None, description="Accuracy difference (negative = worse)"
    )
    is_safe_to_activate: bool = Field(
        ..., description="True if drop is within threshold"
    )
    message: str = Field(..., description="Human-readable verdict")


# -- Health Probes ------------------------------------------------------------


class LivenessResponse(BaseModel):
    """Minimal liveness check (process alive)."""

    status: str = Field(default="alive", description="Always 'alive'")


class ReadinessResponse(BaseModel):
    """Readiness check (model loaded + DB accessible)."""

    ready: bool = Field(..., description="True when all deps are available")
    model_loaded: bool = Field(..., description="CNN model is in memory")
    database_connected: bool = Field(..., description="PostgreSQL reachable")


class StartupResponse(BaseModel):
    """Startup probe (model finished loading)."""

    started: bool = Field(..., description="True after model init completes")
    model_loaded: bool = Field(..., description="CNN model is in memory")
