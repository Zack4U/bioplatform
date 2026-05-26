"""
Tests for app.services.training.finetune_orchestrator.
"""

from __future__ import annotations

import json
import signal
from pathlib import Path
from unittest.mock import ANY, AsyncMock, MagicMock, patch

import pytest

from app.services.training.finetune_orchestrator import (
    _execute_dvc_push,
    _execute_evaluation,
    _execute_onnx_export,
    _execute_training,
    _find_active_checkpoint,
    _find_latest_versioned_checkpoint,
    _generate_version,
    _get_classifier_active_checkpoint,
    _get_flat_checkpoint,
    _load_active_config,
    _notify_dotnet,
    _notify_dotnet_sync,
    _read_json_safe,
    _run_dataset_organization,
    _run_delta_download,
    _save_emergency_checkpoint,
    _sigterm_handler,
    _step_download_delta,
    run_finetune,
)


def test_generate_version():
    v = _generate_version("v2.1")
    assert v.startswith("v2.1.")
    assert len(v.split(".")) == 3


@pytest.mark.asyncio
async def test_notify_dotnet(mock_settings):
    mock_client = MagicMock()
    mock_client.post = AsyncMock()
    mock_client.__aenter__.return_value = mock_client

    with (
        patch("httpx.AsyncClient", return_value=mock_client),
        patch("app.core.config.get_settings", return_value=mock_settings),
    ):
        await _notify_dotnet("job-123", "Completed", "Success", "v1", 0.90, {}, {})
        mock_client.post.assert_called_once()


def test_notify_dotnet_sync(mock_settings):
    mock_client = MagicMock()
    mock_client.post = MagicMock()
    mock_client.__enter__.return_value = mock_client

    with (
        patch("httpx.Client", return_value=mock_client),
        patch("app.core.config.get_settings", return_value=mock_settings),
    ):
        _notify_dotnet_sync("job-123", "Completed", "Success", "v1", 0.90, {}, {})
        mock_client.post.assert_called_once()


def test_run_delta_download():
    # Case 1: Script exists, success run
    mock_run = MagicMock()
    mock_run.returncode = 0
    with (
        patch("pathlib.Path.exists", return_value=True),
        patch("subprocess.run", return_value=mock_run),
    ):
        _run_delta_download()

    # Case 2: Script doesn't exist
    with patch("pathlib.Path.exists", return_value=False):
        _run_delta_download()  # Should log warning and return

    # Case 3: Script failure
    mock_run.returncode = 1
    mock_run.stderr = "S3 down"
    with (
        patch("pathlib.Path.exists", return_value=True),
        patch("subprocess.run", return_value=mock_run),
    ):
        with pytest.raises(RuntimeError) as exc_info:
            _run_delta_download()
        assert "Delta download failed" in str(exc_info.value)


def test_run_dataset_organization():
    mock_completed_process = MagicMock()
    mock_completed_process.returncode = 0

    with (
        patch("pathlib.Path.exists", return_value=True),
        patch("subprocess.run", return_value=mock_completed_process) as mock_run,
    ):
        _run_dataset_organization(replay_ratio=0.15, seed=42, manifest_path=Path("/tmp/manifest.json"))
        assert mock_run.called

    # If it fails
    mock_completed_process.returncode = 1
    mock_completed_process.stderr = "Organization crash"
    with (
        patch("pathlib.Path.exists", return_value=True),
        patch("subprocess.run", return_value=mock_completed_process),
    ):
        with pytest.raises(RuntimeError) as exc_info:
            _run_dataset_organization(replay_ratio=0.15, seed=42, manifest_path=Path("/tmp/manifest.json"))
        assert "Dataset organization failed" in str(exc_info.value)


def test_read_json_safe():
    # File does not exist
    with patch("pathlib.Path.exists", return_value=False):
        assert _read_json_safe(Path("/tmp/missing.json")) is None

    # Normal success path
    mock_file = MagicMock()
    mock_file.__enter__.return_value = mock_file
    mock_file.read.return_value = json.dumps({"a": 1})
    with (
        patch("pathlib.Path.exists", return_value=True),
        patch("builtins.open", return_value=mock_file),
    ):
        assert _read_json_safe(Path("/tmp/valid.json")) == {"a": 1}

    # Corrupt JSON / Read error
    mock_file.read.side_effect = IOError("Fail")
    with (
        patch("pathlib.Path.exists", return_value=True),
        patch("builtins.open", return_value=mock_file),
    ):
        assert _read_json_safe(Path("/tmp/corrupt.json")) is None


