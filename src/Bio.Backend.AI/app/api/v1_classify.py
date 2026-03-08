"""
API v1 - Species Classification Endpoint
==========================================
POST /api/v1/classify  →  Classify a species image via CNN + DB enrichment.
GET  /api/v1/model-info →  Get model metadata and available classes.

Thin controller: receives request, delegates to SpeciesClassifier service,
then enriches top predictions with data from PostgreSQL.
"""

import logging
import time
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status

from app.models.vision import (
    ClassificationResponse,
    GeoDistribution,
    ModelInfoResponse,
    SpeciesDbInfo,
    SpeciesPrediction,
    TaxonomyInfo,
)
from app.services.vision.classifier import get_classifier

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Vision - Species Classification"])

# Maximum file size: 10 MB
MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}


async def _enrich_from_db(species_name: str) -> SpeciesDbInfo:
    """
    Lookup a species in PostgreSQL and return enriched data.
    Returns a SpeciesDbInfo with found_in_db=False + alert when not found.
    """
    try:
        from app.services.species_repository import get_species_by_scientific_name

        row = await get_species_by_scientific_name(species_name)
    except Exception as exc:
        logger.warning(f"DB enrichment failed for '{species_name}': {exc}")
        return SpeciesDbInfo(
            found_in_db=False,
            db_alert="Database connection unavailable. Showing CNN results only.",
        )

    if row is None:
        return SpeciesDbInfo(
            found_in_db=False,
            db_alert=(
                f"No database record found for '{species_name}'. "
                "Only CNN predictions are available."
            ),
        )

    distributions = [
        GeoDistribution(
            municipality=d.get("municipality", ""),
            latitude=d.get("latitude"),
            longitude=d.get("longitude"),
            altitude=d.get("altitude"),
            observation_date=(
                str(d["observation_date"]) if d.get("observation_date") else None
            ),
        )
        for d in row.get("distributions", [])
    ]

    return SpeciesDbInfo(
        found_in_db=True,
        db_alert=None,
        species_id=str(row["id"]),
        common_name=row.get("common_name"),
        description=row.get("description"),
        ecological_info=row.get("ecological_info"),
        traditional_uses=row.get("traditional_uses"),
        economic_potential=row.get("economic_potential"),
        conservation_status=row.get("conservation_status"),
        is_sensitive=row.get("is_sensitive", False),
        thumbnail_url=row.get("thumbnail_url"),
        distributions=distributions,
    )


@router.post(
    "/classify",
    response_model=ClassificationResponse,
    summary="Classify a species image",
    description=(
        "Upload an image of flora or fauna from Caldas, Colombia. "
        "The CNN model returns top-K species predictions with confidence "
        "scores, full taxonomic classification, and enriched data from "
        "the scientific database (PostgreSQL)."
    ),
)
async def classify_species(
    file: Annotated[UploadFile, File(description="Image file (JPEG, PNG, WebP)")],
    top_k: Annotated[int, Query(ge=1, le=20, description="Number of top predictions")] = 5,
    confidence_threshold: Annotated[
        float, Query(ge=0.0, le=1.0, description="Minimum confidence threshold")
    ] = 0.0,
) -> ClassificationResponse:
    """
    Classify a species image using the trained CNN model.

    - **file**: Image file (JPEG, PNG, WebP). Max 10 MB.
    - **top_k**: Number of top predictions to return (1-20).
    - **confidence_threshold**: Minimum confidence to include a prediction.

    Returns a list of predicted species with confidence scores, taxonomy,
    and enriched species data from PostgreSQL when available.
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
    start_time = time.monotonic()
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
    elapsed_ms = int((time.monotonic() - start_time) * 1000)

    # Confidence threshold from settings
    from app.core.config import get_settings

    f1_threshold = get_settings().bio_min_f1_threshold

    # Enrich top predictions with DB data
    predictions: list[SpeciesPrediction] = []
    for p in result["predictions"]:
        species_name = p["species"]
        taxonomy = TaxonomyInfo(**p.get("taxonomy", {}))
        species_data = await _enrich_from_db(species_name)

        # Low-confidence alert per prediction
        low_conf_alert = None
        if p["confidence"] < f1_threshold:
            low_conf_alert = (
                f"Low confidence ({p['confidence']:.1%}). "
                f"Below reliability threshold ({f1_threshold:.0%}). "
                "This prediction may not be accurate."
            )

        predictions.append(
            SpeciesPrediction(
                species=species_name,
                confidence=p["confidence"],
                rank=p["rank"],
                low_confidence_alert=low_conf_alert,
                taxonomy=taxonomy,
                species_data=species_data,
            )
        )

    # Global alert if even the top-1 prediction is below threshold
    global_alert = None
    if predictions and predictions[0].confidence < f1_threshold:
        global_alert = (
            f"Top prediction confidence ({predictions[0].confidence:.1%}) is below "
            f"the reliability threshold ({f1_threshold:.0%}). "
            "Results may be unreliable. Consider uploading a clearer image."
        )

    # Async: log prediction to DB (best-effort, don't block response)
    top_pred = result["predictions"][0] if result["predictions"] else None
    if top_pred:
        try:
            from app.services.species_repository import log_prediction

            await log_prediction(
                user_id=None,
                image_input_url="upload",
                raw_result=result["predictions"],
                confidence_score=top_pred["confidence"],
                predicted_species_id=None,
                model_version=result.get("model"),
                processing_time_ms=elapsed_ms,
            )
        except Exception as exc:
            logger.debug(f"Prediction logging skipped: {exc}")

    return ClassificationResponse(
        predictions=predictions,
        model=result["model"],
        num_classes=result["num_classes"],
        confidence_alert=global_alert,
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
