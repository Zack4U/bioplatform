"""
Tests for app.api.v1_classify — Species classification endpoint.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.api.v1_classify import _build_predictions, _enrich_from_db, _validate_upload
from app.models.vision import SpeciesDbInfo


# ── _validate_upload ──────────────────────────────────────────────


class TestValidateUpload:
    """Test file upload validation helper."""

    def _make_upload(
        self,
        content_type: str = "image/jpeg",
        size: int = 100,
    ) -> tuple:
        file = MagicMock()
        file.content_type = content_type
        data = b"x" * size
        return file, data

    def test_valid_jpeg(self):
        file, data = self._make_upload("image/jpeg", 100)
        _validate_upload(file, data)  # no exception

    def test_valid_png(self):
        file, data = self._make_upload("image/png", 100)
        _validate_upload(file, data)

    def test_valid_webp(self):
        file, data = self._make_upload("image/webp", 100)
        _validate_upload(file, data)

    def test_invalid_content_type(self):
        file, data = self._make_upload("application/pdf", 100)
        with pytest.raises(HTTPException) as exc_info:
            _validate_upload(file, data)
        assert exc_info.value.status_code == 400
        assert "Invalid file type" in exc_info.value.detail

    def test_file_too_large(self):
        file, data = self._make_upload("image/jpeg", 11 * 1024 * 1024)
        with pytest.raises(HTTPException) as exc_info:
            _validate_upload(file, data)
        assert exc_info.value.status_code == 413

    def test_empty_file(self):
        file, _ = self._make_upload("image/jpeg", 0)
        with pytest.raises(HTTPException) as exc_info:
            _validate_upload(file, b"")
        assert exc_info.value.status_code == 400
        assert "Empty file" in exc_info.value.detail

    def test_none_content_type_allowed(self):
        """When content_type is None we skip the check."""
        file = MagicMock()
        file.content_type = None
        _validate_upload(file, b"some bytes")


# ── _enrich_from_db ───────────────────────────────────────────────


class TestEnrichFromDb:
    """Test DB enrichment helper."""

    @pytest.mark.asyncio
    async def test_species_not_found(self):
        with patch(
            "app.services.species_repository.get_species_by_scientific_name",
            new_callable=AsyncMock,
            return_value=None,
        ):
            result = await _enrich_from_db("Unknown species")
        assert result.found_in_db is False
        assert result.db_alert is not None

    @pytest.mark.asyncio
    async def test_species_found(self):
        mock_row = {
            "id": "abc-123",
            "common_name": "Abejorro de Caldas",
            "description": "Large bumblebee",
            "ecological_info": "Highland forests",
            "traditional_uses": None,
            "economic_potential": None,
            "conservation_status": "LC",
            "is_sensitive": False,
            "thumbnail_url": "https://example.com/img.jpg",
            "distributions": [
                {
                    "municipality": "Manizales",
                    "latitude": 5.068,
                    "longitude": -75.517,
                    "altitude": 2150.0,
                    "observation_date": None,
                },
            ],
        }
        with patch(
            "app.services.species_repository.get_species_by_scientific_name",
            new_callable=AsyncMock,
            return_value=mock_row,
        ):
            result = await _enrich_from_db("Bombus funebris")
        assert result.found_in_db is True
        assert result.species_id == "abc-123"
        assert result.common_name == "Abejorro de Caldas"
        assert len(result.distributions) == 1

    @pytest.mark.asyncio
    async def test_db_exception(self):
        with patch(
            "app.services.species_repository.get_species_by_scientific_name",
            new_callable=AsyncMock,
            side_effect=ConnectionError("DB down"),
        ):
            result = await _enrich_from_db("Some species")
        assert result.found_in_db is False
        assert "unavailable" in (result.db_alert or "").lower()


# ── _build_predictions ────────────────────────────────────────────


class TestBuildPredictions:
    """Test prediction enrichment and alerting."""

    @pytest.mark.asyncio
    async def test_low_confidence_alert(self):
        raw = [
            {
                "species": "Sp A",
                "confidence": 0.30,
                "rank": 1,
                "taxonomy": {},
            },
        ]
        with patch(
            "app.api.v1_classify._enrich_from_db",
            new_callable=AsyncMock,
            return_value=SpeciesDbInfo(found_in_db=False),
        ):
            preds = await _build_predictions(raw, f1_threshold=0.65)
        assert len(preds) == 1
        assert preds[0].low_confidence_alert is not None
        assert "Low confidence" in preds[0].low_confidence_alert

    @pytest.mark.asyncio
    async def test_high_confidence_no_alert(self):
        raw = [
            {
                "species": "Sp A",
                "confidence": 0.90,
                "rank": 1,
                "taxonomy": {"kingdom": "Animalia"},
            },
        ]
        with patch(
            "app.api.v1_classify._enrich_from_db",
            new_callable=AsyncMock,
            return_value=SpeciesDbInfo(found_in_db=False),
        ):
            preds = await _build_predictions(raw, f1_threshold=0.65)
        assert preds[0].low_confidence_alert is None
        assert preds[0].taxonomy.kingdom == "Animalia"


# ── API Endpoint Tests via httpx ──────────────────────────────────


class TestModelInfoEndpoint:
    """Test GET /api/v1/model-info."""

    @pytest.mark.asyncio
    async def test_model_info(self, app_client, mock_classifier):
        # mock_classifier.config is a plain dict, so .get() works natively
        resp = await app_client.get("/api/v1/model-info")
        assert resp.status_code == 200
        data = resp.json()
        assert "model_name" in data
        assert data["is_loaded"] is True
        assert data["num_classes"] == 10

    @pytest.mark.asyncio
    async def test_classify_model_not_loaded(self, app_client, mock_classifier):
        mock_classifier.is_loaded = False
        # Create a small valid file for the upload
        resp = await app_client.post(
            "/api/v1/classify",
            files={"file": ("test.jpg", b"fake image data", "image/jpeg")},
        )
        assert resp.status_code == 503