def test_get_classifier_active_checkpoint(mock_classifier):
    # Classifier loaded, legacy version
    mock_classifier.is_loaded = True
    mock_classifier.active_version = "legacy"
    with (
        patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier),
        patch("app.services.training.finetune_orchestrator._get_flat_checkpoint", return_value=Path("/tmp/flat")),
    ):
        assert _get_classifier_active_checkpoint() == Path("/tmp/flat")

    # Classifier loaded, custom version, exists
    mock_classifier.active_version = "v1.0.0"

    def mock_exists_side_effect(self):
        return True

    with (
        patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier),
        patch("pathlib.Path.exists", mock_exists_side_effect),
        patch("pathlib.Path.is_dir", return_value=True),
    ):
        expected = Path(
            "e:/Projects/bioplatform/src/Bio.Backend.AI/data/weights/v1.0.0/checkpoint.pth"
        )
        assert _get_classifier_active_checkpoint() == expected


def test_find_latest_versioned_checkpoint():
    mock_dir = MagicMock()
    mock_dir.is_dir.return_value = True
    mock_dir.name = "v1"
    mock_dir.__truediv__.side_effect = lambda x: Path(f"/weights/v1/{x}")

    with (
        patch.object(Path, "iterdir", return_value=[mock_dir]),
        patch("pathlib.Path.exists", return_value=True),
    ):
        ckpt = _find_latest_versioned_checkpoint()
        assert ckpt == Path("/weights/v1/checkpoint.pth")


def test_get_flat_checkpoint():
    # Only best_model exists
    def mock_exists(self):
        return self.name == "best_model.pth"

    with patch("pathlib.Path.exists", mock_exists):
        ckpt = _get_flat_checkpoint()
        assert ckpt.name == "best_model.pth"


def test_find_active_checkpoint():
    with (
        patch("app.services.training.finetune_orchestrator._get_classifier_active_checkpoint", return_value=None),
        patch("app.services.training.finetune_orchestrator._find_latest_versioned_checkpoint", return_value=None),
        patch("app.services.training.finetune_orchestrator._get_flat_checkpoint", return_value=Path("/tmp/flat")),
    ):
        assert _find_active_checkpoint() == Path("/tmp/flat")


def test_load_active_config(mock_classifier):
    # Running classifier config
    mock_classifier.is_loaded = True
    mock_classifier.config = {"epochs": 5}
    with patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier):
        cfg = _load_active_config(Path("/tmp/checkpoint.pth"))
        assert cfg == {"epochs": 5}

    # Configuration loaded from file
    mock_classifier.is_loaded = False
    mock_file = MagicMock()
    mock_file.__enter__.return_value = mock_file
    mock_file.read.return_value = json.dumps({"epochs": 10})
    with (
        patch("app.services.vision.classifier.get_classifier", return_value=mock_classifier),
        patch("pathlib.Path.exists", return_value=True),
        patch("builtins.open", return_value=mock_file),
    ):
        cfg = _load_active_config(Path("/tmp/checkpoint.pth"))
        assert cfg == {"epochs": 10}


def test_step_download_delta():
    # Case 1: manifest is empty/delta = 0 -> returns False
    with (
        patch("app.services.training.finetune_orchestrator._notify_dotnet_sync"),
        patch("app.services.training.finetune_orchestrator._run_delta_download"),
        patch("app.services.training.finetune_orchestrator._read_json_safe", return_value={"new_images": []}),
    ):
        assert _step_download_delta("job", "v1") is False

    # Case 2: manifest has images -> returns True
    with (
        patch("app.services.training.finetune_orchestrator._notify_dotnet_sync"),
        patch("app.services.training.finetune_orchestrator._run_delta_download"),
        patch("app.services.training.finetune_orchestrator._read_json_safe", return_value={"new_images": ["img.jpg"]}),
    ):
        assert _step_download_delta("job", "v1") is True


def test_execute_training():
    # Case 1: normal training success
    mock_run = MagicMock()
    mock_run.returncode = 0
    with patch("subprocess.run", return_value=mock_run):
        _execute_training(Path("/tmp"), 5, 0.001, {"model_name": "efficientnet_b0"}, Path("/tmp/resume"))

    # Case 2: training failed
    mock_run.returncode = 1
    mock_run.stderr = "CUDA out of memory"
    with patch("subprocess.run", return_value=mock_run):
        with pytest.raises(RuntimeError) as exc_info:
            _execute_training(Path("/tmp"), 5, 0.001, {}, None)
        assert "Training failed" in str(exc_info.value)


