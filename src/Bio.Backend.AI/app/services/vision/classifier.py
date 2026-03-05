"""
Vision Service: Clasificación de Especies con CNN
===================================================
Servicio de inferencia que carga el modelo entrenado y clasifica
imágenes de especies. Se usa desde el endpoint de FastAPI.

Sigue el patrón de la arquitectura del proyecto:
    app/services/vision/classifier.py

Responsabilidades:
    - Cargar modelo y configuración al iniciar
    - Preprocesar imágenes recibidas
    - Ejecutar inferencia y retornar Top-K predicciones
    - Manejar errores de forma robusta
"""

from __future__ import annotations

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

# ── Resolve paths ──────────────────────────────────────────────────
SERVICE_DIR = Path(__file__).resolve().parent
APP_DIR = SERVICE_DIR.parent.parent          # app/
PROJECT_ROOT = APP_DIR.parent                # Bio.Backend.AI/
WEIGHTS_DIR = PROJECT_ROOT / "data" / "weights"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"


class _DropoutLinear:
    """Factory that builds an nn.Linear subclass with preceding dropout at runtime."""

    @staticmethod
    def build(in_features: int, out_features: int, dropout: float = 0.3) -> nn.Linear:
        import torch.nn as nn

        class _Impl(nn.Linear):
            def __init__(self, inf: int, outf: int, drop: float) -> None:
                super().__init__(inf, outf)
                self._drop = nn.Dropout(p=drop)

            def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
                return super().forward(self._drop(x))

        return _Impl(in_features, out_features, dropout)


class SpeciesClassifier:
    """
    CNN-based species classifier for BioPlatform Caldas.

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

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def num_classes(self) -> int:
        return len(self.class_names)

    def load_model(self, weights_path: Optional[Path] = None) -> None:
        """
        Load model weights, config, and class mappings.
        Called once at startup.
        """
        try:
            import torch
            import torch.nn as nn
            from torchvision import models, transforms
        except ImportError as e:
            raise RuntimeError(
                "PyTorch not installed. Run: pip install torch torchvision"
            ) from e

        # Determine device
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")

        # Load training config
        config_path = WEIGHTS_DIR / "training_config.json"
        if not config_path.exists():
            raise FileNotFoundError(f"Training config not found: {config_path}")

        with open(config_path) as f:
            self.config = json.load(f)

        self.class_names = self.config.get("class_names", [])
        num_classes = self.config["num_classes"]
        model_name = self.config["model_name"]
        image_size = self.config.get("image_size", 224)

        logger.info(f"Loading model: {model_name} ({num_classes} classes)")

        # Build model architecture
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
                nn.Dropout(p=0.4),
                nn.Linear(in_features, num_classes),
            )
        elif model_name == "resnet50":
            model = models.resnet50(weights=None)
            in_features = model.fc.in_features
            model.fc = _DropoutLinear.build(in_features, num_classes, dropout=0.3)
        elif model_name == "resnet101":
            model = models.resnet101(weights=None)
            in_features = model.fc.in_features
            model.fc = _DropoutLinear.build(in_features, num_classes, dropout=0.3)
        else:
            raise ValueError(f"Unsupported model: {model_name}")

        # Load weights
        if weights_path is None:
            weights_path = WEIGHTS_DIR / "best_model.pth"

        if not weights_path.exists():
            raise FileNotFoundError(f"Model weights not found: {weights_path}")

        model.load_state_dict(
            torch.load(weights_path, map_location=self.device, weights_only=True)
        )
        model = model.to(self.device)
        model.eval()
        self.model = model

        # Build inference transform
        imagenet_mean = self.config.get("imagenet_mean", [0.485, 0.456, 0.406])
        imagenet_std = self.config.get("imagenet_std", [0.229, 0.224, 0.225])

        self.transform = transforms.Compose([
            transforms.Resize(int(image_size * 1.14)),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize(imagenet_mean, imagenet_std),
        ])

        # Load class info (taxonomy) if available
        class_info_path = PROCESSED_DIR / "class_info.json"
        if class_info_path.exists():
            with open(class_info_path) as f:
                self.class_info = json.load(f)

        self._loaded = True
        logger.info(f"Model loaded successfully. {num_classes} classes, device={self.device}")

    def preprocess_image(self, image_bytes: bytes) -> torch.Tensor:
        """Convert raw image bytes to a preprocessed tensor."""

        img = Image.open(BytesIO(image_bytes))

        # Convert to RGB (handle RGBA, palette, grayscale)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Apply transforms
        if self.transform is None:
            raise RuntimeError("Model not loaded. Call load_model() first.")

        tensor: torch.Tensor = self.transform(img)

        # Add batch dimension: (C, H, W) → (1, C, H, W)
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

            raw_name = self.class_names[idx] if idx < len(self.class_names) else f"class_{idx}"
            # Display name: replace underscores with spaces
            species_name = raw_name.replace("_", " ")

            # Get taxonomy info – try both "Name Name" and "Name_Name" keys
            taxonomy = {}
            info = self.class_info.get(species_name) or self.class_info.get(raw_name) or {}
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

            predictions.append({
                "species": species_name,
                "confidence": round(confidence, 4),
                "rank": rank,
                "taxonomy": taxonomy,
            })

        return {
            "predictions": predictions,
            "model": self.config.get("model_name", "unknown"),
            "num_classes": self.num_classes,
        }


# ── Singleton Instance ─────────────────────────────────────────────
# Used by FastAPI dependency injection
_classifier_instance: Optional[SpeciesClassifier] = None


def get_classifier() -> SpeciesClassifier:
    """Get or create the singleton classifier instance."""
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = SpeciesClassifier()
    return _classifier_instance
