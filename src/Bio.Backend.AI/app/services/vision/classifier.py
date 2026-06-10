"""
Vision Service: Clasificacion de Especies con CNN
===================================================
Servicio de inferencia que carga el modelo entrenado y clasifica
imagenes de especies. Se usa desde el endpoint de FastAPI.

Sigue el patron de la arquitectura del proyecto:
    app/services/vision/classifier.py

Responsabilidades:
    - Cargar modelo y configuracion al iniciar
    - Preprocesar imagenes recibidas
    - Ejecutar inferencia y retornar Top-K predicciones
    - Hot-Reload via Pointer Swap (zero-downtime, sin bloqueos HTTP)
    - Manejar errores de forma robusta
"""

from __future__ import annotations

import asyncio
import json
import logging
from io import BytesIO
from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, Optional

import numpy as np
from PIL import Image

if TYPE_CHECKING:
    import torch
    import torch.nn as nn

logger = logging.getLogger(__name__)

# -- Resolve paths ------------------------------------------------------------
SERVICE_DIR = Path(__file__).resolve().parent
APP_DIR = SERVICE_DIR.parent.parent  # app/
PROJECT_ROOT = APP_DIR.parent  # Bio.Backend.AI/
WEIGHTS_DIR = PROJECT_ROOT / "data" / "weights"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"


class _DropoutLinear:
    """Factory that builds an nn.Linear subclass with preceding dropout at runtime."""

    @staticmethod
    def build(in_features: int, out_features: int, dropout: float = 0.3) -> "nn.Linear":
        import torch.nn as nn

        class _Impl(nn.Linear):
            def __init__(self, inf: int, outf: int, drop: float) -> None:
                super().__init__(inf, outf)
                self._drop = nn.Dropout(p=drop)

            def forward(self, x: "torch.Tensor") -> "torch.Tensor":  # type: ignore[override]
                return super().forward(self._drop(x))

        return _Impl(in_features, out_features, dropout)


def _build_model_arch(model_name: str, num_classes: int) -> "nn.Module":
    """Build the model architecture for the given model name."""
    import torch.nn as nn
    from torchvision import models

    if model_name == "efficientnet_b0":
        model = models.efficientnet_b0(weights=None)
        orig_layer = model.classifier[1]
        assert isinstance(orig_layer, nn.Linear)
        in_features: int = orig_layer.in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes),
        )
    elif model_name == "efficientnet_b2":
        model = models.efficientnet_b2(weights=None)
        orig_layer = model.classifier[1]
        assert isinstance(orig_layer, nn.Linear)
        in_features = orig_layer.in_features
        model.classifier = nn.Sequential(
            nn.Linear(in_features, 512),
            nn.BatchNorm1d(512),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.4),
            nn.Linear(512, num_classes),
        )
    elif model_name == "resnet50":
        model = models.resnet50(weights=None)
        in_features = model.fc.in_features
        model.fc = _DropoutLinear.build(
            in_features,
            num_classes,
            dropout=0.3,
        )
    elif model_name == "resnet101":
        model = models.resnet101(weights=None)
        in_features = model.fc.in_features
        model.fc = _DropoutLinear.build(
            in_features,
            num_classes,
            dropout=0.3,
        )
    else:
        raise ValueError(f"Unsupported model: {model_name}")
    return model


