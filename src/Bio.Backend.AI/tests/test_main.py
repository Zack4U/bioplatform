"""
Tests for app.main — FastAPI application, health and root endpoints.
"""

from __future__ import annotations

import pytest


class TestRootEndpoint:
    """Test GET / endpoint."""

    @pytest.mark.asyncio
    async def test_root_returns_service_info(self, app_client):
        resp = await app_client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "message" in data
        assert "BioPlatform" in data["message"]
        assert "docs" in data
        assert "endpoints" in data

    @pytest.mark.asyncio
    async def test_root_endpoints_list(self, app_client):
        resp = await app_client.get("/")
        data = resp.json()
        endpoints = data["endpoints"]
        assert "classify" in endpoints
        assert "model_info" in endpoints
        assert "health" in endpoints


class TestHealthEndpoint:
    """Test GET /health endpoint."""

    @pytest.mark.asyncio
    async def test_health_returns_status(self, app_client):
        resp = await app_client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "service" in data
        assert data["service"] == "bio-ai"
        assert "model_loaded" in data
        assert "database_connected" in data

    @pytest.mark.asyncio
    async def test_health_model_loaded(self, app_client, mock_classifier):
        mock_classifier.is_loaded = True
        resp = await app_client.get("/health")
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True

    @pytest.mark.asyncio
    async def test_health_model_not_loaded(self, app_client, mock_classifier):
        mock_classifier.is_loaded = False
        resp = await app_client.get("/health")
        data = resp.json()
        assert data["status"] == "degraded"


class TestAppMetadata:
    """Test FastAPI app configuration."""

    @pytest.mark.asyncio
    async def test_openapi_schema_available(self, app_client):
        resp = await app_client.get("/openapi.json")
        assert resp.status_code == 200
        schema = resp.json()
        assert "info" in schema
        assert schema["info"]["title"] == "Test AI Service"


class TestLifespan:
    """Test lifespan startup/shutdown coverage."""

    @pytest.mark.asyncio
    async def test_lifespan_startup_shutdown(self, mock_settings):
        from unittest.mock import AsyncMock, patch, MagicMock
        from app.main import lifespan, app

        mock_clf = MagicMock()
        mock_clf.load_model.side_effect = FileNotFoundError("no weights")
        mock_clf.num_classes = 0

        with (
            patch(
                "app.core.config.get_settings",
                return_value=mock_settings,
            ),
            patch(
                "app.services.vision.classifier.get_classifier",
                return_value=mock_clf,
            ),
            patch(
                "app.core.database.check_db_connection",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "app.core.database.dispose_engine",
                new_callable=AsyncMock,
            ) as mock_dispose,
        ):
            async with lifespan(app):
                pass  # startup and shutdown executed
            mock_dispose.assert_called_once()