def test_execute_evaluation():
    mock_run = MagicMock()
    mock_run.returncode = 0
    with (
        patch("pathlib.Path.exists", return_value=True),
        patch("subprocess.run", return_value=mock_run),
    ):
        _execute_evaluation(Path("/tmp"))


def test_execute_onnx_export():
    mock_run = MagicMock()
    mock_run.returncode = 0
    with (
        patch("pathlib.Path.exists", return_value=True),
        patch("subprocess.run", return_value=mock_run),
    ):
        _execute_onnx_export(Path("/tmp"))


def test_execute_dvc_push():
    mock_run = MagicMock()
    mock_run.returncode = 0
    with patch("subprocess.run", return_value=mock_run):
        _execute_dvc_push(Path("/tmp"))


def test_save_emergency_checkpoint():
    with (
        patch("torch.save") as mock_save,
        patch("app.services.training.finetune_orchestrator._current_model", MagicMock()),
    ):
        _save_emergency_checkpoint(Path("/tmp"))
        mock_save.assert_called_once()


def test_sigterm_handler():
    with patch("app.services.training.finetune_orchestrator._shutdown_requested", False):
        _sigterm_handler(signal.SIGTERM, None)
        import app.services.training.finetune_orchestrator as f
        assert f._shutdown_requested is True


class TestRunFinetuneOrchestration:
    """Test full run_finetune background flow."""

    def test_run_finetune_success(self, mock_settings):
        with (
            patch("app.core.config.get_settings", return_value=mock_settings),
            patch("app.services.training.finetune_orchestrator._step_download_delta", return_value=True),
            patch("app.services.training.finetune_orchestrator._find_active_checkpoint", return_value=Path("ckpt")),
            patch("app.services.training.finetune_orchestrator._run_dataset_organization"),
            patch("app.services.training.finetune_orchestrator._load_active_config", return_value={"model_name": "resnet"}),
            patch("app.services.training.finetune_orchestrator._execute_training"),
            patch("app.services.training.finetune_orchestrator._execute_evaluation"),
            patch("app.services.training.finetune_orchestrator._execute_onnx_export"),
            patch("app.services.training.finetune_orchestrator._execute_dvc_push"),
            patch("app.services.training.finetune_orchestrator._read_json_safe", return_value={"best_val_accuracy": 0.92}),
            patch("app.services.training.finetune_orchestrator._notify_dotnet_sync") as mock_notify,
        ):
            run_finetune("job-123")
            # Verify completed notification is sent
            mock_notify.assert_any_call(
                job_id="job-123",
                status="Completed",
                message="Fine-tuning completed in 0.0 min. Accuracy: 0.9200",
                version=ANY,
                accuracy=0.92,
                config_json={"best_val_accuracy": 0.92},
                metrics_json={"best_val_accuracy": 0.92},
            )

    def test_run_finetune_no_delta(self, mock_settings):
        # Stop early because delta images == 0
        with (
            patch("app.core.config.get_settings", return_value=mock_settings),
            patch("app.services.training.finetune_orchestrator._step_download_delta", return_value=False),
            patch("app.services.training.finetune_orchestrator._notify_dotnet_sync") as mock_notify,
        ):
            run_finetune("job-123")
            # Should have returned early, training scripts not called
            mock_notify.assert_not_called()

    def test_run_finetune_pipeline_failure(self, mock_settings):
        # Crash in organization step
        with (
            patch("app.core.config.get_settings", return_value=mock_settings),
            patch("app.services.training.finetune_orchestrator._step_download_delta", return_value=True),
            patch("app.services.training.finetune_orchestrator._find_active_checkpoint", return_value=None),
            patch(
                "app.services.training.finetune_orchestrator._run_dataset_organization",
                side_effect=RuntimeError("Zip failed"),
            ),
            patch("app.services.training.finetune_orchestrator._notify_dotnet_sync") as mock_notify,
        ):
            run_finetune("job-123")
            mock_notify.assert_any_call(
                job_id="job-123",
                status="Failed",
                message=ANY,
                version=ANY,
            )
