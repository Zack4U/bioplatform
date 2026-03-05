"""
Script 04: Entrenamiento de CNN para Clasificación de Especies
================================================================
Entrena un modelo EfficientNet-B0 (o ResNet50) con Transfer Learning
para clasificar especies de biodiversidad de Caldas, Colombia.

Características:
  - Transfer Learning desde ImageNet
  - Data Augmentation (random crop, flip, color jitter, rotation)
  - Learning Rate Scheduler (Cosine Annealing con Warmup)
  - Early Stopping con paciencia configurable
  - Class Weights para manejar desbalance
  - Checkpoints automáticos del mejor modelo
  - Logging de métricas (loss, accuracy, per-class)
  - Compatible con GPU (CUDA) y CPU

Uso:
    python scripts/04_train_cnn.py [--model efficientnet_b0] [--epochs 50]
                                    [--batch-size 32] [--lr 0.001]
                                    [--patience 10] [--image-size 224]
                                    [--freeze-epochs 5] [--unfreeze-lr 0.0001]

Requisitos:
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
    # o para CPU: pip install torch torchvision

Salida:
    data/weights/
    ├── best_model.pth          ← Mejor checkpoint (val_accuracy)
    ├── final_model.pth         ← Modelo al final del entrenamiento
    ├── training_config.json    ← Configuración usada
    └── training_history.json   ← Métricas por época
"""

import argparse
import json
import sys
import time
from pathlib import Path

import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, WeightedRandomSampler
    from torchvision import datasets, models, transforms
except ImportError:
    print("[ERROR] PyTorch not installed. Run:")
    print("  pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121")
    print("  # For CPU only: pip install torch torchvision")
    sys.exit(1)

from tqdm import tqdm

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
WEIGHTS_DIR = PROJECT_ROOT / "data" / "weights"


class _DropoutLinear(nn.Linear):
    """nn.Linear with preceding dropout – subclasses Linear for type safety."""

    def __init__(self, in_features: int, out_features: int, dropout: float = 0.3) -> None:
        super().__init__(in_features, out_features)
        self._drop = nn.Dropout(p=dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
        return super().forward(self._drop(x))


# ── Data Augmentation & Transforms ────────────────────────────────

def get_transforms(image_size: int = 224) -> dict[str, transforms.Compose]:
    """
    Returns train and validation transforms.
    Train: heavy augmentation for generalization.
    Val/Test: only resize + normalize.
    """
    # ImageNet normalization
    imagenet_mean = [0.485, 0.456, 0.406]
    imagenet_std = [0.229, 0.224, 0.225]

    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(image_size, scale=(0.7, 1.0)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.1),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(
            brightness=0.3, contrast=0.3, saturation=0.3, hue=0.1
        ),
        transforms.RandomAffine(degrees=0, translate=(0.1, 0.1)),
        transforms.RandomGrayscale(p=0.05),
        transforms.ToTensor(),
        transforms.Normalize(imagenet_mean, imagenet_std),
        transforms.RandomErasing(p=0.1),
    ])

    val_transform = transforms.Compose([
        transforms.Resize(int(image_size * 1.14)),  # ~256 for 224
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
        transforms.Normalize(imagenet_mean, imagenet_std),
    ])

    return {"train": train_transform, "val": val_transform, "test": val_transform}


# ── Model Builder ─────────────────────────────────────────────────

