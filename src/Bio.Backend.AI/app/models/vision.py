"""
Pydantic Models for Vision/Classification API
================================================
Strict Pydantic schemas for request/response validation.
Follows FastAPI + Pydantic v2 patterns with Type Hints.
"""

from pydantic import BaseModel, Field


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


class SpeciesPrediction(BaseModel):
    """Single species prediction from the CNN."""
    species: str = Field(..., description="Predicted species name (binomial nomenclature)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence (0-1)")
    rank: int = Field(..., ge=1, description="Rank position in top-k predictions")
    taxonomy: TaxonomyInfo = Field(default_factory=TaxonomyInfo, description="Full taxonomy")


class ClassificationResponse(BaseModel):
    """Response from the species classification endpoint."""
    predictions: list[SpeciesPrediction] = Field(
        ..., description="Top-K species predictions ordered by confidence"
    )
    model: str = Field(..., description="Model architecture used (e.g., efficientnet_b0)")
    num_classes: int = Field(..., description="Total number of classes the model can predict")


class ClassificationRequest(BaseModel):
    """Optional query parameters for classification."""
    top_k: int = Field(default=5, ge=1, le=20, description="Number of top predictions to return")
    confidence_threshold: float = Field(
        default=0.01, ge=0.0, le=1.0,
        description="Minimum confidence threshold to include a prediction"
    )


class ModelInfoResponse(BaseModel):
    """Response with model metadata."""
    model_name: str = Field(..., description="Model architecture name")
    num_classes: int = Field(..., description="Number of species classes")
    image_size: int = Field(..., description="Expected input image size (pixels)")
    is_loaded: bool = Field(..., description="Whether the model is loaded and ready")
    device: str = Field(..., description="Inference device (cpu/cuda)")
    class_names: list[str] = Field(default=[], description="List of all species class names")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(..., description="Service status")
    service: str = Field(default="bio-ai-vision", description="Service name")
    model_loaded: bool = Field(..., description="Whether CNN model is loaded")
    num_classes: int = Field(default=0, description="Number of species classes")
