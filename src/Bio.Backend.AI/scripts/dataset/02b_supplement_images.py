"""
Script 02b: Descargar Imágenes Suplementarias desde iNaturalist
================================================================
Consulta la API v1 de iNaturalist para descargar fotos research-grade
de especies que tienen menos de --max-images imágenes.

Este script SOLO descarga de la API. NO hace augmentation offline.
Para augmentation, usa 02d_offline_augment.py.

Las especies base ya son de Caldas, así que NO se filtra por
geolocalización al consultar la API. Los filtros clave son:
  - photos = true (que tenga imágenes)
  - quality_grade = research (observaciones verificadas)

Requiere ejecutar 01_analyze_dataset.py y 02_download_images.py primero.

Uso:
    # Descargar hasta 50 imgs por especie (default)
    python scripts/02b_supplement_images.py

    # Ver qué se descargaría sin hacerlo
    python scripts/02b_supplement_images.py --dry-run

    # Ajustar máximo de descarga
    python scripts/02b_supplement_images.py --max-images 40

    # Limitar a N especies (para pruebas)
    python scripts/02b_supplement_images.py --max-species 5

Salida:
    data/raw_images/.../Species_name/api_NNNN.jpg  ← Nuevas imágenes
    data/dataset_analysis/supplement_report.json    ← Reporte detallado
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image
from tqdm import tqdm

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
ANALYSIS_DIR = PROJECT_ROOT / "data" / "dataset_analysis"
RAW_IMAGES_DIR = PROJECT_ROOT / "data" / "raw_images"
SPECIES_JSON = ANALYSIS_DIR / "species_with_urls.json"
REPORT_FILE = ANALYSIS_DIR / "supplement_report.json"

# ── iNaturalist API v1 (more reliable than v2 for photo retrieval) ─
INAT_SEARCH_URL = "https://api.inaturalist.org/v1/observations"
REQUEST_TIMEOUT = 30
API_RATE_LIMIT = 1.1  # seconds between API requests (iNat limit: 60/min)


def sanitize_name(name: str) -> str:
    """Sanitize a taxonomic name for use as folder name."""
    return name.strip().replace(" ", "_").replace("/", "-").replace("\\", "-")


def find_species_dir(species: dict) -> Path | None:
    """Find the existing raw_images directory for a species."""
    kingdom = sanitize_name(species.get("kingdom", "Unknown"))
    phylum = sanitize_name(species.get("phylum", "Unknown"))
    cls = sanitize_name(species.get("class", "Unknown"))
    family = sanitize_name(species.get("family", "Unknown"))
    sp_name = sanitize_name(species["species"])

    sp_dir = RAW_IMAGES_DIR / kingdom / phylum / cls / family / sp_name
    if sp_dir.exists():
        return sp_dir
    return None


def make_species_dir(species: dict) -> Path:
    """Create and return the raw_images directory for a species."""
    kingdom = sanitize_name(species.get("kingdom", "Unknown"))
    phylum = sanitize_name(species.get("phylum", "Unknown"))
    cls = sanitize_name(species.get("class", "Unknown"))
    family = sanitize_name(species.get("family", "Unknown"))
    sp_name = sanitize_name(species["species"])

    sp_dir = RAW_IMAGES_DIR / kingdom / phylum / cls / family / sp_name
    sp_dir.mkdir(parents=True, exist_ok=True)
    return sp_dir


def count_images(directory: Path) -> int:
    """Count valid image files in a directory."""
    if not directory.exists():
        return 0
    return sum(1 for f in directory.iterdir()
               if f.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})


# ═══════════════════════════════════════════════════════════════════
#  iNaturalist API v1 – Photo Fetcher
# ═══════════════════════════════════════════════════════════════════

def fetch_inat_photos(
    taxon_name: str,
    existing_gbif_ids: set[str],
    needed: int,
    image_size: int = 512,
    verbose: bool = False,
) -> list[dict]:
    """
    Query iNaturalist API v1 for research-grade observation photos.
    Returns photo URLs not already in our dataset.
    No geo-filter: base species are already from Caldas.
    """
    photos: list[dict] = []
    page = 1
    per_page = 30  # iNat default max per page
    max_pages = min(5, (needed // per_page) + 2)

    while len(photos) < needed and page <= max_pages:
        params = {
            "taxon_name": taxon_name,
            "quality_grade": "research",
            "photos": "true",
            "captive": "false",
            "per_page": per_page,
            "page": page,
            "order": "desc",
            "order_by": "votes",
        }

        try:
            headers = {
                "User-Agent": "BioPlatformCaldas/1.0 (Research; bioplatform@example.com)",
                "Accept": "application/json",
            }
            resp = requests.get(
                INAT_SEARCH_URL, params=params,
                headers=headers, timeout=REQUEST_TIMEOUT,
            )

            if verbose:
                print(f"    [API] {taxon_name} page={page} → HTTP {resp.status_code}")

            if resp.status_code == 429:
                # Rate limited — wait and retry
                if verbose:
                    print("    [API] Rate limited, waiting 10s...")
                time.sleep(10)
                continue

            if resp.status_code == 422:
                # Taxon not found on iNaturalist
                if verbose:
                    print(f"    [API] Taxon not found: {taxon_name}")
                break

            resp.raise_for_status()
            data = resp.json()

        except requests.exceptions.RequestException as e:
            if verbose:
                print(f"    [API] Request error: {e}")
            break

        total_results = data.get("total_results", 0)
        results = data.get("results", [])

        if verbose and page == 1:
            print(f"    [API] total_results={total_results}, page_results={len(results)}")

        if not results:
            break

        for obs in results:
            obs_id = str(obs.get("id", ""))

            # Skip if this observation is already in our GBIF dataset
            if obs_id in existing_gbif_ids:
                continue

            obs_photos = obs.get("photos", [])
            for photo in obs_photos:
                if len(photos) >= needed:
                    break

                # v1 API returns photo.url as a square thumbnail URL
                url = photo.get("url", "")
                if not url:
                    continue

                # Convert square thumbnail to desired size
                if "square" in url:
                    if image_size <= 256:
                        url = url.replace("/square.", "/small.")
                    elif image_size <= 512:
                        url = url.replace("/square.", "/medium.")
                    else:
                        url = url.replace("/square.", "/large.")

                photo_id = photo.get("id")
                if not photo_id:
                    photo_id = hashlib.md5(url.encode()).hexdigest()[:10]

                photos.append({"url": url, "photo_id": str(photo_id)})

        page += 1
        time.sleep(API_RATE_LIMIT)  # respect rate limits

    return photos


def download_photo(url: str, output_path: Path, image_size: int = 512) -> bool:
    """Download and validate a single photo."""
    if output_path.exists():
        return True

    try:
        headers = {
            "User-Agent": "BioPlatformCaldas/1.0 (Research; bioplatform@example.com)"
        }
        resp = requests.get(url, timeout=REQUEST_TIMEOUT, headers=headers)
        resp.raise_for_status()

        img = Image.open(BytesIO(resp.content))
        img.verify()
        img = Image.open(BytesIO(resp.content))

        if img.mode != "RGB":
            img = img.convert("RGB")

        img.thumbnail((image_size, image_size), Image.Resampling.LANCZOS)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path, "JPEG", quality=90)
        return True

    except Exception:
        return False


# ═══════════════════════════════════════════════════════════════════
#  Main Pipeline
# ═══════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download supplemental images from iNaturalist API"
    )
    parser.add_argument(
        "--max-images", type=int, default=50,
        help="Max total images per species (existing + downloaded) (default: 50)",
    )
    parser.add_argument(
        "--min-existing", type=int, default=3,
        help="Minimum existing images to attempt supplementing (default: 3)",
    )
    parser.add_argument(
        "--image-size", type=int, default=512,
        help="Image size for downloaded photos (default: 512)",
    )
    parser.add_argument(
        "--max-species", type=int, default=0,
        help="Limit number of species to process (0 = all eligible)",
    )
    parser.add_argument(
        "--workers", type=int, default=6,
        help="Parallel download threads (default: 6)",
    )
    parser.add_argument(
        "--verbose", action="store_true",
        help="Show detailed API request/response info per species",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Show what would be done without downloading",
    )
    args = parser.parse_args()

    # ── Load species data ──────────────────────────────────────────
    if not SPECIES_JSON.exists():
        print(f"[ERROR] No se encontró {SPECIES_JSON}")
        print("  → Ejecuta primero: python scripts/01_analyze_dataset.py")
        sys.exit(1)

    with open(SPECIES_JSON, "r", encoding="utf-8") as f:
        all_species: list[dict] = json.load(f)

    print(f"\n{'=' * 60}")
    print("  SUPPLEMENT IMAGES (API Download) – BioPlatform Caldas")
    print(f"{'=' * 60}")
    print("  API:            iNaturalist v1 (research-grade)")
    print(f"  Max images:     {args.max_images} total per species")
    print(f"  Min existing:   {args.min_existing}")
    print(f"  Image size:     {args.image_size}px")
    print(f"  Workers:        {args.workers}")
    print(f"  Verbose:        {'ON' if args.verbose else 'OFF'}")
    print(f"{'=' * 60}\n")

    # ── Find species that need supplementing ───────────────────────
    # Only consider species that actually exist in raw_images/
    candidates = []
    skipped_no_dir = 0
    for sp in all_species:
        sp_dir = find_species_dir(sp)
        if sp_dir is None:
            skipped_no_dir += 1
            continue
        current = count_images(sp_dir)
        if current < args.max_images and current >= args.min_existing:
            candidates.append({
                "species": sp,
                "sp_dir": sp_dir,
                "current_count": current,
                "needed": args.max_images - current,
            })

    # Sort by fewest images first (most needy species get priority)
    candidates.sort(key=lambda c: c["current_count"])

    if args.max_species > 0:
        candidates = candidates[:args.max_species]

    # ── Summary ───────────────────────────────────────────────────
    print(f"[INFO] Total species in JSON:          {len(all_species)}")
    print(f"[INFO] Skipped (no raw_images dir):    {skipped_no_dir}")
    print(f"[INFO] With raw_images dir:            {len(all_species) - skipped_no_dir}")
    print(f"[INFO] Eligible candidates (< {args.max_images} imgs, ≥ {args.min_existing} existing): {len(candidates)}")

    if not candidates:
        print("[INFO] No species to supplement. Done.")
        return

    # Distribution of needed images
    dist = {"1-5": 0, "6-10": 0, "11-20": 0, "21-40": 0, "41+": 0}
    for c in candidates:
        n = c["needed"]
        if n <= 5:
            dist["1-5"] += 1
        elif n <= 10:
            dist["6-10"] += 1
        elif n <= 20:
            dist["11-20"] += 1
        elif n <= 40:
            dist["21-40"] += 1
        else:
            dist["41+"] += 1
    print(f"[INFO] Images needed distribution: {dist}")

    if args.dry_run:
        print(f"\n[DRY RUN] Would process {len(candidates)} species:")
        for c in candidates[:30]:
            sp = c["species"]
            print(f"  {sp['species']:40s} │ have: {c['current_count']:3d} │ need: {c['needed']:3d}")
        if len(candidates) > 30:
            print(f"  ... and {len(candidates) - 30} more")
        return

    # ── Process each species ──────────────────────────────────────
    run_start = datetime.now(timezone.utc)
    report = {
        "run_started": run_start.isoformat(),
        "parameters": {
            "max_images": args.max_images,
            "min_existing": args.min_existing,
            "image_size": args.image_size,
        },
        "candidates": len(candidates),
        "results": [],
    }
    total_downloaded = 0
    total_failed = 0
    total_no_results = 0
    kingdom_stats: dict[str, dict] = {}

    # ── Phase 1: Query API sequentially (rate-limited) ─────────
    print("[Phase 1] Querying iNaturalist API for photo URLs...")
    # Each entry: {species dict, sp_dir, current_count, photos list}
    download_plan: list[dict] = []
    total_urls = 0

    pbar = tqdm(candidates, desc="Querying API")
    for cand in pbar:
        sp = cand["species"]
        sp_name = sp["species"]
        pbar.set_postfix_str(sp_name[:30])

        sp_dir = cand["sp_dir"] or make_species_dir(sp)
        current = count_images(sp_dir)
        needed = args.max_images - current

        if needed <= 0:
            continue

        existing_ids = set(sp.get("gbif_ids", []))
        photos = fetch_inat_photos(
            taxon_name=sp_name,
            existing_gbif_ids=existing_ids,
            needed=needed,
            image_size=args.image_size,
            verbose=args.verbose,
        )

        if not photos:
            total_no_results += 1
            if args.verbose:
                print(f"    [SKIP] No photos found for: {sp_name}")

        download_plan.append({
            "species": sp,
            "sp_dir": sp_dir,
            "initial": cand["current_count"],
            "photos": photos,
        })
        total_urls += len(photos)

    print(f"[Phase 1] Done. Found {total_urls:,} photo URLs across {len(download_plan)} species.")
    print(f"[Phase 1] Species with no API results: {total_no_results}")

    if total_urls == 0:
        print("[INFO] No photos to download from API.")
        # Still save report with results
        for plan in download_plan:
            sp = plan["species"]
            report["results"].append({
                "species": sp["species"],
                "scientific_name": sp.get("scientific_name", sp["species"]),
                "kingdom": sp.get("kingdom", "Unknown"),
                "family": sp.get("family", "Unknown"),
                "initial": plan["initial"],
                "photos_found": 0, "downloaded": 0, "failed": 0,
                "final": plan["initial"],
            })
    else:
        # ── Phase 2: Download photos in parallel ──────────────────
        print(f"[Phase 2] Downloading {total_urls:,} photos ({args.workers} workers)...")

        # Build flat task list: (species_dict, sp_dir, photo, initial_count)
        tasks: list[tuple[dict, Path, dict]] = []
        for plan in download_plan:
            for photo in plan["photos"]:
                tasks.append((plan["species"], plan["sp_dir"], photo))

        # Track per-species results
        sp_results: dict[str, dict] = {}
        for plan in download_plan:
            sp_name = plan["species"]["species"]
            sp_results[sp_name] = {
                "initial": plan["initial"],
                "sp_dir": plan["sp_dir"],
                "photos_found": len(plan["photos"]),
                "downloaded": 0,
                "failed": 0,
            }

        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            futures = {}
            for sp_dict, sp_dir, photo in tasks:
                fname = f"api_{photo['photo_id']}.jpg"
                out_path = sp_dir / fname
                future = executor.submit(
                    download_photo, photo["url"], out_path, args.image_size,
                )
                futures[future] = sp_dict["species"]

            with tqdm(total=len(tasks), desc="Downloading", unit="img") as dl_bar:
                for future in as_completed(futures):
                    sp_name = futures[future]
                    success = future.result()
                    if success:
                        sp_results[sp_name]["downloaded"] += 1
                        total_downloaded += 1
                    else:
                        sp_results[sp_name]["failed"] += 1
                        total_failed += 1
                    dl_bar.update(1)

        # ── Build per-species report entries ───────────────────────
        for plan in download_plan:
            sp = plan["species"]
            sp_name = sp["species"]
            kingdom = sp.get("kingdom", "Unknown")
            res = sp_results[sp_name]
            final_count = count_images(res["sp_dir"])

            if kingdom not in kingdom_stats:
                kingdom_stats[kingdom] = {
                    "processed": 0, "downloaded": 0, "no_results": 0,
                }
            kingdom_stats[kingdom]["processed"] += 1
            kingdom_stats[kingdom]["downloaded"] += res["downloaded"]
            if res["photos_found"] == 0:
                kingdom_stats[kingdom]["no_results"] += 1

            report["results"].append({
                "species": sp_name,
                "scientific_name": sp.get("scientific_name", sp_name),
                "kingdom": kingdom,
                "family": sp.get("family", "Unknown"),
                "initial": res["initial"],
                "photos_found": res["photos_found"],
                "downloaded": res["downloaded"],
                "failed": res["failed"],
                "final": final_count,
            })

    # ── Build final distribution ──────────────────────────────────
    final_dist = {"<20": 0, "20-29": 0, "30-49": 0, "50+": 0}
    for r in report["results"]:
        fc = r["final"]
        if fc < 20:
            final_dist["<20"] += 1
        elif fc < 30:
            final_dist["20-29"] += 1
        elif fc < 50:
            final_dist["30-49"] += 1
        else:
            final_dist["50+"] += 1

    run_end = datetime.now(timezone.utc)

    # ── Save report ────────────────────────────────────────────────
    report["run_finished"] = run_end.isoformat()
    report["duration_seconds"] = round((run_end - run_start).total_seconds(), 1)
    report["summary"] = {
        "total_downloaded": total_downloaded,
        "total_failed": total_failed,
        "total_no_results": total_no_results,
        "total_candidates": len(candidates),
        "success_rate_pct": round(
            (len(candidates) - total_no_results) / len(candidates) * 100, 1
        ) if candidates else 0,
        "final_distribution": final_dist,
    }
    report["kingdom_breakdown"] = kingdom_stats
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # ── Final summary ──────────────────────────────────────────────
    print(f"\n{'=' * 60}")
    print("  DOWNLOAD COMPLETE")
    print(f"{'=' * 60}")
    print(f"  Candidates processed:     {len(candidates)}")
    print(f"  Images downloaded:        {total_downloaded}")
    print(f"  Downloads failed:         {total_failed}")
    print(f"  Species with no results:  {total_no_results}")
    print(f"  Final distribution:       {final_dist}")
    print(f"  Duration:                 {report['duration_seconds']}s")
    print("\n  Per-kingdom breakdown:")
    for k, v in sorted(kingdom_stats.items()):
        print(
            f"    {k:15s} │ processed: {v['processed']:4d} "
            f"│ downloaded: {v['downloaded']:5d} "
            f"│ no_results: {v['no_results']:4d}"
        )
    print(f"\n  Report saved: {REPORT_FILE}")
    print("\n  Next steps:")
    print("  1. Augment offline: python scripts/02d_offline_augment.py --target 50")
    print(f"  2. Re-organize:    python scripts/03_organize_dataset.py --min-images {args.min_existing} --clean")
    print("  3. Re-train:       python scripts/04_train_cnn.py --model efficientnet_b2 ...")


if __name__ == "__main__":
    main()
