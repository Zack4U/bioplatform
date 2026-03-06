"""
Script 02d: Offline Augmentation Masiva
========================================
Genera copias aumentadas para todas las especies que tengan menos
de --target imágenes en raw_images/. Rellena SOLO con augmentation
(no consulta APIs externas).

8 variantes de augmentation por original:
  0,4: Flip horizontal + brillo
  1,5: Rotación ±20° + contraste
  2,6: Color jitter + blur suave
  3,7: Crop central 80-92% + resize + flip aleatorio

Máximo 3 copias augmentadas por imagen original para mantener
diversidad. Las copias se guardan con sufijo _aug_NNN.jpg.

Requiere ejecutar 02_download_images.py (o 02b_supplement_images.py) primero.

Uso:
    # Completar a 50 imágenes por especie (default)
    python scripts/02d_offline_augment.py

    # Completar a 30 imágenes
    python scripts/02d_offline_augment.py --target 30

    # Solo especies con al menos 5 originales
    python scripts/02d_offline_augment.py --min-existing 5

    # Limpiar augmentaciones previas antes de generar nuevas
    python scripts/02d_offline_augment.py --clean

    # Ver qué se haría sin crear archivos
    python scripts/02d_offline_augment.py --dry-run

Salida:
    data/raw_images/.../Species/   ← Copias aumentadas (_aug_NNN.jpg)
    data/dataset_analysis/augmentation_report.json  ← Reporte
"""

from __future__ import annotations

import argparse
import json
import random
import sys
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from tqdm import tqdm

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
ANALYSIS_DIR = PROJECT_ROOT / "data" / "dataset_analysis"
RAW_IMAGES_DIR = PROJECT_ROOT / "data" / "raw_images"
REPORT_FILE = ANALYSIS_DIR / "augmentation_report.json"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


# ═══════════════════════════════════════════════════════════════════
#  Augmentation Engine
# ═══════════════════════════════════════════════════════════════════

def augment_image(img: Image.Image, variant: int) -> Image.Image:
    """
    Apply a deterministic augmentation based on variant index.
    Each variant produces a visually distinct but realistic copy.
    """
    img = img.copy()
    random.seed(variant * 7919)  # deterministic per variant

    ops = variant % 8

    if ops in (0, 4):
        # Horizontal flip + brightness
        img = ImageOps.mirror(img)
        factor = random.uniform(0.7, 1.3)
        img = ImageEnhance.Brightness(img).enhance(factor)

    elif ops in (1, 5):
        # Rotation + contrast
        angle = random.uniform(-20, 20)
        img = img.rotate(angle, resample=Image.Resampling.BICUBIC,
                         expand=False, fillcolor=(0, 0, 0))
        factor = random.uniform(0.7, 1.4)
        img = ImageEnhance.Contrast(img).enhance(factor)

    elif ops in (2, 6):
        # Color jitter + slight blur
        factor = random.uniform(0.7, 1.4)
        img = ImageEnhance.Color(img).enhance(factor)
        if random.random() > 0.5:
            img = img.filter(ImageFilter.GaussianBlur(radius=1))

    elif ops in (3, 7):
        # Crop center 80-92% + flip
        w, h = img.size
        crop_frac = random.uniform(0.8, 0.92)
        cw, ch = int(w * crop_frac), int(h * crop_frac)
        left = (w - cw) // 2
        top = (h - ch) // 2
        img = img.crop((left, top, left + cw, top + ch))
        img = img.resize((w, h), Image.Resampling.LANCZOS)
        if random.random() > 0.5:
            img = ImageOps.mirror(img)

    # Additional random sharpness tweak
    if random.random() > 0.6:
        factor = random.uniform(0.8, 1.5)
        img = ImageEnhance.Sharpness(img).enhance(factor)

    return img


# ═══════════════════════════════════════════════════════════════════
#  Scanner & Augmentor
# ═══════════════════════════════════════════════════════════════════

def find_all_species_dirs() -> list[dict]:
    """
    Walk raw_images/ (Kingdom/Phylum/Class/Family/Species/)
    and return info for each species directory.
    """
    entries: list[dict] = []

    if not RAW_IMAGES_DIR.exists():
        return entries

    for kingdom_dir in sorted(RAW_IMAGES_DIR.iterdir()):
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

                        originals = sorted([
                            f for f in species_dir.iterdir()
                            if f.is_file()
                            and f.suffix.lower() in IMAGE_EXTENSIONS
                            and "_aug_" not in f.stem
                        ])
                        augmented = [
                            f for f in species_dir.iterdir()
                            if f.is_file()
                            and f.suffix.lower() in IMAGE_EXTENSIONS
                            and "_aug_" in f.stem
                        ]

                        entries.append({
                            "species": species_dir.name.replace("_", " "),
                            "kingdom": kingdom_dir.name.replace("_", " "),
                            "family": family_dir.name.replace("_", " "),
                            "dir": species_dir,
                            "originals": originals,
                            "original_count": len(originals),
                            "augmented_count": len(augmented),
                            "total_count": len(originals) + len(augmented),
                        })

    return entries