class SpeciesClassifier:
    """
    CNN-based species classifier for BioPlatform Caldas.

    Uses the Pointer Swap pattern for zero-downtime model reloads:
    new model is loaded in a background thread, then the reference
    is atomically swapped so in-flight requests are never blocked.

    Usage:
        classifier = SpeciesClassifier()
        classifier.load_model()
        result = classifier.classify(image_bytes)
    """

    def __init__(self) -> None:
        self.model: nn.Module | None = None
        self.config: dict[str, Any] = {}
        self.class_names: list[str] = []
        self.class_info: dict[str, Any] = {}
        self.device: torch.device | None = None
        self.transform: Callable[..., torch.Tensor] | None = None
        self._loaded = False
        self._active_version: str | None = None

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def num_classes(self) -> int:
        return len(self.class_names)

    @property
    def active_version(self) -> str | None:
        return self._active_version

    # -- Synchronous model loading (runs in thread for reload) ----------------

    def _load_model_sync(
        self,
        weights_path: Path,
        config_path: Path,
    ) -> tuple["nn.Module", dict[str, Any], list[str], "torch.device", Any]:
        """
        Load model weights and config synchronously.

        This is the heavy I/O operation that runs in a ThreadPoolExecutor
        during hot-reload so HTTP requests are never blocked.

        Returns (model, config, class_names, device, transform).
        """
        import torch
        from torchvision import transforms

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Load training config
        if not config_path.exists():
            raise FileNotFoundError(f"Training config not found: {config_path}")
        with open(config_path, encoding="utf-8") as f:
            config = json.load(f)

        class_names: list[str] = config.get("class_names", [])
        num_classes: int = config["num_classes"]
        model_name: str = config["model_name"]
        image_size: int = config.get("image_size", 224)

        logger.info(
            "Loading model: %s (%d classes) on %s", model_name, num_classes, device
        )

        # Build architecture and load weights
        model = _build_model_arch(model_name, num_classes)

        if not weights_path.exists():
            raise FileNotFoundError(f"Model weights not found: {weights_path}")

        # Support both full checkpoint and plain state_dict
        checkpoint = torch.load(weights_path, map_location=device, weights_only=False)
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            model.load_state_dict(checkpoint["model_state_dict"])
        else:
            model.load_state_dict(checkpoint)

        model = model.to(device)
        model.eval()

        # Build inference transform
        imagenet_mean = config.get("imagenet_mean", [0.485, 0.456, 0.406])
        imagenet_std = config.get("imagenet_std", [0.229, 0.224, 0.225])

        transform = transforms.Compose(
            [
                transforms.Resize(int(image_size * 1.14)),
                transforms.CenterCrop(image_size),
                transforms.ToTensor(),
                transforms.Normalize(imagenet_mean, imagenet_std),
            ]
        )

        return model, config, class_names, device, transform

    def load_model(
        self,
        weights_path: Optional[Path] = None,
        version: Optional[str] = None,
    ) -> None:
        """
        Load model weights, config, and class mappings.

        The active version is dictated by the DB registry (ai_model_versions),
        NOT by whatever is newest on disk. Callers must pass the version tag
        resolved from the DB (``version``) or an explicit ``weights_path``
        (used by pre-activation validation).

        Resolution order:
            1. explicit ``weights_path`` (validation flow)
            2. ``WEIGHTS_DIR/{version}/best_model.pth`` when ``version`` is given
            3. flat ``WEIGHTS_DIR/best_model.pth`` (legacy single-model layout)

        There is intentionally NO "auto-detect newest version" fallback:
        loading an unregistered/inactive model silently is exactly the bug
        this avoids.
        """
        if weights_path is None:
            if version:
                weights_path = WEIGHTS_DIR / version / "best_model.pth"
            else:
                weights_path = WEIGHTS_DIR / "best_model.pth"

        config_path = weights_path.parent / "training_config.json"
        if not config_path.exists():
            # Fallback to flat structure
            config_path = WEIGHTS_DIR / "training_config.json"

        model, config, class_names, device, transform = self._load_model_sync(
            weights_path,
            config_path,
        )

        self.model = model
        self.config = config
        self.class_names = class_names
        self.device = device
        self.transform = transform

        # Load class info (taxonomy) if available
        class_info_path = PROCESSED_DIR / "class_info.json"
        if class_info_path.exists():
            with open(class_info_path, encoding="utf-8") as f:
                self.class_info = json.load(f)

        self._loaded = True
        self._active_version = (
            weights_path.parent.name if weights_path.parent != WEIGHTS_DIR else "legacy"
        )
        logger.info(
            "Model loaded successfully. %d classes, device=%s, version=%s",
            len(class_names),
            device,
            self._active_version,
        )

    async def reload_model(self, version_path: Path) -> None:
        """
        Hot-reload model via Pointer Swap pattern.

        Loads the new model in a background thread (ThreadPoolExecutor)
        so HTTP requests are never blocked. Once loaded, the reference
        is swapped atomically in milliseconds.
        """
        import torch

        weights_path = version_path / "best_model.pth"
        config_path = version_path / "training_config.json"
        if not config_path.exists():
            config_path = WEIGHTS_DIR / "training_config.json"

        logger.info("Hot-reload starting for version: %s", version_path.name)

        loop = asyncio.get_event_loop()

        # Load in background thread — zero blocking of HTTP requests
        (
            new_model,
            new_config,
            new_class_names,
            new_device,
            new_transform,
        ) = await loop.run_in_executor(
            None,
            self._load_model_sync,
            weights_path,
            config_path,
        )

        # Reload class info
        class_info_path = PROCESSED_DIR / "class_info.json"
        new_class_info = {}
        if class_info_path.exists():
            with open(class_info_path, encoding="utf-8") as f:
                new_class_info = json.load(f)

        # -- Pointer Swap (atomic reference swap, milliseconds) --
        old_model = self.model
        self.model = new_model
        self.config = new_config
        self.class_names = new_class_names
        self.class_info = new_class_info
        self.device = new_device
        self.transform = new_transform
        self._active_version = version_path.name

        # Release old model from GPU/RAM
        del old_model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info(
            "Hot-reload complete. Version=%s, classes=%d, device=%s",
            self._active_version,
            len(new_class_names),
            new_device,
        )

    def suspend(self) -> None:
        """
        Unload the active model and pause classification.

        Used when an admin deactivates/deletes the active version and no
        other model is active. After this, ``is_loaded`` is False and
        /classify returns 503 until a model is activated again.
        """
        old_model = self.model
        self.model = None
        self.config = {}
        self.class_names = []
        self.class_info = {}
        self.transform = None
        self._loaded = False
        self._active_version = None

        del old_model
        try:
            import torch

            if torch.cuda.is_available():
                torch.cuda.empty_cache()
        except Exception:
            pass

        logger.info(
            "Model suspended. Classification paused until a version is activated."
        )

    def preprocess_image(self, image_bytes: bytes) -> "torch.Tensor":
        """Convert raw image bytes to a preprocessed tensor."""

        img = Image.open(BytesIO(image_bytes))

        # Convert to RGB (handle RGBA, palette, grayscale)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Apply transforms
        if self.transform is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        tensor: torch.Tensor = self.transform(img)

        # Add batch dimension: (C, H, W) -> (1, C, H, W)
        return tensor.unsqueeze(0)

    def classify(
        self,
        image_bytes: bytes,
        top_k: int = 5,
        confidence_threshold: float = 0.0,
    ) -> dict:
        """
        Classify a species image and return top-k predictions.

        Args:
            image_bytes: Raw image bytes (JPEG/PNG).
            top_k: Number of top predictions to return.
            confidence_threshold: Minimum confidence to include a prediction.

        Returns:
            {
                "predictions": [
                    {
                        "species": "Bombus funebris",
                        "confidence": 0.92,
                        "rank": 1,
                        "taxonomy": { "kingdom": "Animalia", ... }
                    },
                    ...
                ],
                "model": "efficientnet_b0",
                "num_classes": 300,
            }
        """
        import torch

        if not self._loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        # Preprocess
        input_tensor = self.preprocess_image(image_bytes).to(self.device)

        # Inference
        if self.model is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)

        # Get top-k
        probs_np = probabilities.cpu().numpy()[0]
        top_k_indices = np.argsort(probs_np)[::-1][:top_k]

        predictions = []
        for rank, idx in enumerate(top_k_indices, start=1):
            confidence = float(probs_np[idx])
            if confidence < confidence_threshold:
                continue

            raw_name = (
                self.class_names[idx] if idx < len(self.class_names) else f"class_{idx}"
            )
            # Display name: replace underscores with spaces
            species_name = raw_name.replace("_", " ")

            # Get taxonomy info - try both "Name Name" and "Name_Name" keys
            taxonomy = {}
            info = (
                self.class_info.get(species_name) or self.class_info.get(raw_name) or {}
            )
            if info:
                taxonomy = {
                    "scientific_name": info.get("scientific_name", ""),
                    "kingdom": info.get("kingdom", ""),
                    "phylum": info.get("phylum", ""),
                    "class": info.get("class", ""),
                    "order": info.get("order", ""),
                    "family": info.get("family", ""),
                    "genus": info.get("genus", ""),
                    "iucn_status": info.get("iucn_status", ""),
                }

            predictions.append(
                {
                    "species": species_name,
                    "confidence": round(confidence, 4),
                    "rank": rank,
                    "taxonomy": taxonomy,
                }
            )

        return {
            "predictions": predictions,
            "model": self.config.get("model_name", "unknown"),
            "num_classes": self.num_classes,
        }


# -- Singleton Instance -------------------------------------------------------
# Used by FastAPI dependency injection
_classifier_instance: Optional[SpeciesClassifier] = None


def get_classifier() -> SpeciesClassifier:
    """Get or create the singleton classifier instance."""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = SpeciesClassifier()
    return _classifier_instance