def build_model(
    model_name: str,
    num_classes: int,
    pretrained: bool = True,
) -> nn.Module:
    """
    Build a classification model with Transfer Learning.
    Supports: efficientnet_b0, efficientnet_b2, resnet50, resnet101.
    """
    if model_name == "efficientnet_b0":
        weights = models.EfficientNet_B0_Weights.IMAGENET1K_V1 if pretrained else None
        model = models.efficientnet_b0(weights=weights)
        orig_layer = model.classifier[1]
        assert isinstance(orig_layer, nn.Linear)
        in_features: int = orig_layer.in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(in_features, num_classes),
        )

    elif model_name == "efficientnet_b2":
        weights = models.EfficientNet_B2_Weights.IMAGENET1K_V1 if pretrained else None
        model = models.efficientnet_b2(weights=weights)
        orig_layer = model.classifier[1]
        assert isinstance(orig_layer, nn.Linear)
        in_features = orig_layer.in_features
        model.classifier = nn.Sequential(
            nn.Dropout(p=0.4),
            nn.Linear(in_features, num_classes),
        )

    elif model_name == "resnet50":
        weights = models.ResNet50_Weights.IMAGENET1K_V2 if pretrained else None
        model = models.resnet50(weights=weights)
        in_features = model.fc.in_features
        model.fc = _DropoutLinear(in_features, num_classes, dropout=0.3)

    elif model_name == "resnet101":
        weights = models.ResNet101_Weights.IMAGENET1K_V2 if pretrained else None
        model = models.resnet101(weights=weights)
        in_features = model.fc.in_features
        model.fc = _DropoutLinear(in_features, num_classes, dropout=0.3)

    else:
        raise ValueError(f"Unsupported model: {model_name}. "
                         f"Use: efficientnet_b0, efficientnet_b2, resnet50, resnet101")

    return model


def freeze_backbone(model: nn.Module, model_name: str) -> None:
    """Freeze all layers except the classification head."""
    if "efficientnet" in model_name:
        # EfficientNet backbone is in 'features' attribute
        features = getattr(model, "features", None)
        if features is not None:
            for param in features.parameters():
                param.requires_grad = False
    elif "resnet" in model_name:
        for name, param in model.named_parameters():
            if "fc" not in name:
                param.requires_grad = False


def unfreeze_backbone(model: nn.Module) -> None:
    """Unfreeze all layers for fine-tuning."""
    for param in model.parameters():
        param.requires_grad = True


# ── Weighted Sampler for Class Imbalance ──────────────────────────

def get_weighted_sampler(dataset: datasets.ImageFolder) -> WeightedRandomSampler:
    """Create a weighted random sampler to handle class imbalance."""
    targets = np.array(dataset.targets)
    class_counts = np.bincount(targets)
    class_weights = 1.0 / class_counts
    sample_weights = class_weights[targets]

    return WeightedRandomSampler(
        weights=sample_weights.tolist(),
        num_samples=len(sample_weights),
        replacement=True,
    )


# ── Training Loop ─────────────────────────────────────────────────

def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    device: torch.device,
    epoch: int,
) -> tuple[float, float]:
    """Train for one epoch. Returns (avg_loss, accuracy)."""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    pbar = tqdm(loader, desc=f"  Train Epoch {epoch}", leave=False)
    for inputs, labels in pbar:
        inputs, labels = inputs.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * inputs.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

        pbar.set_postfix(loss=f"{loss.item():.4f}", acc=f"{100.0 * correct / total:.1f}%")

    avg_loss = running_loss / total
    accuracy = correct / total
    return avg_loss, accuracy


@torch.no_grad()
def validate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> tuple[float, float]:
    """Validate model. Returns (avg_loss, accuracy)."""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    for inputs, labels in loader:
        inputs, labels = inputs.to(device), labels.to(device)
        outputs = model(inputs)
        loss = criterion(outputs, labels)

        running_loss += loss.item() * inputs.size(0)
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    avg_loss = running_loss / total
    accuracy = correct / total
    return avg_loss, accuracy


