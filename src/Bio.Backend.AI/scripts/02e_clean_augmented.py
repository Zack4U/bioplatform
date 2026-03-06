"""
Script 02e: Eliminar Imágenes Augmentadas Offline
===================================================
Escanea data/raw_images/ y elimina todas las imágenes generadas por
augmentation offline (archivos con sufijo _aug_NNN en el nombre).

NO elimina imágenes descargadas de la API (prefijo api_).

Uso:
    # Ver qué se eliminaría (sin borrar nada)
    python scripts/02e_clean_augmented.py --dry-run

    # Eliminar todas las augmentadas
    python scripts/02e_clean_augmented.py

    # Filtrar por reino
    python scripts/02e_clean_augmented.py --kingdom Plantae
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
ANALYSIS_DIR = PROJECT_ROOT / "data" / "dataset_analysis"
RAW_IMAGES_DIR = PROJECT_ROOT / "data" / "raw_images"
REPORT_FILE = ANALYSIS_DIR / "clean_augmented_report.json"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Remove all offline-augmented images (_aug_) from raw_images/"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be deleted without actually deleting",
    )
    parser.add_argument(
        "--kingdom", type=str, default="",
        help="Only clean a specific kingdom (e.g., Plantae)",
    )
    args = parser.parse_args()

    if not RAW_IMAGES_DIR.exists():
        print(f"[ERROR] No se encontró {RAW_IMAGES_DIR}")
        sys.exit(1)

    print(f"\n{'=' * 60}")
    print("  CLEAN AUGMENTED IMAGES – BioPlatform Caldas")
    print(f"{'=' * 60}")
    print(f"  Mode:    {'DRY RUN' if args.dry_run else 'DELETE'}")
    if args.kingdom:
        print(f"  Kingdom: {args.kingdom}")
    print(f"{'=' * 60}\n")

    # ── Scan for augmented files ──────────────────────────────────
    aug_files: list[Path] = []
    species_counts: dict[str, int] = {}
    kingdom_counts: dict[str, int] = {}

    for kingdom_dir in sorted(RAW_IMAGES_DIR.iterdir()):
        if not kingdom_dir.is_dir():
            continue
        kingdom = kingdom_dir.name

        if args.kingdom and kingdom.lower().replace("_", " ") != args.kingdom.lower():
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

                        sp_augs = [
                            f for f in species_dir.iterdir()
                            if f.is_file()
                            and f.suffix.lower() in IMAGE_EXTENSIONS
                            and "_aug_" in f.stem
                        ]
                        if sp_augs:
                            sp_name = species_dir.name.replace("_", " ")
                            species_counts[sp_name] = len(sp_augs)
                            kingdom_counts[kingdom] = kingdom_counts.get(kingdom, 0) + len(sp_augs)
                            aug_files.extend(sp_augs)

    total = len(aug_files)
    affected_species = len(species_counts)

    if total == 0:
        print("[INFO] No augmented images found. Nothing to clean.")
        return

    print(f"  Found {total:,} augmented images across {affected_species} species\n")

    # Kingdom breakdown
    print("  Per-kingdom:")
    for k, cnt in sorted(kingdom_counts.items()):
        print(f"    {k:15s} │ {cnt:6,} files")

    # Top species with most augmented
    print(f"\n  Top species with most augmented images:")
    top = sorted(species_counts.items(), key=lambda x: x[1], reverse=True)[:15]
    for sp, cnt in top:
        print(f"    {sp:40s} │ {cnt:4d}")

    if args.dry_run:
        print(f"\n[DRY RUN] Would delete {total:,} augmented files. No files were modified.")
        return

    # ── Delete ────────────────────────────────────────────────────
    print(f"\n  Deleting {total:,} augmented files...")
    deleted = 0
    errors = 0

    for f in aug_files:
        try:
            f.unlink()
            deleted += 1
        except Exception:
            errors += 1

    # ── Save report ───────────────────────────────────────────────
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "deleted": deleted,
        "errors": errors,
        "affected_species": affected_species,
        "kingdom_breakdown": kingdom_counts,
        "species_detail": species_counts,
    }
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n{'=' * 60}")
    print(f"  CLEANUP COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Deleted:          {deleted:,}")
    print(f"  Errors:           {errors}")
    print(f"  Species affected: {affected_species}")
    print(f"  Report saved:     {REPORT_FILE}")
    print(f"\n  Next: python scripts/02c_raw_images_summary.py  (verify)")
    print()


if __name__ == "__main__":
    main()
