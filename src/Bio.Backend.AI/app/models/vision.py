"""
Pydantic Models for Vision/Classification API
================================================
Strict Pydantic schemas for request/response validation.
Follows FastAPI + Pydantic v2 patterns with Type Hints.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ── Taxonomy ───────────────────────────────────────────────────────


class TaxonomyInfo(BaseModel):
    """Taxonomic classification hierarchy."""
    kingdom: str = Field(default="", description="Biological kingdom (e.g., Animalia, Plantae)")
    phylum: str = Field(default="", description="Phylum/Division")
    class_name: str = Field(default="", alias="class", description="Taxonomic class")
    order: str = Field(default="", description="Taxonomic order")
    family: str = Field(default="", description="Taxonomic family")
    genus: str = Field(default="", description="Genus")
    iucn_status: str = Field(default="", description="IUCN Red List status (LC, VU, EN, CR, etc.)")

    model_config = {"populate_by_name": True}


# ── Geographic Distribution ───────────────────────────────────────


class GeoDistribution(BaseModel):
    """Geographic observation point (coordinates masked when species is sensitive)."""
    municipality: str = Field(..., description="Municipality name in Caldas")
    latitude: Optional[float] = Field(None, description="Latitude (null if species is sensitive)")
    longitude: Optional[float] = Field(None, description="Longitude (null if species is sensitive)")
    altitude: Optional[float] = Field(None, description="Altitude in meters")
    observation_date: Optional[str] = Field(None, description="Date of observation (ISO 8601)")


# ── Species DB Data ───────────────────────────────────────────────


class SpeciesDbInfo(BaseModel):
    """
    Enriched species data from PostgreSQL (BioCommerce_Scientific).
    Returns empty/null fields when the species is NOT in the database.
    """
    found_in_db: bool = Field(
        ..., description="Whether this species exists in the scientific database"
    )
    db_alert: Optional[str] = Field(
        default=None,
        description="Alert when species has no data in the database",
    )
    species_id: Optional[str] = Field(default=None, description="UUID of the species record")
    common_name: Optional[str] = Field(default=None, description="Common/vernacular name")
    description: Optional[str] = Field(default=None, description="Morphological description")
    ecological_info: Optional[str] = Field(default=None, description="Habitat and ecology")
    traditional_uses: Optional[str] = Field(default=None, description="Ethnobotanical / traditional uses")
    economic_potential: Optional[str] = Field(default=None, description="Sustainable economic potential")
    conservation_status: Optional[str] = Field(default=None, description="IUCN / Colombian Red Lists status")
    is_sensitive: Optional[bool] = Field(default=None, description="Sensitive species flag (location masked)")
    thumbnail_url: Optional[str] = Field(default=None, description="Thumbnail image URL")
    distributions: list[GeoDistribution] = Field(
        default_factory=list,
        description="Geographic distribution points (masked if sensitive)",
    )


# ── Prediction ─────────────────────────────────────────────────────


class SpeciesPrediction(BaseModel):
    """Single species prediction from the CNN, enriched with DB data."""
    species: str = Field(..., description="Predicted species name (binomial nomenclature)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence (0-1)")
    rank: int = Field(..., ge=1, description="Rank position in top-k predictions")
    low_confidence_alert: Optional[str] = Field(
        default=None,
        description="Warning when confidence is below the configured F1 threshold",
    )
    taxonomy: TaxonomyInfo = Field(default_factory=TaxonomyInfo, description="Full taxonomy")
    species_data: SpeciesDbInfo = Field(
        default_factory=lambda: SpeciesDbInfo(found_in_db=False),
        description="Enriched species info from the scientific database",
    )


class ClassificationResponse(BaseModel):
    """Response from the species classification endpoint."""
    predictions: list[SpeciesPrediction] = Field(
        ..., description="Top-K species predictions ordered by confidence"
    )
    model: str = Field(..., description="Model architecture used (e.g., efficientnet_b0)")
    num_classes: int = Field(..., description="Total number of classes the model can predict")
    confidence_alert: Optional[str] = Field(
        default=None,
        description="Global alert when top prediction is below the reliability threshold",
    )


class ClassificationRequest(BaseModel):
    """Optional query parameters for classification."""
    top_k: int = Field(default=5, ge=1, le=20, description="Number of top predictions to return")
    confidence_threshold: float = Field(
        default=0.0, ge=0.0, le=1.0,
        description="Minimum confidence threshold to include a prediction"
    )


# ── Model Info ─────────────────────────────────────────────────────


class ModelInfoResponse(BaseModel):
    """Response with model metadata."""
    model_config = {"protected_namespaces": ()}

    model_name: str = Field(..., description="Model architecture name")
    num_classes: int = Field(..., description="Number of species classes")
    image_size: int = Field(..., description="Expected input image size (pixels)")
    is_loaded: bool = Field(..., description="Whether the model is loaded and ready")
    device: str = Field(..., description="Inference device (cpu/cuda)")
    class_names: list[str] = Field(default=[], description="List of all species class names")


# ── Health ─────────────────────────────────────────────────────────


class HealthResponse(BaseModel):
    """Health check response."""
    model_config = {"protected_namespaces": ()}

    status: str = Field(..., description="Service status")
    service: str = Field(default="bio-ai-vision", description="Service name")
    model_loaded: bool = Field(..., description="Whether CNN model is loaded")
    num_classes: int = Field(default=0, description="Number of species classes")
    database_connected: bool = Field(
        default=False, description="Whether PostgreSQL is reachable"
    )