# ── Main Training Pipeline ────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Train CNN for species classification (Transfer Learning)"
    )
    parser.add_argument("--model", type=str, default="efficientnet_b0",
                        choices=["efficientnet_b0", "efficientnet_b2", "resnet50", "resnet101"])
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3,
                        help="Initial learning rate for classifier head")
    parser.add_argument("--freeze-epochs", type=int, default=5,
                        help="Epochs to train with frozen backbone")
    parser.add_argument("--unfreeze-lr", type=float, default=1e-4,
                        help="Learning rate after unfreezing backbone")
    parser.add_argument("--patience", type=int, default=10,
                        help="Early stopping patience")
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--label-smoothing", type=float, default=0.1)
    args = parser.parse_args()

    # ── Setup ──────────────────────────────────────────────────────
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"\n{'=' * 60}")
    print("  CNN TRAINING PIPELINE - BioPlatform Caldas")
    print(f"{'=' * 60}")
    print(f"  Device:     {device}")
    if device.type == "cuda":
        print(f"  GPU:        {torch.cuda.get_device_name(0)}")
        print(f"  VRAM:       {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
    print(f"  Model:      {args.model}")
    print(f"  Image size: {args.image_size}px")
    print(f"  Batch size: {args.batch_size}")
    print(f"  Epochs:     {args.epochs} (freeze: {args.freeze_epochs})")
    print(f"  LR:         {args.lr} → {args.unfreeze_lr} (after unfreeze)")
    print(f"{'=' * 60}\n")

    # ── Verify data ────────────────────────────────────────────────
    train_dir = PROCESSED_DIR / "train"
    val_dir = PROCESSED_DIR / "val"
    if not train_dir.exists() or not val_dir.exists():
        print("[ERROR] Processed dataset not found!")
        print("  → Run: python scripts/03_organize_dataset.py")
        sys.exit(1)

    # ── Load class mapping ─────────────────────────────────────────
    class_mapping_path = PROCESSED_DIR / "class_mapping.json"
    if class_mapping_path.exists():
        with open(class_mapping_path) as f:
            class_mapping = json.load(f)
        num_classes = len(class_mapping)
    else:
        num_classes = len(list(train_dir.iterdir()))

    print(f"[INFO] Number of classes: {num_classes}")

    # ── Datasets ───────────────────────────────────────────────────
    data_transforms = get_transforms(args.image_size)

    train_dataset = datasets.ImageFolder(str(train_dir), transform=data_transforms["train"])
    val_dataset = datasets.ImageFolder(str(val_dir), transform=data_transforms["val"])

    print(f"[INFO] Train images: {len(train_dataset):,}")
    print(f"[INFO] Val images:   {len(val_dataset):,}")

    # Weighted sampler for class imbalance
    sampler = get_weighted_sampler(train_dataset)

    train_loader = DataLoader(
        train_dataset, batch_size=args.batch_size,
        sampler=sampler, num_workers=args.workers,
        pin_memory=True, drop_last=True,
    )
    val_loader = DataLoader(
        val_dataset, batch_size=args.batch_size,
        shuffle=False, num_workers=args.workers,
        pin_memory=True,
    )

    # ── Model ──────────────────────────────────────────────────────
    model = build_model(args.model, num_classes, pretrained=True)
    model = model.to(device)

    # Count parameters
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[INFO] Total parameters:     {total_params:,}")
    print(f"[INFO] Trainable parameters: {trainable_params:,}")

    # ── Loss with Label Smoothing ──────────────────────────────────
    criterion = nn.CrossEntropyLoss(label_smoothing=args.label_smoothing)

    # ── Phase 1: Train Head Only (Frozen Backbone) ─────────────────
    freeze_backbone(model, args.model)
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr, weight_decay=args.weight_decay,
    )

    WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
    history: list[dict] = []
    best_val_acc = 0.0
    patience_counter = 0
    start_time = time.time()

    print(f"\n{'─' * 50}")
    print("  Phase 1: Training classifier head (backbone frozen)")
    print(f"  Epochs: 1-{args.freeze_epochs}")
    print(f"{'─' * 50}")

    for epoch in range(1, args.freeze_epochs + 1):
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device, epoch
        )
        val_loss, val_acc = validate(model, val_loader, criterion, device)

        epoch_data = {
            "epoch": epoch,
            "phase": "frozen",
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 4),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 4),
        }
        history.append(epoch_data)

        print(f"  Epoch {epoch:3d} │ "
              f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} │ "
              f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), WEIGHTS_DIR / "best_model.pth")

    # ── Phase 2: Fine-tune Entire Model ────────────────────────────
    print(f"\n{'─' * 50}")
    print("  Phase 2: Fine-tuning full model (backbone unfrozen)")
    print(f"  Epochs: {args.freeze_epochs + 1}-{args.epochs}")
    print(f"{'─' * 50}")

    unfreeze_backbone(model)
    optimizer = optim.AdamW(
        model.parameters(),
        lr=args.unfreeze_lr, weight_decay=args.weight_decay,
    )

    # Cosine Annealing LR Scheduler
    remaining_epochs = args.epochs - args.freeze_epochs
    scheduler = optim.lr_scheduler.CosineAnnealingLR(
        optimizer, T_max=remaining_epochs, eta_min=1e-6,
    )

    for epoch in range(args.freeze_epochs + 1, args.epochs + 1):
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device, epoch
        )
        val_loss, val_acc = validate(model, val_loader, criterion, device)
        scheduler.step()

        current_lr = optimizer.param_groups[0]["lr"]
        epoch_data = {
            "epoch": epoch,
            "phase": "finetune",
            "train_loss": round(train_loss, 4),
            "train_acc": round(train_acc, 4),
            "val_loss": round(val_loss, 4),
            "val_acc": round(val_acc, 4),
            "lr": round(current_lr, 7),
        }
        history.append(epoch_data)

        improved = ""
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            torch.save(model.state_dict(), WEIGHTS_DIR / "best_model.pth")
            improved = " ★ BEST"
        else:
            patience_counter += 1

        print(f"  Epoch {epoch:3d} │ "
              f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} │ "
              f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f} │ "
              f"LR: {current_lr:.2e}{improved}")

        # Early stopping
        if patience_counter >= args.patience:
            print(f"\n  ⏹ Early stopping at epoch {epoch} (patience={args.patience})")
            break

    # ── Save final model and metadata ──────────────────────────────
    elapsed = time.time() - start_time
    torch.save(model.state_dict(), WEIGHTS_DIR / "final_model.pth")

    # Save training config
    config = {
        "model_name": args.model,
        "num_classes": num_classes,
        "image_size": args.image_size,
        "batch_size": args.batch_size,
        "initial_lr": args.lr,
        "finetune_lr": args.unfreeze_lr,
        "freeze_epochs": args.freeze_epochs,
        "total_epochs_trained": len(history),
        "best_val_accuracy": round(best_val_acc, 4),
        "label_smoothing": args.label_smoothing,
        "weight_decay": args.weight_decay,
        "training_time_seconds": round(elapsed),
        "device": str(device),
        "pytorch_version": torch.__version__,
        "class_names": train_dataset.classes,
        "imagenet_mean": [0.485, 0.456, 0.406],
        "imagenet_std": [0.229, 0.224, 0.225],
    }
    with open(WEIGHTS_DIR / "training_config.json", "w") as f:
        json.dump(config, f, indent=2)

    # Save training history
    with open(WEIGHTS_DIR / "training_history.json", "w") as f:
        json.dump(history, f, indent=2)

    # ── Summary ────────────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print("  TRAINING COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Best Val Accuracy: {best_val_acc:.4f} ({best_val_acc * 100:.1f}%)")
    print(f"  Total Epochs:      {len(history)}")
    print(f"  Training Time:     {elapsed / 60:.1f} minutes")
    print(f"  Model saved:       {WEIGHTS_DIR / 'best_model.pth'}")
    print(f"  Config saved:      {WEIGHTS_DIR / 'training_config.json'}")
    print("\n  Next: python scripts/05_evaluate_model.py")


if __name__ == "__main__":
    main()
