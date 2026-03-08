"""
Tests for app.models.vision — Pydantic model validation.
"""

import pytest
from pydantic import ValidationError

from app.models.vision import (
    ClassificationRequest,
    ClassificationResponse,
    GeoDistribution,
    HealthResponse,
    ModelInfoResponse,
    SpeciesDbInfo,
    SpeciesPrediction,
    TaxonomyInfo,
)


# ── TaxonomyInfo ──────────────────────────────────────────────────


class TestTaxonomyInfo:
    def test_defaults(self):
        t = TaxonomyInfo()
        assert t.kingdom == ""
        assert t.phylum == ""
        assert t.class_name == ""
        assert t.order == ""
        assert t.family == ""
        assert t.genus == ""
        assert t.iucn_status == ""

    def test_alias_class(self):
        t = TaxonomyInfo(**{"class": "Insecta", "kingdom": "Animalia"})
        assert t.class_name == "Insecta"
        dumped = t.model_dump(by_alias=True)
        assert dumped["class"] == "Insecta"

    def test_full_taxonomy(self):
        t = TaxonomyInfo(
            kingdom="Animalia",
            phylum="Arthropoda",
            order="Hymenoptera",
            family="Apidae",
            genus="Bombus",
            iucn_status="LC",
        )
        assert t.kingdom == "Animalia"
        assert t.genus == "Bombus"


# ── GeoDistribution ──────────────────────────────────────────────


class TestGeoDistribution:
    def test_required_municipality(self):
        with pytest.raises(ValidationError):
            GeoDistribution()

    def test_municipality_only(self):
        g = GeoDistribution(municipality="Manizales")
        assert g.municipality == "Manizales"
        assert g.latitude is None
        assert g.longitude is None
        assert g.altitude is None

    def test_full_distribution(self):
        g = GeoDistribution(
            municipality="Manizales",
            latitude=5.068,
            longitude=-75.517,
            altitude=2150.0,
            observation_date="2024-03-15",
        )
        assert g.latitude == 5.068
        assert g.observation_date == "2024-03-15"


# ── SpeciesDbInfo ─────────────────────────────────────────────────


class TestSpeciesDbInfo:
    def test_not_found(self):
        s = SpeciesDbInfo(
            found_in_db=False,
            db_alert="Not found",
        )
        assert s.found_in_db is False
        assert s.species_id is None
        assert s.distributions == []

    def test_found_with_data(self):
        s = SpeciesDbInfo(
            found_in_db=True,
            species_id="abc-123",
            common_name="Abejorro",
            description="Large bee",
            is_sensitive=True,
            distributions=[
                GeoDistribution(municipality="Manizales"),
            ],
        )
        assert s.found_in_db is True
        assert s.common_name == "Abejorro"
        assert len(s.distributions) == 1
        assert s.is_sensitive is True


# ── SpeciesPrediction ─────────────────────────────────────────────


class TestSpeciesPrediction:
    def test_minimal(self):
        p = SpeciesPrediction(species="Bombus funebris", confidence=0.9, rank=1)
        assert p.species == "Bombus funebris"
        assert p.low_confidence_alert is None
        assert isinstance(p.taxonomy, TaxonomyInfo)
        assert p.species_data.found_in_db is False

    def test_confidence_bounds(self):
        with pytest.raises(ValidationError):
            SpeciesPrediction(species="X", confidence=1.5, rank=1)
        with pytest.raises(ValidationError):
            SpeciesPrediction(species="X", confidence=-0.1, rank=1)

    def test_rank_bounds(self):
        with pytest.raises(ValidationError):
            SpeciesPrediction(species="X", confidence=0.5, rank=0)

    def test_with_alert(self):
        p = SpeciesPrediction(
            species="Unknown sp.",
            confidence=0.3,
            rank=1,
            low_confidence_alert="Low confidence",
        )
        assert p.low_confidence_alert == "Low confidence"


# ── ClassificationResponse ────────────────────────────────────────


class TestClassificationResponse:
    def test_full_response(self):
        r = ClassificationResponse(
            predictions=[
                SpeciesPrediction(species="Sp A", confidence=0.9, rank=1),
                SpeciesPrediction(species="Sp B", confidence=0.7, rank=2),
            ],
            model="efficientnet_b0",
            num_classes=300,
        )
        assert len(r.predictions) == 2
        assert r.model == "efficientnet_b0"
        assert r.confidence_alert is None

    def test_with_alert(self):
        r = ClassificationResponse(
            predictions=[],
            model="test",
            num_classes=1,
            confidence_alert="Low reliability",
        )
        assert r.confidence_alert == "Low reliability"


# ── ClassificationRequest ─────────────────────────────────────────


class TestClassificationRequest:
    def test_defaults(self):
        r = ClassificationRequest()
        assert r.top_k == 5
        assert r.confidence_threshold == 0.0

    def test_custom_values(self):
        r = ClassificationRequest(top_k=10, confidence_threshold=0.5)
        assert r.top_k == 10
        assert r.confidence_threshold == 0.5

    def test_top_k_bounds(self):
        with pytest.raises(ValidationError):
            ClassificationRequest(top_k=0)
        with pytest.raises(ValidationError):
            ClassificationRequest(top_k=21)


# ── ModelInfoResponse ─────────────────────────────────────────────


class TestModelInfoResponse:
    def test_creation(self):
        m = ModelInfoResponse(
            model_name="efficientnet_b0",
            num_classes=300,
            image_size=224,
            is_loaded=True,
            device="cuda",
            class_names=["sp1", "sp2"],
        )
        assert m.model_name == "efficientnet_b0"
        assert m.is_loaded is True
        assert len(m.class_names) == 2


# ── HealthResponse ────────────────────────────────────────────────


class TestHealthResponse:
    def test_healthy(self):
        h = HealthResponse(
            status="healthy",
            model_loaded=True,
            num_classes=300,
            database_connected=True,
        )
        assert h.status == "healthy"
        assert h.service == "bio-ai-vision"

    def test_degraded(self):
        h = HealthResponse(
            status="degraded",
            model_loaded=False,
        )
        assert h.database_connected is False
        assert h.num_classes == 0
