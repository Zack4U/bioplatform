"""
Shared fixtures and mocks for Bio.Backend.AI tests.
"""

from __future__ import annotations

import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

# Dynamic mock of torch if not installed, to prevent ModuleNotFoundError in test environment
try:
    import torch  # noqa: F401
except ImportError:
    mock_torch = MagicMock()
    mock_torch_cuda = MagicMock()
    mock_torch.cuda = mock_torch_cuda
    sys.modules["torch"] = mock_torch
    sys.modules["torch.cuda"] = mock_torch_cuda


# ── Settings Fixture ──────────────────────────────────────────────


@pytest.fixture()
def mock_settings():
    """Return a Settings instance with test defaults (no .env needed)."""
    from app.core.config import Settings

    return Settings(
        app_name="Test AI Service",
        app_version="0.0.1-test",
        debug=True,
        log_level="DEBUG",
        pg_host="testhost",
        pg_port=5433,
        pg_user="testuser",
        pg_password="testpass",
        pg_database="testdb",
        model_weights_path="test/weights.pth",
        bio_min_f1_threshold=0.65,
        cors_origins="*",
    )


# ── Classifier Mock ──────────────────────────────────────────────


@pytest.fixture()
def mock_classifier():
    """A MagicMock mimicking a loaded SpeciesClassifier."""
    clf = MagicMock()
    clf.is_loaded = True
    clf.active_version = "1.0.0"
    clf.num_classes = 10
    clf.class_names = [f"Species_{i}" for i in range(10)]
    clf.config = {
        "model_name": "efficientnet_b0",
        "image_size": 224,
    }
    clf.device = "cpu"
    clf.classify.return_value = {
        "predictions": [
            {
                "species": "Bombus funebris",
                "confidence": 0.92,
                "rank": 1,
                "taxonomy": {
                    "kingdom": "Animalia",
                    "phylum": "Arthropoda",
                    "class": "Insecta",
                    "order": "Hymenoptera",
                    "family": "Apidae",
                    "genus": "Bombus",
                },
            },
        ],
        "model": "efficientnet_b0",
        "num_classes": 10,
    }
    return clf


# ── FastAPI TestClient ────────────────────────────────────────────


@pytest.fixture()
def app_client(mock_classifier, mock_settings):
    """
    Yield an httpx.AsyncClient wired to the FastAPI app
    with classifier and DB mocked out.
    """
    with (
        patch(
            "app.services.vision.classifier.get_classifier",
            return_value=mock_classifier,
        ),
        patch(
            "app.api.v1_classify.get_classifier",
            return_value=mock_classifier,
        ),
        patch(
            "app.core.config.get_settings",
            return_value=mock_settings,
        ),
        patch(
            "app.core.database.check_db_connection",
            new_callable=AsyncMock,
            return_value=True,
        ),
    ):
        from app.core.auth import CurrentUser, get_current_user
        from app.main import app

        app.dependency_overrides[get_current_user] = lambda: CurrentUser(
            user_id="test", email="test@ex.com", name="Test", role="Admin"
        )

        transport = ASGITransport(app=app)
        client = AsyncClient(transport=transport, base_url="http://test")
        yield client

        app.dependency_overrides.clear()
