"""
Tests for app.services.vision.classifier — SpeciesClassifier unit tests.

These tests do NOT require PyTorch installed. Model loading and inference
are tested via mocks; only init/properties/error paths are tested directly.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.services.vision.classifier import SpeciesClassifier, get_classifier


class TestSpeciesClassifierInit:
    """Test initial state before load_model is called."""

    def test_init_defaults(self):
        clf = SpeciesClassifier()
        assert clf.model is None
        assert clf.config == {}
        assert clf.class_names == []
        assert clf.class_info == {}
        assert clf.device is None
        assert clf.transform is None

    def test_is_loaded_default_false(self):
        clf = SpeciesClassifier()
        assert clf.is_loaded is False

    def test_num_classes_empty(self):
        clf = SpeciesClassifier()
        assert clf.num_classes == 0

    def test_num_classes_with_names(self):
        clf = SpeciesClassifier()
        clf.class_names = ["A", "B", "C"]
        assert clf.num_classes == 3


class TestClassifyNotLoaded:
    """Verify error handling when model is not loaded."""

    def test_classify_raises_when_not_loaded(self):
        clf = SpeciesClassifier()
        with pytest.raises(RuntimeError, match="Model not loaded"):
            clf.classify(b"fake image bytes")

    def test_preprocess_raises_when_no_transform(self):
        clf = SpeciesClassifier()
        # Create a minimal valid PNG image (1x1 pixel)
        from io import BytesIO
        from PIL import Image as PILImage

        buf = BytesIO()
        PILImage.new("RGB", (1, 1), color="red").save(buf, format="PNG")
        valid_png = buf.getvalue()

        with pytest.raises(RuntimeError, match="Model not loaded"):
            clf.preprocess_image(valid_png)


class TestLoadModelErrors:
    """Test load_model error paths without torch."""

    def test_load_model_no_config_file(self, tmp_path):
        """Raises FileNotFoundError when training_config.json is missing."""
        clf = SpeciesClassifier()

        with patch(
            "app.services.vision.classifier.WEIGHTS_DIR",
            tmp_path,
        ):
            # torch must be importable for this path
            mock_torch = MagicMock()
            mock_torch.cuda.is_available.return_value = False
            mock_torch.device.return_value = "cpu"

            with patch.dict("sys.modules", {"torch": mock_torch, "torchvision": MagicMock()}):
                with pytest.raises(FileNotFoundError, match="Training config not found"):
                    clf.load_model()


class TestGetClassifier:
    """Test the singleton factory function."""

    def test_returns_species_classifier(self):
        with patch(
            "app.services.vision.classifier._classifier_instance",
            None,
        ):
            result = get_classifier()
            assert isinstance(result, SpeciesClassifier)

    def test_returns_same_instance(self):
        instance = SpeciesClassifier()
        with patch(
            "app.services.vision.classifier._classifier_instance",
            instance,
        ):
            result = get_classifier()
            assert result is instance


class TestClassifierConstants:
    """Test module-level paths and constants."""

    def test_weights_dir_exists(self):
        from app.services.vision.classifier import WEIGHTS_DIR, PROCESSED_DIR
        # These are Path objects resolved from __file__
        assert WEIGHTS_DIR.name == "weights"
        assert PROCESSED_DIR.name == "processed"

    def test_dropout_linear_build(self):
        """Test _DropoutLinear factory (only if torch is available)."""
        try:
            from app.services.vision.classifier import _DropoutLinear
            layer = _DropoutLinear.build(128, 10, dropout=0.3)
            assert layer.in_features == 128
            assert layer.out_features == 10
        except ImportError:
            pytest.skip("PyTorch not installed")

    def test_build_model_arch_unsupported(self):
        """Test error for unsupported model name."""
        try:
            from app.services.vision.classifier import _build_model_arch
            with pytest.raises(ValueError, match="Unsupported model"):
                _build_model_arch("invalid_model", 10)
        except ImportError:
            pytest.skip("PyTorch not installed")
