"""
Tests for app.api.v1_model_registry.
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.api.v1_model_registry import (
    _collect_test_images,
    _dvc_push_and_notify,
    _evaluate_candidate,
    _generate_version_tag,
)


def test_generate_version_tag(mock_settings):
    with patch("app.core.config.get_settings", return_value=mock_settings):
        tag = _generate_version_tag()
        assert tag.startswith("v1.0.")


@pytest.mark.asyncio
async def test_dvc_push_and_notify(mock_settings):
    mock_run = MagicMock()
    mock_client = MagicMock()
    mock_client.post = AsyncMock()
    mock_client.__aenter__.return_value = mock_client

    with (
        patch("subprocess.run", mock_run),
        patch("httpx.AsyncClient", return_value=mock_client),
        patch("app.core.config.get_settings", return_value=mock_settings),
        patch("builtins.open", MagicMock()),
        patch("json.load", return_value={"best_val_accuracy": 0.88}),
    ):
        await _dvc_push_and_notify(Path("/tmp/version"), "v1.0.0")
        assert mock_run.call_count == 2
        mock_client.post.assert_called_once()


def test_collect_test_images():
    mock_class_dir = MagicMock()
    mock_class_dir.is_dir.return_value = True
    mock_class_dir.name = "Bombus_funebris"
    mock_class_dir.glob.side_effect = lambda pat: [Path("img1.jpg")] if "*.jpg" in pat else []

    mock_test_dir = MagicMock()
    mock_test_dir.iterdir.return_value = [mock_class_dir]

    images = _collect_test_images(mock_test_dir)
    assert len(images) == 1
    assert images[0] == (Path("img1.jpg"), "Bombus_funebris")


def test_evaluate_candidate():
    mock_candidate = MagicMock()
    # Correct prediction
    mock_candidate.classify.side_effect = [
        {"predictions": [{"species": "Bombus funebris"}]},  # matches Bombus_funebris after replace
        {"predictions": [{"species": "Wrong Species"}]},   # mismatch
        {"predictions": []},                               # empty predictions
    ]

    sample = [
        (Path("img1.jpg"), "Bombus_funebris"),
        (Path("img2.jpg"), "Bombus_funebris"),
        (Path("img3.jpg"), "Bombus_funebris"),
    ]

    with patch.object(Path, "read_bytes", return_value=b"fake"):
        acc = _evaluate_candidate(mock_candidate, sample)
        # 1 correct out of 3 -> 0.3333
        assert pytest.approx(acc, 0.01) == 0.33


class TestModelRegistryEndpoints:
    """Test v1 model registry API endpoints."""

    @pytest.mark.asyncio
    async def test_upload_success(self, app_client):
        # Successful upload
        with (
            patch("app.api.v1_model_registry._generate_version_tag", return_value="v1.0.0"),
            patch.object(Path, "mkdir"),
            patch.object(Path, "write_bytes"),
            patch.object(Path, "write_text"),
        ):
            resp = await app_client.post(
                "/api/v1/model/upload",
                files={
                    "weights_file": ("best_model.pth", b"weights", "application/octet-stream"),
                    "config_file": ("training_config.json", b"{}", "application/json"),
                    "metrics_file": ("evaluation_metrics.json", b"{}", "application/json"),
                },
                data={"notes": "Test upload"},
            )
            assert resp.status_code == 202
            assert resp.json()["status"] == "accepted"
            assert resp.json()["version"] == "v1.0.0"

    @pytest.mark.asyncio
    async def test_upload_failure(self, app_client):
        # Failed upload: file writing throws exception
        with (
            patch("app.api.v1_model_registry._generate_version_tag", return_value="v1.0.0"),
            patch.object(Path, "mkdir"),
            patch.object(Path, "write_bytes", side_effect=OSError("Permission denied")),
        ):
            resp = await app_client.post(
                "/api/v1/model/upload",
                files={
                    "weights_file": ("best_model.pth", b"weights", "application/octet-stream"),
                    "config_file": ("training_config.json", b"{}", "application/json"),
                    "metrics_file": ("evaluation_metrics.json", b"{}", "application/json"),
                },
            )
            assert resp.status_code == 500
            assert "failed to save" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_reload_not_found(self, app_client):
        with patch.object(Path, "exists", return_value=False):
            # Version path does not exist
            resp = await app_client.post("/api/v1/model/reload", json={"version": "v1.0.0"})
            assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_reload_weights_not_found(self, app_client):
        # Directory exists, but best_model.pth does not
        def mock_exists_side_effect(self):
            return self.name != "best_model.pth"

        with (
            patch.object(Path, "exists", autospec=True, side_effect=mock_exists_side_effect),
        ):
            resp = await app_client.post("/api/v1/model/reload", json={"version": "v1.0.0"})
            assert resp.status_code == 404
            assert "no best_model.pth" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_reload_success(self, app_client, mock_classifier):
        mock_classifier.active_version = "v1.0.0"
        with (
            patch.object(Path, "exists", return_value=True),
            patch.object(mock_classifier, "reload_model", new_callable=AsyncMock),
        ):
            resp = await app_client.post("/api/v1/model/reload", json={"version": "v1.0.0"})
            assert resp.status_code == 200
            assert resp.json()["status"] == "reloaded"

    @pytest.mark.asyncio
    async def test_reload_failure(self, app_client, mock_classifier):
        mock_classifier.active_version = "v1.0.0"
        with (
            patch.object(Path, "exists", return_value=True),
            patch.object(mock_classifier, "reload_model", new_callable=AsyncMock, side_effect=RuntimeError("Reload crash")),
        ):
            resp = await app_client.post("/api/v1/model/reload", json={"version": "v1.0.0"})
            assert resp.status_code == 200
            assert resp.json()["status"] == "error"
            assert "reload failed" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_validate_version_not_found(self, app_client):
        with patch.object(Path, "exists", return_value=False):
            resp = await app_client.post("/api/v1/model/validate?version=v1.0.0")
            assert resp.status_code == 404
            assert "version not found" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_validate_weights_not_found(self, app_client):
        def mock_exists(self):
            return self.name != "best_model.pth"

        with patch.object(Path, "exists", autospec=True, side_effect=mock_exists):
            resp = await app_client.post("/api/v1/model/validate?version=v1.0.0")
            assert resp.status_code == 404
            assert "no best_model.pth" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_validate_candidate_load_failure(self, app_client):
        def mock_exists(self):
            return True

        with (
            patch.object(Path, "exists", autospec=True, side_effect=mock_exists),
            patch("app.services.vision.classifier.SpeciesClassifier.load_model", side_effect=RuntimeError("PyTorch error")),
        ):
            resp = await app_client.post("/api/v1/model/validate?version=v1.0.0")
            assert resp.status_code == 422
            assert "failed to load candidate" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_validate_test_dir_not_found(self, app_client):
        def mock_exists(self):
            # Test dir doesn't exist
            return self.name != "test"

        with (
            patch.object(Path, "exists", autospec=True, side_effect=mock_exists),
            patch("app.services.vision.classifier.SpeciesClassifier.load_model"),
        ):
            resp = await app_client.post("/api/v1/model/validate?version=v1.0.0")
            assert resp.status_code == 200
            assert "no test directory found" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_validate_no_test_images(self, app_client):
        # Mock class directories existing but returning no glob files
        mock_class_dir = MagicMock()
        mock_class_dir.is_dir.return_value = True
        mock_class_dir.glob.return_value = []

        mock_test_dir = MagicMock()
        mock_test_dir.exists.return_value = True
        mock_test_dir.iterdir.return_value = [mock_class_dir]

        with (
            patch.object(Path, "exists", return_value=True),
            patch("app.services.vision.classifier.SpeciesClassifier.load_model"),
            patch("app.api.v1_model_registry._PROJECT_ROOT", Path("/tmp")),
            patch.object(Path, "iterdir", return_value=[mock_class_dir]),
        ):
            resp = await app_client.post("/api/v1/model/validate?version=v1.0.0")
            assert resp.status_code == 200
            assert "no test images found" in resp.json()["message"].lower()

    @pytest.mark.asyncio
    async def test_validate_run_accuracy_drop(self, app_client, mock_classifier, mock_settings):
        # Validation runs, but accuracy drops under threshold
        mock_classifier.is_loaded = True
        mock_classifier.config = {"best_val_accuracy": 0.90}
        mock_settings.validation_accuracy_drop_threshold = 0.05

        with (
            patch.object(Path, "exists", return_value=True),
            patch("app.services.vision.classifier.SpeciesClassifier.load_model"),
            patch("app.api.v1_model_registry._collect_test_images", return_value=[(Path("img1.jpg"), "Bombus_funebris")]),
            patch(
                "app.api.v1_model_registry._evaluate_candidate",
                return_value=0.80,
            ),  # accuracy = 0.80, drop = -0.10 (threshold 0.05)
            patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier),
            patch("app.core.config.get_settings", return_value=mock_settings),
        ):
            resp = await app_client.post("/api/v1/model/validate?version=v1.0.0")
            assert resp.status_code == 200
            data = resp.json()
            assert data["accuracy"] == 0.80
            assert data["accuracy_drop"] == -0.10
            assert data["is_safe_to_activate"] is False
            assert "warning" in data["message"].lower()
