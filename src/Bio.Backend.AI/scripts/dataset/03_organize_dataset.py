"""
Script 03: Organización y Split del Dataset para Entrenamiento CNN
====================================================================
Toma las imágenes descargadas (data/raw_images/) y las organiza en
splits de entrenamiento, validación y test.

Características:
  - Split estratificado 80/10/10 (train/val/test)
  - Filtra especies con menos de N imágenes
  - Valida integridad de imágenes (descarta corruptas)
  - Genera class_mapping.json (label → idx) y dataset_stats.json
  - Organiza en formato ImageFolder (compatible con PyTorch/torchvision)
  - Replay Buffer: usa 100% imágenes nuevas + muestreo estratificado
    de imágenes antiguas (configurable vía --replay-ratio)
  - Semilla configurable vía DATASET_SPLIT_SEED en .env (default: 42)

Uso:
    python scripts/dataset/03_organize_dataset.py [--min-images 10] [--seed 42]
    python scripts/dataset/03_organize_dataset.py --replay-ratio 0.15 \\
        --new-images-manifest data/dataset_analysis/delta_manifest.json

Salida:
    data/processed/
    ├── train/
    │   ├── Bombus_funebris/
    │   │   ├── 001.jpg
    │   │   ...
    │   ├── Cattleya_trianae/
    │   ...
    ├── val/
    │   ├── Bombus_funebris/
    │   ...
    ├── test/
    │   ├── Bombus_funebris/
    │   ...
    ├── class_mapping.json    ← { "Bombus funebris": 0, ... }
    ├── class_info.json       ← metadata taxonómica por clase
    └── dataset_stats.json    ← estadísticas del dataset final
"""

import argparse
import json
import os
import random
import shutil
import sys
from collections import defaultdict
from pathlib import Path

from PIL import Image
from tqdm import tqdm

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent                    # Bio.Backend.AI/
RAW_IMAGES_DIR = PROJECT_ROOT / "data" / "raw_images"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
ANALYSIS_DIR = PROJECT_ROOT / "data" / "dataset_analysis"
SPECIES_CSV = ANALYSIS_DIR / "species_summary.csv"

# ── Default seed from environment ──────────────────────────────────
_DEFAULT_SEED = int(os.environ.get("DATASET_SPLIT_SEED", "42"))

# ── Image extensions ───────────────────────────────────────────────
_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def validate_image(filepath: Path) -> bool:
    """Check if an image file is valid and not corrupted."""
    try:
        with Image.open(filepath) as img:
            img.verify()
        # Re-open to check actual pixel data
        with Image.open(filepath) as img:
            img.load()
        return True
    except Exception:
        return False


def scan_raw_images(raw_dir: Path) -> dict[str, list[Path]]:
    """
    Scan the raw images directory and group images by species.
    Expected structure: raw_images/Kingdom/Phylum/Class/Family/SpeciesName/image.jpg
    Returns: { "Species_name": [path1, path2, ...] }
    """
    species_images: dict[str, list[Path]] = defaultdict(list)

    if not raw_dir.exists():
        print(f"[ERROR] Raw images directory not found: {raw_dir}")
        sys.exit(1)

    # Walk the taxonomy tree - species folders are at depth 5
    # Structure: Kingdom/Phylum/Class/Family/Species/
    for kingdom_dir in sorted(raw_dir.iterdir()):
        if not kingdom_dir.is_dir():
            continue
        for phylum_dir in sorted(kingdom_dir.iterdir()):
            if not phylum_dir.is_dir():
                continue
            for class_dir in sorted(phylum_dir.iterdir()):
                if not class_dir.is_dir():
                    continue
                for family_dir in sorted(class_dir.iterdir()):
                    if not family_dir.is_dir():
                        continue
                    for species_dir in sorted(family_dir.iterdir()):
                        if not species_dir.is_dir():
                            continue
                        species_name = species_dir.name  # e.g., "Bombus_funebris"
                        images = sorted(
                            p for p in species_dir.iterdir()
                            if p.suffix.lower() in _IMAGE_EXTENSIONS
                        )
                        if images:
                            species_images[species_name].extend(images)

    return species_images


