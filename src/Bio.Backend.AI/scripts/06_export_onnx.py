"""
Script 06: Export del Modelo a ONNX (Opcional)
================================================
Exporta el modelo PyTorch entrenado a formato ONNX para:
  - Inferencia más rápida sin dependencia de PyTorch
  - Deploy en WebAssembly, ONNX Runtime, TensorRT
  - Integración en otros frameworks

Uso:
    python scripts/06_export_onnx.py

Salida:
    data/weights/model.onnx
"""

import json
import sys
from pathlib import Path

try:
    import torch
    import torch.nn as nn
    from torchvision import models
except ImportError:
    print("[ERROR] PyTorch not installed.")
    sys.exit(1)

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
WEIGHTS_DIR = PROJECT_ROOT / "data" / "weights"


def main() -> None:
    config_path = WEIGHTS_DIR / "training_config.json"
    weights_path = WEIGHTS_DIR / "best_model.pth"

    if not config_path.exists() or not weights_path.exists():
        print("[ERROR] Model not found. Train first with 04_train_cnn.py")
        sys.exit(1)

    with open(config_path) as f:
        config = json.load(f)

    model_name = config["model_name"]
    num_classes = config["num_classes"]
    image_size = config.get("image_size", 224)

    # Build model
    if model_name == "efficientnet_b0":
        model = models.efficientnet_b0(weights=None)
        in_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(nn.Dropout(0.3), nn.Linear(in_features, num_classes))
    elif model_name == "resnet50":
        model = models.resnet50(weights=None)
        in_features = model.fc.in_features
        model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(in_features, num_classes))
    else:
        print(f"[ERROR] ONNX export not implemented for {model_name}")
        sys.exit(1)

    model.load_state_dict(torch.load(weights_path, map_location="cpu", weights_only=True))
    model.eval()

    # Dummy input
    dummy_input = torch.randn(1, 3, image_size, image_size)
    onnx_path = WEIGHTS_DIR / "model.onnx"

    torch.onnx.export(
        model, dummy_input, str(onnx_path),
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["image"],
        output_names=["logits"],
        dynamic_axes={
            "image": {0: "batch_size"},
            "logits": {0: "batch_size"},
        },
    )

    print(f"[INFO] ONNX model exported to: {onnx_path}")
    print(f"  Size: {onnx_path.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
