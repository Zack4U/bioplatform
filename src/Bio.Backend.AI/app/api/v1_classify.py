"""
API v1 - Species Classification Endpoint
==========================================
POST /api/v1/classify  →  Classify a species image via CNN.
GET  /api/v1/model-info →  Get model metadata and available classes.

Thin controller: receives request, delegates to SpeciesClassifier service.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from app.models.vision import (
    ClassificationResponse,
    ModelInfoResponse,
    SpeciesPrediction,
    TaxonomyInfo,
)
from app.services.vision.classifier import get_classifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Vision - Species Classification"])

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


@router.post(
    "/classify",
    response_model=ClassificationResponse,
    summary="Classify a species image",
    description=(
        "Upload an image of flora or fauna from Caldas, Colombia. "
        "The CNN model returns top-K species predictions with confidence "
        "scores and full taxonomic classification."
    ),
)
async def classify_species(
    file: Annotated[UploadFile, File(description="Image file (JPEG, PNG, WebP)")],
    top_k: Annotated[int, Query(ge=1, le=20, description="Number of top predictions")] = 5,
    confidence_threshold: Annotated[
        float, Query(ge=0.0, le=1.0, description="Minimum confidence threshold")
    ] = 0.01,
) -> ClassificationResponse:
    """
    Classify a species image using the trained CNN model.

    - **file**: Image file (JPEG, PNG, WebP). Max 10 MB.
    - **top_k**: Number of top predictions to return (1-20).
    - **confidence_threshold**: Minimum confidence to include a prediction.

    Returns a list of predicted species with confidence scores and taxonomy.
    """
    classifier = get_classifier()

    # Check model is loaded
    if not classifier.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded yet. Please wait for initialization.",
        )

    # Validate file type
    if file.content_type and file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read and validate file size
    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({len(image_bytes)} bytes). Maximum: {MAX_FILE_SIZE} bytes.",
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file received.",
        )

    # Classify
    try:
        result = classifier.classify(
            image_bytes=image_bytes,
            top_k=top_k,
            confidence_threshold=confidence_threshold,
        )
    except Exception as e:
        logger.error(f"Classification error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification failed: {str(e)}",
        )

    # Map to Pydantic response
    predictions = [
        SpeciesPrediction(
            species=p["species"],
            confidence=p["confidence"],
            rank=p["rank"],
            taxonomy=TaxonomyInfo(**p.get("taxonomy", {})),
        )
        for p in result["predictions"]
    ]

    return ClassificationResponse(
        predictions=predictions,
        model=result["model"],
        num_classes=result["num_classes"],
    )


@router.get(
    "/model-info",
    response_model=ModelInfoResponse,
    summary="Get model information",
    description="Returns metadata about the loaded CNN model including architecture, classes, and status.",
)
async def model_info() -> ModelInfoResponse:
    """Get information about the loaded classification model."""
    classifier = get_classifier()

    return ModelInfoResponse(
        model_name=classifier.config.get("model_name", "not_loaded"),
        num_classes=classifier.num_classes,
        image_size=classifier.config.get("image_size", 224),
        is_loaded=classifier.is_loaded,
        device=str(classifier.device) if classifier.device else "not_loaded",
        class_names=classifier.class_names,
    )