def clean_augmented(sp_dir: Path) -> int:
    """Remove all previously generated augmented images. Returns count removed."""
    removed = 0
    for f in sp_dir.iterdir():
        if f.is_file() and f.suffix.lower() in IMAGE_EXTENSIONS and "_aug_" in f.stem:
            f.unlink()
            removed += 1
    return removed


def augment_species_dir(
    originals: list[Path],
    sp_dir: Path,
    current_total: int,
    target: int,
    max_per_original: int = 3,
) -> int:
    """
    Generate augmented copies from original images to reach target.
    Returns number of images created.
    """
    if not originals:
        return 0

    needed = target - current_total
    if needed <= 0:
        return 0

    created = 0
    variant = 0
    max_variants = len(originals) * max_per_original

    while created < needed and variant < max_variants:
        src_path = originals[variant % len(originals)]

        try:
            img = Image.open(src_path)
            if img.mode != "RGB":
                img = img.convert("RGB")

            aug_img = augment_image(img, variant)

            out_name = f"{src_path.stem}_aug_{variant:03d}.jpg"
            out_path = sp_dir / out_name

            if not out_path.exists():
                aug_img.save(out_path, "JPEG", quality=88)
                created += 1

        except Exception:
            pass

        variant += 1

    return created


# ═══════════════════════════════════════════════════════════════════
#  Main
# ═══════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Offline augmentation: fill species up to a target image count"
    )
    parser.add_argument(
        "--target", type=int, default=50,
        help="Target total images per species (default: 50)",
    )
    parser.add_argument(
        "--min-existing", type=int, default=3,
        help="Minimum original (non-augmented) images required (default: 3)",
    )
    parser.add_argument(
        "--max-per-original", type=int, default=3,
        help="Max augmented copies per original image (default: 3)",
    )
    parser.add_argument(
        "--max-species", type=int, default=0,
        help="Limit number of species to process (0 = all eligible)",
    )
    parser.add_argument(
        "--clean", action="store_true",
        help="Remove existing augmented images before generating new ones",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be done without creating files",
    )
    args = parser.parse_args()

    # ── Validate ──────────────────────────────────────────────────
    if not RAW_IMAGES_DIR.exists():
        print(f"[ERROR] No se encontró {RAW_IMAGES_DIR}")
        print("  → Ejecuta primero: python scripts/02_download_images.py")
        sys.exit(1)

    print(f"\n{'=' * 65}")
    print("  OFFLINE AUGMENTATION – BioPlatform Caldas")
    print(f"{'=' * 65}")
    print(f"  Target:             {args.target} images/species")
    print(f"  Min originals:      {args.min_existing}")
    print(f"  Max per original:   {args.max_per_original}")
    print(f"  Clean first:        {'YES' if args.clean else 'NO'}")
    print(f"{'=' * 65}\n")

    # ── Scan all species ──────────────────────────────────────────
    all_entries = find_all_species_dirs()

    if not all_entries:
        print("[INFO] No species found in raw_images/.")
        return

    # ── Find candidates ───────────────────────────────────────────
    candidates = []
    for entry in all_entries:
        if entry["original_count"] < args.min_existing:
            continue
        # When --clean, we'll recalculate using only original count
        effective_total = entry["original_count"] if args.clean else entry["total_count"]
        if effective_total >= args.target:
            continue
        candidates.append({
            **entry,
            "effective_total": effective_total,
            "needed": args.target - effective_total,
        })

    # Sort by fewest images first (most needy get priority)
    candidates.sort(key=lambda c: c["effective_total"])

    if args.max_species > 0:
        candidates = candidates[:args.max_species]

    # ── Summary before processing ─────────────────────────────────
    total_species = len(all_entries)
    already_ok = sum(1 for e in all_entries if e["total_count"] >= args.target)
    too_few = sum(1 for e in all_entries if e["original_count"] < args.min_existing)

    print(f"  Total species in raw_images:   {total_species:,}")
    print(f"  Already ≥{args.target} images:          {already_ok:,}")
    print(f"  Too few originals (<{args.min_existing}):      {too_few:,}")
    print(f"  Candidates to augment:         {len(candidates):,}")

    if not candidates:
        print("\n[INFO] No species to augment. Done.")
        return

    # Needed distribution
    dist = {"1-10": 0, "11-20": 0, "21-30": 0, "31-47": 0, "48+": 0}
    for c in candidates:
        n = c["needed"]
        if n <= 10:
            dist["1-10"] += 1
        elif n <= 20:
            dist["11-20"] += 1
        elif n <= 30:
            dist["21-30"] += 1
        elif n <= 47:
            dist["31-47"] += 1
        else:
            dist["48+"] += 1
    print(f"  Needed distribution:           {dist}")

    if args.dry_run:
        print(f"\n[DRY RUN] Would augment {len(candidates)} species:")
        for c in candidates[:30]:
            cap = min(c["needed"], c["original_count"] * args.max_per_original)
            reachable = c["effective_total"] + cap
            marker = "✓" if reachable >= args.target else f"→{reachable}"
            print(f"    {c['species']:40s} │ orig: {c['original_count']:3d} │ curr: {c['effective_total']:3d} │ need: {c['needed']:3d} │ {marker}")
        if len(candidates) > 30:
            print(f"    ... and {len(candidates) - 30} more")
        return

    # ── Process ───────────────────────────────────────────────────
    run_start = datetime.now(timezone.utc)
    report = {
        "run_started": run_start.isoformat(),
        "parameters": {
            "target": args.target,
            "min_existing": args.min_existing,
            "max_per_original": args.max_per_original,
            "clean": args.clean,
        },
        "candidates": len(candidates),
        "results": [],
    }

    total_created = 0
    total_cleaned = 0
    rescued = 0
    kingdom_stats: dict[str, dict] = {}

    pbar = tqdm(candidates, desc="Augmenting species")
    for cand in pbar:
        sp_name = cand["species"]
        kingdom = cand["kingdom"]
        sp_dir = cand["dir"]
        originals = cand["originals"]
        pbar.set_postfix_str(sp_name[:30])

        cleaned = 0
        if args.clean:
            cleaned = clean_augmented(sp_dir)
            total_cleaned += cleaned

        current = cand["original_count"] if args.clean else cand["total_count"]
        created = augment_species_dir(
            originals=originals,
            sp_dir=sp_dir,
            current_total=current,
            target=args.target,
            max_per_original=args.max_per_original,
        )

        final = current + created
        total_created += created
        if final >= args.target:
            rescued += 1

        # Kingdom tracking
        if kingdom not in kingdom_stats:
            kingdom_stats[kingdom] = {
                "processed": 0, "rescued": 0, "augmented": 0, "cleaned": 0,
            }
        kingdom_stats[kingdom]["processed"] += 1
        kingdom_stats[kingdom]["augmented"] += created
        kingdom_stats[kingdom]["cleaned"] += cleaned
        if final >= args.target:
            kingdom_stats[kingdom]["rescued"] += 1

        report["results"].append({
            "species": sp_name,
            "kingdom": kingdom,
            "family": cand["family"],
            "original_count": cand["original_count"],
            "before": current,
            "cleaned": cleaned,
            "augmented": created,
            "final": final,
            "reached_target": final >= args.target,
        })

    # ── Final distribution ────────────────────────────────────────
    final_dist = {"<target": 0, "target-ok": 0}
    for r in report["results"]:
        if r["final"] < args.target:
            final_dist["<target"] += 1
        else:
            final_dist["target-ok"] += 1

    run_end = datetime.now(timezone.utc)

    report["run_finished"] = run_end.isoformat()
    report["duration_seconds"] = round((run_end - run_start).total_seconds(), 1)
    report["summary"] = {
        "total_augmented": total_created,
        "total_cleaned": total_cleaned,
        "rescued_species": rescued,
        "not_rescued": len(candidates) - rescued,
        "total_candidates": len(candidates),
        "rescue_rate_pct": round(rescued / len(candidates) * 100, 1) if candidates else 0,
        "final_distribution": final_dist,
    }
    report["kingdom_breakdown"] = kingdom_stats

    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # ── Console summary ───────────────────────────────────────────
    print(f"\n{'=' * 65}")
    print("  AUGMENTATION COMPLETE")
    print(f"{'=' * 65}")
    print(f"  Candidates processed:     {len(candidates):,}")
    if args.clean:
        print(f"  Previous aug cleaned:     {total_cleaned:,}")
    print(f"  Augmented images created: {total_created:,}")
    print(f"  Species rescued (≥{args.target}):  {rescued} / {len(candidates)} ({report['summary']['rescue_rate_pct']}%)")
    print(f"  Not rescued:              {len(candidates) - rescued}")
    print(f"  Duration:                 {report['duration_seconds']}s")
    print(f"\n  Per-kingdom breakdown:")
    for k, v in sorted(kingdom_stats.items()):
        print(f"    {k:15s} │ processed: {v['processed']:4d} │ rescued: {v['rescued']:4d} │ augmented: {v['augmented']:6d}")
    print(f"\n  Report saved: {REPORT_FILE}")
    print(f"\n  Next steps:")
    print(f"  1. Verify:      python scripts/02c_raw_images_summary.py")
    print(f"  2. Re-organize: python scripts/03_organize_dataset.py --min-images 10 --clean")
    print(f"  3. Re-train:    python scripts/04_train_cnn.py --model efficientnet_b2 ...")
    print()


if __name__ == "__main__":
    main()