def load_taxonomy_info() -> dict[str, dict]:
    """Load taxonomy info from species_summary.csv for class_info.json."""
    import csv

    info: dict[str, dict] = {}
    if not SPECIES_CSV.exists():
        return info

    with open(SPECIES_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            species_key = row["species"].replace(" ", "_")
            info[species_key] = {
                "scientific_name": row.get("scientific_name", ""),
                "kingdom": row.get("kingdom", ""),
                "phylum": row.get("phylum", ""),
                "class": row.get("class", ""),
                "order": row.get("order", ""),
                "family": row.get("family", ""),
                "genus": row.get("genus", ""),
                "iucn_status": row.get("iucn_status", ""),
            }
    return info


def _load_new_images_manifest(manifest_path: Path) -> set[str]:
    """
    Load a delta manifest JSON and return the set of new image file paths.

    Expected format:
        { "new_images": [ { "path": "/abs/path/to/img.jpg", ... }, ... ] }
    """
    if not manifest_path.exists():
        print(f"[WARN] Manifest not found: {manifest_path}. "
              "Treating ALL images as new.")
        return set()

    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    return {
        str(Path(entry["path"]).resolve())
        for entry in manifest.get("new_images", [])
        if "path" in entry
    }


def apply_replay_buffer(
    species_images: dict[str, list[Path]],
    new_image_paths: set[str],
    replay_ratio: float,
    seed: int,
) -> dict[str, list[Path]]:
    """
    Apply the Replay Buffer strategy:
      - Keep 100% of NEW images (from delta download).
      - Sample `replay_ratio` (e.g. 15%) of OLD images per class.

    This prevents catastrophic forgetting while keeping training
    efficient (no full retrain on 10K+ images).

    Args:
        species_images: All discovered images grouped by species.
        new_image_paths: Absolute paths of images considered "new".
        replay_ratio: Fraction of old images to keep (0.0 to 1.0).
        seed: Random seed for reproducible sampling.

    Returns:
        Filtered dict with the replay buffer applied.
    """
    rng = random.Random(seed)
    buffered: dict[str, list[Path]] = {}
    total_new = 0
    total_old_sampled = 0
    total_old_skipped = 0

    for species_name, images in species_images.items():
        new_imgs = [
            p for p in images
            if str(p.resolve()) in new_image_paths
        ]
        old_imgs = [
            p for p in images
            if str(p.resolve()) not in new_image_paths
        ]

        # Sample old images
        if old_imgs and replay_ratio < 1.0:
            sample_size = max(1, int(len(old_imgs) * replay_ratio))
            sampled_old = rng.sample(old_imgs, min(sample_size, len(old_imgs)))
        else:
            sampled_old = old_imgs

        combined = new_imgs + sampled_old
        if combined:
            buffered[species_name] = combined

        total_new += len(new_imgs)
        total_old_sampled += len(sampled_old)
        total_old_skipped += len(old_imgs) - len(sampled_old)

    print(f"  → Replay Buffer applied:")
    print(f"    New images (100%):      {total_new:,}")
    print(f"    Old images sampled:     {total_old_sampled:,} "
          f"({replay_ratio:.0%} of {total_old_sampled + total_old_skipped:,})")
    print(f"    Old images skipped:     {total_old_skipped:,}")
    print(f"    Total for training:     {total_new + total_old_sampled:,}")

    return buffered


def split_dataset(
    species_images: dict[str, list[Path]],
    min_images: int,
    seed: int,
    max_species: int = 0,
    train_ratio: float = 0.80,
    val_ratio: float = 0.10,
) -> tuple[dict, dict, dict]:
    """
    Stratified split: cada especie se divide individualmente en train/val/test.
    If max_species > 0, only the top N species (by image count) are kept.
    Returns three dicts: { species_name: [paths] }
    """
    random.seed(seed)

    # Sort by image count descending so --max-species takes the richest ones
    sorted_species = sorted(
        species_images.items(), key=lambda kv: len(kv[1]), reverse=True
    )

    train_split: dict[str, list[Path]] = {}
    val_split: dict[str, list[Path]] = {}
    test_split: dict[str, list[Path]] = {}
    skipped: list[str] = []
    included = 0

    for species_name, images in sorted_species:
        if len(images) < min_images:
            skipped.append(species_name)
            continue

        if max_species > 0 and included >= max_species:
            break

        # Shuffle images
        shuffled = images.copy()
        random.shuffle(shuffled)

        n = len(shuffled)
        n_train = max(1, int(n * train_ratio))
        n_val = max(1, int(n * val_ratio))
        # Ensure at least 1 in each split
        if n_train + n_val >= n:
            n_train = max(1, n - 2)
            n_val = 1

        train_split[species_name] = shuffled[:n_train]
        val_split[species_name] = shuffled[n_train:n_train + n_val]
        test_split[species_name] = shuffled[n_train + n_val:]
        included += 1

    if skipped:
        print(f"[INFO] Skipped {len(skipped)} species with <{min_images} images")

    return train_split, val_split, test_split


def copy_with_validation(
    split_data: dict[str, list[Path]],
    output_base: Path,
    split_name: str,
) -> tuple[int, int]:
    """
    Copy images to split directory, validating each one.
    Returns (copied_count, corrupted_count).
    """
    copied = 0
    corrupted = 0

    split_dir = output_base / split_name

    all_tasks = []
    for species_name, paths in split_data.items():
        species_dir = split_dir / species_name
        for path in paths:
            all_tasks.append((path, species_dir))

    for source_path, species_dir in tqdm(all_tasks, desc=f"  {split_name}", unit="img"):
        if not validate_image(source_path):
            corrupted += 1
            continue

        species_dir.mkdir(parents=True, exist_ok=True)
        dest_path = species_dir / source_path.name

        if not dest_path.exists():
            shutil.copy2(source_path, dest_path)
        copied += 1

    return copied, corrupted


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Organize raw images into train/val/test splits"
    )
    parser.add_argument(
        "--min-images", type=int, default=10,
        help="Minimum images per species to include (default: 10)"
    )
    parser.add_argument(
        "--seed", type=int, default=_DEFAULT_SEED,
        help=f"Random seed for reproducible splits (default: {_DEFAULT_SEED}, "
             f"from DATASET_SPLIT_SEED env var)"
    )
    parser.add_argument(
        "--max-species", type=int, default=0,
        help="Limit to top N species by image count (0 = all, default: 0)"
    )
    parser.add_argument(
        "--clean", action="store_true",
        help="Remove existing processed directory before organizing"
    )
    parser.add_argument(
        "--new-images-manifest", type=str, default=None,
        help="Path to delta_manifest.json from 02f_download_delta.py. "
             "Enables Replay Buffer: 100%% new + replay-ratio%% old."
    )
    parser.add_argument(
        "--replay-ratio", type=float, default=None,
        help="Fraction of old images to keep when Replay Buffer is active "
             "(0.0-1.0). Reads REPLAY_BUFFER_RATIO from .env if not set. "
             "Only used when --new-images-manifest is provided."
    )
    args = parser.parse_args()

    # Resolve replay ratio from env if not provided
    if args.replay_ratio is None:
        args.replay_ratio = float(os.environ.get("REPLAY_BUFFER_RATIO", "0.15"))

    print("=" * 60)
    print("  DATASET ORGANIZATION FOR CNN TRAINING")
    print("=" * 60)
    print(f"  Seed: {args.seed}")

    # Optionally clean
    if args.clean and PROCESSED_DIR.exists():
        print(f"[INFO] Cleaning {PROCESSED_DIR}...")
        shutil.rmtree(PROCESSED_DIR)

    # 1. Scan raw images
    print(f"\n[STEP 1/4] Scanning {RAW_IMAGES_DIR}...")
    species_images = scan_raw_images(RAW_IMAGES_DIR)
    total_images = sum(len(v) for v in species_images.values())
    print(f"  → Found {total_images:,} images across {len(species_images)} species")

    if total_images == 0:
        print("\n[ERROR] No images found in raw_images directory!")
        print(f"  Expected structure: {RAW_IMAGES_DIR}/Kingdom/Phylum/Class/Family/Species/*.jpg")
        print("  Run: python scripts/dataset/02f_download_delta.py")
        sys.exit(1)

    # 1b. Apply Replay Buffer if manifest provided
    if args.new_images_manifest:
        manifest_path = Path(args.new_images_manifest)
        print(f"\n[STEP 1b] Applying Replay Buffer (ratio={args.replay_ratio:.0%})...")
        new_paths = _load_new_images_manifest(manifest_path)

        if new_paths:
            species_images = apply_replay_buffer(
                species_images, new_paths, args.replay_ratio, args.seed,
            )
            total_images = sum(len(v) for v in species_images.values())
        else:
            print("  → No new images in manifest; using all images (no buffer)")

    # 2. Split dataset
    print(f"\n[STEP 2/4] Splitting dataset (min {args.min_images} imgs/species)...")
    if args.max_species > 0:
        print(f"  → Limiting to top {args.max_species} species (test mode)")
    train, val, test = split_dataset(
        species_images, args.min_images, args.seed, max_species=args.max_species
    )
    num_classes = len(train)
    print(f"  → {num_classes} classes included in final dataset")
    print(f"  → Train: {sum(len(v) for v in train.values()):,} images")
    print(f"  → Val:   {sum(len(v) for v in val.values()):,} images")
    print(f"  → Test:  {sum(len(v) for v in test.values()):,} images")

    # 3. Copy and validate
    print("\n[STEP 3/4] Copying and validating images...")
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    total_copied = 0
    total_corrupted = 0

    for split_name, split_data in [("train", train), ("val", val), ("test", test)]:
        copied, corrupted = copy_with_validation(split_data, PROCESSED_DIR, split_name)
        total_copied += copied
        total_corrupted += corrupted

    print(f"\n  → Total copied:    {total_copied:,}")
    print(f"  → Total corrupted: {total_corrupted:,}")

    # 4. Generate metadata files
    print("\n[STEP 4/4] Generating metadata files...")

    # Class mapping: species_name → class_idx (sorted alphabetically)
    class_names = sorted(train.keys())
    class_mapping = {name.replace("_", " "): idx for idx, name in enumerate(class_names)}

    with open(PROCESSED_DIR / "class_mapping.json", "w", encoding="utf-8") as f:
        json.dump(class_mapping, f, ensure_ascii=False, indent=2)
    print(f"  → class_mapping.json ({len(class_mapping)} classes)")

    # Reverse mapping: idx → species
    idx_to_class = {idx: name for name, idx in class_mapping.items()}
    with open(PROCESSED_DIR / "idx_to_class.json", "w", encoding="utf-8") as f:
        json.dump(idx_to_class, f, ensure_ascii=False, indent=2)

    # Class info with taxonomy
    taxonomy_info = load_taxonomy_info()
    class_info = {}
    for folder_name in class_names:
        display_name = folder_name.replace("_", " ")
        tax = taxonomy_info.get(folder_name, {})
        class_info[display_name] = {
            "class_idx": class_mapping[display_name],
            "folder_name": folder_name,
            "train_count": len(train.get(folder_name, [])),
            "val_count": len(val.get(folder_name, [])),
            "test_count": len(test.get(folder_name, [])),
            **tax,
        }

    with open(PROCESSED_DIR / "class_info.json", "w", encoding="utf-8") as f:
        json.dump(class_info, f, ensure_ascii=False, indent=2)
    print("  → class_info.json (taxonomy + counts per class)")

    # Dataset statistics
    dataset_stats = {
        "num_classes": num_classes,
        "min_images_threshold": args.min_images,
        "random_seed": args.seed,
        "replay_buffer": {
            "enabled": args.new_images_manifest is not None,
            "ratio": args.replay_ratio,
        },
        "splits": {
            "train": {
                "total_images": sum(len(v) for v in train.values()),
                "num_classes": len(train),
            },
            "val": {
                "total_images": sum(len(v) for v in val.values()),
                "num_classes": len(val),
            },
            "test": {
                "total_images": sum(len(v) for v in test.values()),
                "num_classes": len(test),
            },
        },
        "corrupted_removed": total_corrupted,
        "images_per_class": {
            name.replace("_", " "): {
                "train": len(train.get(name, [])),
                "val": len(val.get(name, [])),
                "test": len(test.get(name, [])),
                "total": len(train.get(name, [])) + len(val.get(name, [])) + len(test.get(name, [])),
            }
            for name in class_names
        },
    }

    with open(PROCESSED_DIR / "dataset_stats.json", "w", encoding="utf-8") as f:
        json.dump(dataset_stats, f, ensure_ascii=False, indent=2)
    print("  → dataset_stats.json")

    # Print final summary
    print("\n" + "=" * 60)
    print("  DATASET ORGANIZATION COMPLETE")
    print("=" * 60)
    print(f"  Classes:     {num_classes}")
    print(f"  Train imgs:  {dataset_stats['splits']['train']['total_images']:,}")
    print(f"  Val imgs:    {dataset_stats['splits']['val']['total_images']:,}")
    print(f"  Test imgs:   {dataset_stats['splits']['test']['total_images']:,}")
    print(f"  Output dir:  {PROCESSED_DIR}")
    print("\n  Ready for training! Use: python scripts/cnn/04_train_cnn.py")


if __name__ == "__main__":
    main()
