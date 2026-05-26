"""
Tests for app.api.v1_metrics.
"""

from __future__ import annotations

import json
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from app.api.v1_metrics import (
    _build_f1_histogram,
    _build_support_distribution,
    _get_metrics_path,
)


def test_build_f1_histogram():
    per_class = {
        "Species A": {"f1_score": 0.05},
        "Species B": {"f1_score": 0.15},
        "Species C": {"f1_score": 0.95},
        "Species D": {"f1_score": 1.0},
    }
    hist = _build_f1_histogram(per_class)
    assert hist["labels"] == [
        "0-.1", ".1-.2", ".2-.3", ".3-.4", ".4-.5",
        ".5-.6", ".6-.7", ".7-.8", ".8-.9", ".9-1.0",
    ]
    # Species A is in bin 0 (0 <= 0.05 < 0.1) -> index 0
    # Species B is in bin 1 (0.1 <= 0.15 < 0.2) -> index 1
    # Species C and D are in bin 9 (0.9 <= f < 1.01) -> index 9
    assert hist["counts"] == [1, 1, 0, 0, 0, 0, 0, 0, 0, 2]


def test_build_support_distribution():
    per_class = {
        "Species A": {"support": 3},
        "Species B": {"support": 5},
        "Species C": {"support": 6},
        "Species D": {"support": 10},
        "Species E": {"support": 11},
        "Species F": {"support": 15},
        "Species G": {"support": 20},
    }
    dist = _build_support_distribution(per_class)
    assert dist == {
        "≤5": 2,      # A, B
        "6-10": 2,    # C, D
        "11-15": 2,   # E, F
        "16+": 1,     # G
    }


def test_get_metrics_path_legacy_or_not_loaded(mock_classifier):
    # Case 1: classifier loaded, active version is "legacy"
    mock_classifier.is_loaded = True
    mock_classifier.active_version = "legacy"
    with patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier):
        path = _get_metrics_path()
        assert "evaluation_metrics.json" in path.name
        assert "evaluation" in path.parent.name

    # Case 2: classifier not loaded
    mock_classifier.is_loaded = False
    with patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier):
        path = _get_metrics_path()
        assert "evaluation" in path.parent.name


def test_get_metrics_path_custom_version(mock_classifier):
    # Case 3: classifier loaded, active version is "v1.0.0", but path doesn't exist
    mock_classifier.is_loaded = True
    mock_classifier.active_version = "v1.0.0"
    with (
        patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier),
        patch.object(Path, "exists", return_value=False),
    ):
        path = _get_metrics_path()
        # Fallback to root evaluation
        assert "evaluation" in path.parent.name

    # Case 4: classifier loaded, active version is "v1.0.0", and path exists
    with (
        patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier),
        patch.object(Path, "exists", return_value=True),
    ):
        path = _get_metrics_path()
        assert "v1.0.0" in path.parts


class TestModelMetricsEndpoint:
    """Test model metrics API endpoint."""

    @pytest.mark.asyncio
    async def test_metrics_not_found(self, app_client):
        with patch.object(Path, "exists", return_value=False):
            resp = await app_client.get("/api/v1/model-metrics")
            assert resp.status_code == 404
            assert "not found" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_metrics_corrupt_json(self, app_client):
        mock_file = MagicMock()
        mock_file.__enter__.return_value = mock_file
        mock_file.read.side_effect = Exception("Read error")

        with (
            patch.object(Path, "exists", return_value=True),
            patch("builtins.open", return_value=mock_file),
        ):
            resp = await app_client.get("/api/v1/model-metrics")
            assert resp.status_code == 500
            assert "failed to read" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_metrics_success(self, app_client):
        metrics_data = {
            "accuracy": 0.88,
            "top_5_accuracy": 0.95,
            "macro_avg": {"precision": 0.85, "recall": 0.84, "f1_score": 0.84},
            "weighted_avg": {"precision": 0.89, "recall": 0.88, "f1_score": 0.88},
            "per_class": {
                "Bombus_funebris": {"precision": 0.90, "recall": 0.92, "f1_score": 0.91, "support": 10},
                "Cattleya_trianae": {"precision": 0.85, "recall": 0.80, "f1_score": 0.82, "support": 5},
            },
        }
        mock_file = MagicMock()
        mock_file.__enter__.return_value = mock_file
        mock_file.read.return_value = json.dumps(metrics_data)

        with (
            patch.object(Path, "exists", return_value=True),
            patch("builtins.open", return_value=mock_file),
        ):
            resp = await app_client.get("/api/v1/model-metrics")
            assert resp.status_code == 200
            data = resp.json()
            assert data["accuracy"] == 0.88
            assert data["total_evaluated_species"] == 2
            assert data["total_samples"] == 15
            assert "f1_histogram" in data
            assert "support_distribution" in data
