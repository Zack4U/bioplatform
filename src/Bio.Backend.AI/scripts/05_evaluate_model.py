"""
Script 05: Evaluación Completa del Modelo CNN
================================================
Evalúa el modelo entrenado en el set de test generando:
  - Accuracy global, Top-5 Accuracy
  - Classification Report (precision, recall, F1 por clase)
  - Confusion Matrix (heatmap)
  - Per-class accuracy breakdown
  - Métricas exportadas como JSON para documentación

Uso:
    python scripts/05_evaluate_model.py [--batch-size 32] [--top-k 5]

Salida:
    data/evaluation/
    ├── classification_report.txt
    ├── confusion_matrix.png
    ├── per_class_metrics.csv
    ├── evaluation_metrics.json
    ├── top_k_accuracy.json
    └── misclassified_samples.json
"""

import argparse
import csv
import json
import sys
from pathlib import Path

import numpy as np

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader
    from torchvision import datasets, transforms
except ImportError:
    print("[ERROR] PyTorch not installed.")
    sys.exit(1)

from tqdm import tqdm

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
WEIGHTS_DIR = PROJECT_ROOT / "data" / "weights"
EVAL_DIR = PROJECT_ROOT / "data" / "evaluation"


class _DropoutLinear(nn.Linear):
    """nn.Linear with preceding dropout – subclasses Linear for type safety."""

    def __init__(self, in_features: int, out_features: int, dropout: float = 0.3) -> None:
        super().__init__(in_features, out_features)
        self._drop = nn.Dropout(p=dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
        return super().forward(self._drop(x))


def build_model_from_config(config: dict, weights_path: Path, device: torch.device) -> nn.Module:
    """Build model from training config (standalone, no external import)."""
    from torchvision import models

    model_name = config["model_name"]
    num_classes = config["num_classes"]

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
        model.fc = _DropoutLinear(in_features, num_classes, dropout=0.3)
    elif model_name == "resnet101":
        model = models.resnet101(weights=None)
        in_features = model.fc.in_features
        model.fc = _DropoutLinear(in_features, num_classes, dropout=0.3)
    else:
        raise ValueError(f"Unsupported model: {model_name}")

    model.load_state_dict(torch.load(weights_path, map_location=device, weights_only=True))
    model = model.to(device)
    model.eval()
    return model


@torch.no_grad()
def evaluate_model(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
    num_classes: int,
    top_k: int = 5,
) -> dict:
    """
    Run full evaluation on the test set.
    Returns all predictions, labels, top-k predictions, and file paths.
    """
    all_preds = []
    all_labels = []
    all_probs = []
    all_top_k_preds = []

    for inputs, labels in tqdm(loader, desc="  Evaluating", leave=False):
        inputs = inputs.to(device)
        outputs = model(inputs)
        probs = torch.softmax(outputs, dim=1)

        _, predicted = outputs.max(1)
        _, top_k_pred = probs.topk(min(top_k, num_classes), dim=1)

        all_preds.extend(predicted.cpu().numpy())
        all_labels.extend(labels.numpy())
        all_probs.extend(probs.cpu().numpy())
        all_top_k_preds.extend(top_k_pred.cpu().numpy())

    return {
        "predictions": np.array(all_preds),
        "labels": np.array(all_labels),
        "probabilities": np.array(all_probs),
        "top_k_predictions": np.array(all_top_k_preds),
    }


def compute_metrics(
    labels: np.ndarray,
    predictions: np.ndarray,
    top_k_predictions: np.ndarray,
    class_names: list[str],
    top_k: int = 5,
) -> dict:
    """Compute comprehensive classification metrics."""
    num_classes = len(class_names)

    # Overall accuracy
    accuracy = np.mean(predictions == labels)

    # Top-K accuracy
    top_k_correct = 0
    for i in range(len(labels)):
        if labels[i] in top_k_predictions[i]:
            top_k_correct += 1
    top_k_accuracy = top_k_correct / len(labels)

    # Per-class metrics
    per_class = {}
    for idx, name in enumerate(class_names):
        mask_true = labels == idx
        mask_pred = predictions == idx

        tp = np.sum(mask_true & mask_pred)
        fp = np.sum(~mask_true & mask_pred)
        fn = np.sum(mask_true & ~mask_pred)

        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
        support = int(np.sum(mask_true))

        per_class[name] = {
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "support": support,
        }

    # Macro and weighted averages
    precisions = [v["precision"] for v in per_class.values()]
    recalls = [v["recall"] for v in per_class.values()]
    f1s = [v["f1_score"] for v in per_class.values()]
    supports = [v["support"] for v in per_class.values()]
    total_support = sum(supports)

    macro_precision = np.mean(precisions)
    macro_recall = np.mean(recalls)
    macro_f1 = np.mean(f1s)

    weighted_precision = sum(p * s for p, s in zip(precisions, supports)) / total_support
    weighted_recall = sum(r * s for r, s in zip(recalls, supports)) / total_support
    weighted_f1 = sum(f * s for f, s in zip(f1s, supports)) / total_support

    return {
        "accuracy": round(accuracy, 4),
        f"top_{top_k}_accuracy": round(top_k_accuracy, 4),
        "macro_avg": {
            "precision": round(macro_precision, 4),
            "recall": round(macro_recall, 4),
            "f1_score": round(macro_f1, 4),
        },
        "weighted_avg": {
            "precision": round(weighted_precision, 4),
            "recall": round(weighted_recall, 4),
            "f1_score": round(weighted_f1, 4),
        },
        "per_class": per_class,
        "num_classes": num_classes,
        "total_samples": int(total_support),
    }


def generate_classification_report(metrics: dict) -> str:
    """Generate a formatted classification report string."""
    lines = []
    lines.append(f"{'=' * 80}")
    lines.append("  CLASSIFICATION REPORT - BioPlatform Caldas CNN")
    lines.append(f"{'=' * 80}")
    lines.append("")
    lines.append(f"  Overall Accuracy:   {metrics['accuracy']:.4f} ({metrics['accuracy'] * 100:.1f}%)")

    top_k_key = [k for k in metrics if k.startswith("top_")][0]
    lines.append(f"  {top_k_key.replace('_', ' ').title()}: {metrics[top_k_key]:.4f} ({metrics[top_k_key] * 100:.1f}%)")
    lines.append(f"  Total Test Samples: {metrics['total_samples']:,}")
    lines.append(f"  Number of Classes:  {metrics['num_classes']}")
    lines.append("")
    lines.append(f"{'─' * 80}")
    lines.append(f"  {'Species':<40s} {'Precision':>10s} {'Recall':>10s} {'F1':>10s} {'Support':>10s}")
    lines.append(f"{'─' * 80}")

    for name, m in sorted(metrics["per_class"].items()):
        lines.append(
            f"  {name:<40s} {m['precision']:>10.4f} {m['recall']:>10.4f} "
            f"{m['f1_score']:>10.4f} {m['support']:>10d}"
        )

    lines.append(f"{'─' * 80}")
    ma = metrics["macro_avg"]
    wa = metrics["weighted_avg"]
    lines.append(
        f"  {'Macro Avg':<40s} {ma['precision']:>10.4f} {ma['recall']:>10.4f} {ma['f1_score']:>10.4f}"
    )
    lines.append(
        f"  {'Weighted Avg':<40s} {wa['precision']:>10.4f} {wa['recall']:>10.4f} {wa['f1_score']:>10.4f}"
    )

    return "\n".join(lines)


def plot_confusion_matrix(
    labels: np.ndarray,
    predictions: np.ndarray,
    class_names: list[str],
    output_path: Path,
    max_classes_full: int = 30,
) -> None:
    """Generate and save confusion matrix heatmap."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        from sklearn.metrics import confusion_matrix
    except ImportError:
        print("[WARN] matplotlib/sklearn not installed, skipping confusion matrix plot.")
        return

    cm = confusion_matrix(labels, predictions)
    num_classes = len(class_names)

    if num_classes > max_classes_full:
        # For many classes, show only top confused pairs
        print(f"  [INFO] {num_classes} classes — generating summary confusion matrix")

        # Normalize
        cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)
        np.fill_diagonal(cm_norm, 0)  # Zero diagonal to find off-diagonal errors

        # Find top misclassified pairs
        flat_indices = np.argsort(cm_norm.ravel())[-20:]
        pairs = []
        for idx in flat_indices:
            i, j = divmod(idx, num_classes)
            if cm_norm[i, j] > 0:
                pairs.append((class_names[i], class_names[j], cm_norm[i, j], cm[i, j]))

        # Save as text
        with open(output_path.with_suffix(".txt"), "w") as f:
            f.write("Top 20 Most Confused Species Pairs:\n")
            f.write(f"{'True Species':<40s} {'Predicted As':<40s} {'Rate':>8s} {'Count':>6s}\n")
            f.write("─" * 94 + "\n")
            for true, pred, rate, count in sorted(pairs, key=lambda x: -x[2]):
                f.write(f"{true:<40s} {pred:<40s} {rate:>7.2%} {count:>6d}\n")
        print(f"  → Top confused pairs saved to {output_path.with_suffix('.txt')}")
    else:
        fig, ax = plt.subplots(figsize=(max(12, num_classes * 0.5), max(10, num_classes * 0.4)))
        im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
        ax.set_title("Confusion Matrix - BioPlatform CNN")
        fig.colorbar(im, ax=ax)

        short_names = [n[:20] for n in class_names]
        ax.set_xticks(range(num_classes))
        ax.set_yticks(range(num_classes))
        ax.set_xticklabels(short_names, rotation=90, ha="right", fontsize=7)
        ax.set_yticklabels(short_names, fontsize=7)
        ax.set_xlabel("Predicted")
        ax.set_ylabel("True")

        plt.tight_layout()
        plt.savefig(output_path, dpi=150)
        plt.close()
        print(f"  → Confusion matrix saved to {output_path}")


def find_misclassified(
    labels: np.ndarray,
    predictions: np.ndarray,
    probabilities: np.ndarray,
    dataset: datasets.ImageFolder,
    class_names: list[str],
    max_samples: int = 50,
) -> list[dict]:
    """Find misclassified samples with confidence scores."""
    misclassified = []
    wrong_indices = np.where(labels != predictions)[0]

    # Sort by confidence in wrong prediction (most confident mistakes first)
    confidences = [probabilities[i][predictions[i]] for i in wrong_indices]
    sorted_indices = wrong_indices[np.argsort(confidences)[::-1]]

    for idx in sorted_indices[:max_samples]:
        filepath = dataset.samples[idx][0]
        misclassified.append({
            "file": filepath,
            "true_label": class_names[labels[idx]],
            "predicted_label": class_names[predictions[idx]],
            "confidence": round(float(probabilities[idx][predictions[idx]]), 4),
            "true_label_prob": round(float(probabilities[idx][labels[idx]]), 4),
        })

    return misclassified


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate trained CNN model")
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--workers", type=int, default=4)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # ── Load config ────────────────────────────────────────────────
    config_path = WEIGHTS_DIR / "training_config.json"
    if not config_path.exists():
        print(f"[ERROR] Training config not found: {config_path}")
        sys.exit(1)

    with open(config_path) as f:
        config = json.load(f)

    weights_path = WEIGHTS_DIR / "best_model.pth"
    if not weights_path.exists():
        print(f"[ERROR] Model weights not found: {weights_path}")
        sys.exit(1)

    print(f"\n{'=' * 60}")
    print("  MODEL EVALUATION - BioPlatform Caldas CNN")
    print(f"{'=' * 60}")
    print(f"  Model:   {config['model_name']}")
    print(f"  Classes: {config['num_classes']}")
    print(f"  Device:  {device}")

    # ── Load model ─────────────────────────────────────────────────
    model = build_model_from_config(config, weights_path, device)

    # ── Test dataset ───────────────────────────────────────────────
    test_dir = PROCESSED_DIR / "test"
    if not test_dir.exists():
        print(f"[ERROR] Test set not found: {test_dir}")
        sys.exit(1)

    image_size = config.get("image_size", 224)
    imagenet_mean = config.get("imagenet_mean", [0.485, 0.456, 0.406])
    imagenet_std = config.get("imagenet_std", [0.229, 0.224, 0.225])

    test_transform = transforms.Compose([
        transforms.Resize(int(image_size * 1.14)),
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
        transforms.Normalize(imagenet_mean, imagenet_std),
    ])

    test_dataset = datasets.ImageFolder(str(test_dir), transform=test_transform)
    test_loader = DataLoader(
        test_dataset, batch_size=args.batch_size,
        shuffle=False, num_workers=args.workers, pin_memory=True,
    )

    class_names = config.get("class_names", test_dataset.classes)
    print(f"  Test images: {len(test_dataset):,}")

    # ── Evaluate ───────────────────────────────────────────────────
    print("\n  Running evaluation...")
    results = evaluate_model(model, test_loader, device, config["num_classes"], args.top_k)

    # ── Compute metrics ────────────────────────────────────────────
    print("  Computing metrics...")
    metrics = compute_metrics(
        results["labels"],
        results["predictions"],
        results["top_k_predictions"],
        class_names,
        args.top_k,
    )

    # ── Save outputs ───────────────────────────────────────────────
    EVAL_DIR.mkdir(parents=True, exist_ok=True)

    # Classification report
    report = generate_classification_report(metrics)
    with open(EVAL_DIR / "classification_report.txt", "w", encoding="utf-8") as f:
        f.write(report)
    print(f"\n{report}")

    # JSON metrics
    with open(EVAL_DIR / "evaluation_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\n  → Metrics saved to {EVAL_DIR / 'evaluation_metrics.json'}")

    # Per-class CSV
    with open(EVAL_DIR / "per_class_metrics.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["species", "precision", "recall", "f1_score", "support"])
        for name, m in sorted(metrics["per_class"].items()):
            writer.writerow([name, m["precision"], m["recall"], m["f1_score"], m["support"]])
    print("  → Per-class CSV saved")

    # Confusion matrix
    plot_confusion_matrix(
        results["labels"], results["predictions"],
        class_names, EVAL_DIR / "confusion_matrix.png",
    )

    # Misclassified samples
    misclassified = find_misclassified(
        results["labels"], results["predictions"],
        results["probabilities"], test_dataset, class_names,
    )
    with open(EVAL_DIR / "misclassified_samples.json", "w") as f:
        json.dump(misclassified, f, indent=2)
    print(f"  → {len(misclassified)} misclassified samples saved")

    # ── Final Summary ──────────────────────────────────────────────
    top_k_key = [k for k in metrics if k.startswith("top_")][0]
    print(f"\n{'=' * 60}")
    print("  EVALUATION COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Accuracy:    {metrics['accuracy']:.4f} ({metrics['accuracy'] * 100:.1f}%)")
    print(f"  {top_k_key}: {metrics[top_k_key]:.4f} ({metrics[top_k_key] * 100:.1f}%)")
    print(f"  Macro F1:    {metrics['macro_avg']['f1_score']:.4f}")
    print(f"  Weighted F1: {metrics['weighted_avg']['f1_score']:.4f}")
    target = "✅ PASSED" if metrics['accuracy'] >= 0.85 else "⚠️ BELOW TARGET (85%)"
    print(f"  Target >85%: {target}")
    print(f"\n  Results in:  {EVAL_DIR}")


if __name__ == "__main__":
    main()
