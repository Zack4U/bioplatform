"""
Tests for app.api.v1_training.
"""

from __future__ import annotations

import sys
from unittest.mock import patch

import pytest


class TestTrainingEndpoint:
    """Test POST /api/v1/training/finetune."""

    @pytest.mark.asyncio
    async def test_finetune_no_gpu(self, app_client):
        # Case 1: CUDA not available
        with (
            patch("torch.cuda.is_available", return_value=False),
        ):
            resp = await app_client.post(
                "/api/v1/training/finetune", json={"job_id": "job-123"}
            )
            assert resp.status_code == 422
            assert "No CUDA GPU" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_finetune_insufficient_vram(self, app_client, mock_settings):
        # Case 2: CUDA available but VRAM is low (e.g. 2 GB, setting min is 8 GB)
        mock_settings.min_vram_gb = 8.0
        with (
            patch("torch.cuda.is_available", return_value=True),
            patch("torch.cuda.mem_get_info", return_value=(2 * 1024**3, 16 * 1024**3)),
        ):
            resp = await app_client.post(
                "/api/v1/training/finetune", json={"job_id": "job-123"}
            )
            assert resp.status_code == 422
            assert "Insufficient VRAM" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_finetune_torch_import_error(self, app_client):
        # Case 3: PyTorch is not available / raise ImportError
        # We patch sys.modules to mock ImportError when importing torch
        with patch.dict(sys.modules, {"torch": None}):
            resp = await app_client.post(
                "/api/v1/training/finetune", json={"job_id": "job-123"}
            )
            assert resp.status_code == 422
            assert "PyTorch not installed" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_finetune_success(self, app_client, mock_settings):
        # Case 4: GPU available, sufficient VRAM
        mock_settings.min_vram_gb = 4.0
        with (
            patch("torch.cuda.is_available", return_value=True),
            patch("torch.cuda.mem_get_info", return_value=(10 * 1024**3, 16 * 1024**3)),
            patch("app.services.training.finetune_orchestrator.run_finetune"),
        ):
            resp = await app_client.post(
                "/api/v1/training/finetune",
                json={
                    "job_id": "job-123",
                    "epochs": 10,
                    "learning_rate": 0.001,
                    "replay_buffer_ratio": 0.2,
                },
            )
            assert resp.status_code == 202
            data = resp.json()
            assert data["status"] == "accepted"
            assert data["job_id"] == "job-123"
            assert "queued" in data["message"]
