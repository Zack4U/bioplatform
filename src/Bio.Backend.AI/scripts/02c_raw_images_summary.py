"""
Script 02c: Análisis de Imágenes Descargadas (raw_images)
==========================================================
Escanea recursivamente data/raw_images/ y genera un reporte con:
  - Total de especies y total de imágenes
  - Distribución por rangos: 1-9, 10-19, 20-49, 50-99, 100+
  - Breakdown por reino (kingdom)
  - Lista detallada de todas las especies con su conteo de fotos

Salida:
    data/dataset_analysis/raw_images_summary.json
    data/dataset_analysis/raw_images_summary.txt   (formato legible)

Uso:
    python scripts/02c_raw_images_summary.py
    python scripts/02c_raw_images_summary.py --min-images 10   # resaltar umbral
    python scripts/02c_raw_images_summary.py --sort count_desc  # ordenar por cantidad
    python scripts/02c_raw_images_summary.py --kingdom Plantae  # filtrar por reino
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
REPORT_JSON = ANALYSIS_DIR / "raw_images_summary.json"
REPORT_TXT = ANALYSIS_DIR / "raw_images_summary.txt"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def count_images(directory: Path) -> tuple[int, int]:
    """Count total and augmented image files in a directory."""
    total = 0
    augmented = 0
    for f in directory.iterdir():
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS:
            total += 1
            if "_aug_" in f.stem:
                augmented += 1
    return total, augmented


def scan_raw_images() -> list[dict]:
    """
    Walk raw_images/ expecting structure:
      Kingdom/Phylum/Class/Family/Species_name/
    Returns a list of dicts with taxonomy + image counts.
    """
    species_list: list[dict] = []

    if not RAW_IMAGES_DIR.exists():
        return species_list

    for kingdom_dir in sorted(RAW_IMAGES_DIR.iterdir()):
        if not kingdom_dir.is_dir():
            continue
        kingdom = kingdom_dir.name

        for phylum_dir in sorted(kingdom_dir.iterdir()):
            if not phylum_dir.is_dir():
                continue
            phylum = phylum_dir.name

            for class_dir in sorted(phylum_dir.iterdir()):
                if not class_dir.is_dir():
                    continue
                cls = class_dir.name

                for family_dir in sorted(class_dir.iterdir()):
                    if not family_dir.is_dir():
                        continue
                    family = family_dir.name

                    for species_dir in sorted(family_dir.iterdir()):
                        if not species_dir.is_dir():
                            continue

                        total, augmented = count_images(species_dir)
                        if total == 0:
                            continue

                        species_list.append({
                            "species": species_dir.name.replace("_", " "),
                            "kingdom": kingdom.replace("_", " "),
                            "phylum": phylum.replace("_", " "),
                            "class": cls.replace("_", " "),
                            "family": family.replace("_", " "),
                            "total_images": total,
                            "original_images": total - augmented,
                            "augmented_images": augmented,
                            "path": str(species_dir.relative_to(RAW_IMAGES_DIR)),
                        })

    return species_list


def classify_range(count: int) -> str:
    """Classify image count into a range bucket."""
    if count < 10:
        return "1-9"
    elif count < 20:
        return "10-19"
    elif count < 50:
        return "20-49"
    elif count < 100:
        return "50-99"
    else:
        return "100+"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Analyze raw_images directory and generate summary report"
    )
    parser.add_argument(
        "--min-images", type=int, default=20,
        help="Highlight threshold for 'trainable' species (default: 20)",
    )
    parser.add_argument(
        "--sort", choices=["name", "count_asc", "count_desc", "kingdom"],
        default="count_desc",
        help="Sort order for detailed species list (default: count_desc)",
    )
    parser.add_argument(
        "--kingdom", type=str, default="",
        help="Filter by kingdom name (e.g., Plantae, Animalia)",
    )
    args = parser.parse_args()

    # ── Scan ──────────────────────────────────────────────────────
    if not RAW_IMAGES_DIR.exists():
        print(f"[ERROR] No se encontró {RAW_IMAGES_DIR}")
        print("  → Ejecuta primero: python scripts/02_download_images.py")
        sys.exit(1)

    print(f"\n{'=' * 65}")
    print("  RAW IMAGES SUMMARY – BioPlatform Caldas")
    print(f"{'=' * 65}")
    print(f"  Scanning: {RAW_IMAGES_DIR}")

    all_species = scan_raw_images()

    if not all_species:
        print("[INFO] No species found in raw_images/. Nothing to report.")
        return

    # ── Optional kingdom filter ───────────────────────────────────
    if args.kingdom:
        all_species = [
            sp for sp in all_species
            if sp["kingdom"].lower() == args.kingdom.lower()
        ]
        if not all_species:
            print(f"[INFO] No species found for kingdom '{args.kingdom}'.")
            return
        print(f"  Filter:   kingdom = {args.kingdom}")

    # ── Sort ──────────────────────────────────────────────────────
    if args.sort == "name":
        all_species.sort(key=lambda s: s["species"].lower())
    elif args.sort == "count_asc":
        all_species.sort(key=lambda s: s["total_images"])
    elif args.sort == "count_desc":
        all_species.sort(key=lambda s: s["total_images"], reverse=True)
    elif args.sort == "kingdom":
        all_species.sort(key=lambda s: (s["kingdom"], s["species"].lower()))

    # ── Compute stats ─────────────────────────────────────────────
    total_species = len(all_species)
    total_images = sum(sp["total_images"] for sp in all_species)
    total_original = sum(sp["original_images"] for sp in all_species)
    total_augmented = sum(sp["augmented_images"] for sp in all_species)

    # Distribution by range
    ranges = {"1-9": 0, "10-19": 0, "20-49": 0, "50-99": 0, "100+": 0}
    for sp in all_species:
        ranges[classify_range(sp["total_images"])] += 1

    # Distribution by kingdom
    kingdom_stats: dict[str, dict] = {}
    for sp in all_species:
        k = sp["kingdom"]
        if k not in kingdom_stats:
            kingdom_stats[k] = {
                "species": 0, "total_images": 0,
                "original": 0, "augmented": 0,
                "above_threshold": 0,
            }
        kingdom_stats[k]["species"] += 1
        kingdom_stats[k]["total_images"] += sp["total_images"]
        kingdom_stats[k]["original"] += sp["original_images"]
        kingdom_stats[k]["augmented"] += sp["augmented_images"]
        if sp["total_images"] >= args.min_images:
            kingdom_stats[k]["above_threshold"] += 1

    above_threshold = sum(1 for sp in all_species if sp["total_images"] >= args.min_images)
    below_threshold = total_species - above_threshold

    # Top 10 species by count
    top_10 = sorted(all_species, key=lambda s: s["total_images"], reverse=True)[:10]
    # Bottom 10 species by count
    bottom_10 = sorted(all_species, key=lambda s: s["total_images"])[:10]

    # ── Console output ────────────────────────────────────────────
    print(f"{'=' * 65}\n")
    print(f"  Total especies:          {total_species:,}")
    print(f"  Total imágenes:          {total_images:,}")
    print(f"    ├─ Originales:         {total_original:,}")
    print(f"    └─ Augmentadas:        {total_augmented:,}")
    print(f"  Umbral entrenamiento:    {args.min_images}")
    print(f"    ├─ Aptas (≥{args.min_images}):       {above_threshold:,}")
    print(f"    └─ No aptas (<{args.min_images}):     {below_threshold:,}")
    print()

    print("  Distribución por rango:")
    for rng, cnt in ranges.items():
        bar = "█" * min(cnt // 5, 40)
        print(f"    {rng:>6s}: {cnt:5d}  {bar}")
    print()

    print("  Distribución por reino:")
    for k, v in sorted(kingdom_stats.items()):
        print(
            f"    {k:15s} │ spp: {v['species']:5d} "
            f"│ imgs: {v['total_images']:7d} │ orig: {v['original']:7d} "
            f"│ aug: {v['augmented']:6d} "
            f"│ ≥{args.min_images}: {v['above_threshold']:5d}"
        )
    print()

    print("  Top 10 (más imágenes):")
    for sp in top_10:
        aug_tag = f" ({sp['augmented_images']} aug)" if sp["augmented_images"] > 0 else ""
        print(f"    {sp['species']:45s} │ {sp['total_images']:5d}{aug_tag}")
    print()

    print("  Bottom 10 (menos imágenes):")
    for sp in bottom_10:
        aug_tag = f" ({sp['augmented_images']} aug)" if sp["augmented_images"] > 0 else ""
        print(f"    {sp['species']:45s} │ {sp['total_images']:5d}{aug_tag}")

    # ── Build report ──────────────────────────────────────────────
    run_ts = datetime.now(timezone.utc)

    report = {
        "generated_at": run_ts.isoformat(),
        "raw_images_dir": str(RAW_IMAGES_DIR),
        "threshold": args.min_images,
        "totals": {
            "species": total_species,
            "images": total_images,
            "original_images": total_original,
            "augmented_images": total_augmented,
            "above_threshold": above_threshold,
            "below_threshold": below_threshold,
        },
        "distribution_by_range": ranges,
        "distribution_by_kingdom": kingdom_stats,
        "top_10": [
            {"species": sp["species"], "kingdom": sp["kingdom"],
             "total": sp["total_images"], "original": sp["original_images"],
             "augmented": sp["augmented_images"]}
            for sp in top_10
        ],
        "bottom_10": [
            {"species": sp["species"], "kingdom": sp["kingdom"],
             "total": sp["total_images"], "original": sp["original_images"],
             "augmented": sp["augmented_images"]}
            for sp in bottom_10
        ],
        "species_detail": all_species,
    }

    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)

    # JSON report
    with open(REPORT_JSON, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Text report (human-readable)
    with open(REPORT_TXT, "w", encoding="utf-8") as f:
        f.write("RAW IMAGES SUMMARY – BioPlatform Caldas\n")
        f.write(f"Generated: {run_ts.strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        f.write(f"{'=' * 90}\n\n")
        f.write(f"Total especies:     {total_species:,}\n")
        f.write(f"Total imágenes:     {total_images:,} (originales: {total_original:,}, augmentadas: {total_augmented:,})\n")
        f.write(f"Umbral:             {args.min_images}\n")
        f.write(f"Aptas (≥{args.min_images}):       {above_threshold:,}\n")
        f.write(f"No aptas (<{args.min_images}):     {below_threshold:,}\n\n")

        f.write("DISTRIBUCIÓN POR RANGO\n")
        f.write(f"{'-' * 40}\n")
        for rng, cnt in ranges.items():
            f.write(f"  {rng:>6s}: {cnt:5d}\n")
        f.write("\n")

        f.write("DISTRIBUCIÓN POR REINO\n")
        f.write(f"{'-' * 90}\n")
        header = (
            f"{'Reino':15s} │ {'Especies':>8s} │ {'Imágenes':>8s} "
            f"│ {'Original':>8s} │ {'Augment':>8s} "
            f"│ {'≥' + str(args.min_images):>6s}\n"
        )
        f.write(header)
        f.write(f"{'-' * 90}\n")
        for k, v in sorted(kingdom_stats.items()):
            f.write(
                f"{k:15s} │ {v['species']:8d} │ {v['total_images']:8d} "
                f"│ {v['original']:8d} │ {v['augmented']:8d} "
                f"│ {v['above_threshold']:6d}\n"
            )
        f.write("\n")

        f.write(f"DETALLE POR ESPECIE (ordenado por: {args.sort})\n")
        f.write(f"{'-' * 90}\n")
        f.write(f"{'#':>5s} │ {'Especie':45s} │ {'Reino':12s} │ {'Total':>6s} │ {'Orig':>6s} │ {'Aug':>5s}\n")
        f.write(f"{'-' * 90}\n")
        for i, sp in enumerate(all_species, 1):
            marker = "✓" if sp["total_images"] >= args.min_images else "✗"
            f.write(
                f"{i:5d} │ {sp['species']:45s} │ {sp['kingdom']:12s} "
                f"│ {sp['total_images']:6d} │ {sp['original_images']:6d} "
                f"│ {sp['augmented_images']:5d} {marker}\n"
            )

    # ── Done ──────────────────────────────────────────────────────
    print(f"\n{'=' * 65}")
    print("  Reports saved:")
    print(f"    JSON: {REPORT_JSON}")
    print(f"    TXT:  {REPORT_TXT}")
    print(f"{'=' * 65}\n")


if __name__ == "__main__":
    main()
