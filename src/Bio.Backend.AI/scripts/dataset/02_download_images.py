"""
Script 02: Descarga de Imágenes del Dataset GBIF/iNaturalist
==============================================================
Descarga imágenes desde las URLs de iNaturalist, organizadas por
taxonomía: Kingdom/Phylum/Class/Family/Species/

Requiere ejecutar 01_analyze_dataset.py primero.

Uso:
    python scripts/02_download_images.py [--min-images 10] [--max-per-species 100]
                                          [--workers 8] [--image-size 512]
                                          [--resume]

Salida:
    data/raw_images/
    ├── Animalia/
    │   ├── Arthropoda/
    │   │   ├── Insecta/
    │   │   │   ├── Apidae/
    │   │   │   │   ├── Bombus_funebris/
    │   │   │   │   │   ├── 001.jpg
    │   │   │   │   │   ├── 002.jpg
    │   │   │   │   │   ...
    ├── Plantae/
    │   ...
    data/dataset_analysis/download_manifest.json
"""

import argparse
import hashlib
import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
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
MANIFEST_FILE = ANALYSIS_DIR / "download_manifest.json"

# ── Constants ──────────────────────────────────────────────────────
INATURALIST_RESIZE_PREFIX = "https://inaturalist-open-data.s3.amazonaws.com/photos/"
REQUEST_TIMEOUT = 30
RETRY_COUNT = 3
RETRY_DELAY = 2


def sanitize_name(name: str) -> str:
    """Sanitize a taxonomic name for use as folder name."""
    return name.strip().replace(" ", "_").replace("/", "-").replace("\\", "-")


def get_resized_url(url: str, size: int = 512) -> str:
    """
    Convert iNaturalist original URL to a smaller size.
    Original: .../photos/123456/original.jpg
    Resized:  .../photos/123456/medium.jpg (or small/large)
    """
    if "original" in url:
        # medium ≈ 500px, large ≈ 1024px
        if size <= 256:
            return url.replace("/original.", "/small.")
        elif size <= 512:
            return url.replace("/original.", "/medium.")
        elif size <= 1024:
            return url.replace("/original.", "/large.")
    return url


def download_single_image(
    url: str,
    output_path: Path,
    image_size: int,
    timeout: int = REQUEST_TIMEOUT,
) -> tuple[bool, str]:
    """
    Download a single image, validate it, and resize if needed.
    Returns (success, message).
    """
    if output_path.exists():
        return True, "already_exists"

    # Use resized URL to save bandwidth
    download_url = get_resized_url(url, image_size)

    for attempt in range(RETRY_COUNT):
        try:
            headers = {
                "User-Agent": "BioPlatformCaldas/1.0 (Research; bioplatform@example.com)"
            }
            response = requests.get(download_url, timeout=timeout, headers=headers)
            response.raise_for_status()

            # Validate image
            img = Image.open(BytesIO(response.content))
            img.verify()

            # Re-open for actual processing (verify closes the stream)
            img = Image.open(BytesIO(response.content))

            # Convert to RGB (handle RGBA, palette, etc.)
            if img.mode != "RGB":
                img = img.convert("RGB")

            # Resize maintaining aspect ratio
            img.thumbnail((image_size, image_size), Image.Resampling.LANCZOS)

            # Save as JPEG
            output_path.parent.mkdir(parents=True, exist_ok=True)
            img.save(output_path, "JPEG", quality=90)

            return True, "downloaded"

        except requests.exceptions.HTTPError:
            if response.status_code == 404:
                return False, f"404_not_found: {download_url}"
            if attempt < RETRY_COUNT - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
        except (requests.exceptions.RequestException, OSError) as e:
            if attempt < RETRY_COUNT - 1:
                time.sleep(RETRY_DELAY * (attempt + 1))
            else:
                return False, f"error: {str(e)[:100]}"
        except Exception as e:
            return False, f"unexpected: {str(e)[:100]}"

    return False, "max_retries_exceeded"


def load_manifest(manifest_path: Path) -> dict:
    """Load or create download manifest for resume support."""
    if manifest_path.exists():
        with open(manifest_path, "r") as f:
            return json.load(f)
    return {"downloaded": {}, "failed": {}, "skipped_species": []}


def save_manifest(manifest: dict, manifest_path: Path) -> None:
    """Save download manifest."""
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download biodiversity images from iNaturalist/GBIF dataset"
    )
    parser.add_argument(
        "--min-images", type=int, default=10,
        help="Minimum images a species must have to be included (default: 10)"
    )
    parser.add_argument(
        "--max-per-species", type=int, default=150,
        help="Maximum images to download per species (default: 150)"
    )
    parser.add_argument(
        "--workers", type=int, default=6,
        help="Number of parallel download threads (default: 6)"
    )
    parser.add_argument(
        "--image-size", type=int, default=512,
        help="Target image size in pixels (default: 512)"
    )
    parser.add_argument(
        "--resume", action="store_true",
        help="Resume from previous download session"
    )
    args = parser.parse_args()

    # Verificar que existe el JSON de análisis
    if not SPECIES_JSON.exists():
        print(f"[ERROR] No se encontró {SPECIES_JSON}")
        print("  → Ejecuta primero: python scripts/01_analyze_dataset.py")
        sys.exit(1)

    # Cargar datos de especies
    with open(SPECIES_JSON, "r", encoding="utf-8") as f:
        all_species: list[dict] = json.load(f)
    print(f"[INFO] Loaded {len(all_species)} species from analysis.")

    # Filtrar especies con suficientes imágenes
    eligible_species = [
        sp for sp in all_species
        if sp["image_count"] >= args.min_images
    ]
    print(f"[INFO] {len(eligible_species)} species have ≥{args.min_images} images.")

    # Cargar/crear manifest
    manifest = load_manifest(MANIFEST_FILE) if args.resume else {
        "downloaded": {}, "failed": {}, "skipped_species": []
    }

    # Preparar tareas de descarga
    download_tasks: list[tuple[str, str, Path]] = []  # (species, url, path)

    for sp in eligible_species:
        species_name = sp["species"]
        kingdom = sanitize_name(sp.get("kingdom", "Unknown"))
        phylum = sanitize_name(sp.get("phylum", "Unknown"))
        cls = sanitize_name(sp.get("class", "Unknown"))
        family = sanitize_name(sp.get("family", "Unknown"))
        species_folder = sanitize_name(species_name)

        # Build taxonomy path: Kingdom/Phylum/Class/Family/Species
        species_dir = RAW_IMAGES_DIR / kingdom / phylum / cls / family / species_folder

        # Limit images per species
        urls = sp.get("image_urls", [])[:args.max_per_species]

        for idx, url in enumerate(urls, start=1):
            # Generate filename from URL hash for uniqueness
            url_hash = hashlib.md5(url.encode()).hexdigest()[:8]
            filename = f"{idx:04d}_{url_hash}.jpg"
            output_path = species_dir / filename

            # Skip if already in manifest
            if args.resume and url in manifest.get("downloaded", {}):
                continue

            download_tasks.append((species_name, url, output_path))

    total_tasks = len(download_tasks)
    print(f"\n[INFO] {total_tasks:,} images to download ({args.workers} workers)")
    print(f"[INFO] Output directory: {RAW_IMAGES_DIR}")
    print(f"[INFO] Image size: {args.image_size}px")

    if total_tasks == 0:
        print("[INFO] Nothing to download!")
        return

    # Create output dir
    RAW_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    # Download with thread pool
    stats = {"downloaded": 0, "existed": 0, "failed": 0}
    failed_urls: list[dict] = []

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        futures = {}
        for species_name, url, output_path in download_tasks:
            future = executor.submit(
                download_single_image, url, output_path, args.image_size
            )
            futures[future] = (species_name, url, output_path)

        with tqdm(total=total_tasks, desc="Downloading", unit="img") as pbar:
            for future in as_completed(futures):
                species_name, url, output_path = futures[future]
                success, message = future.result()

                if success:
                    if message == "already_exists":
                        stats["existed"] += 1
                    else:
                        stats["downloaded"] += 1
                    manifest["downloaded"][url] = str(output_path)
                else:
                    stats["failed"] += 1
                    manifest["failed"][url] = message
                    failed_urls.append({
                        "species": species_name,
                        "url": url,
                        "error": message,
                    })

                pbar.update(1)

                # Save manifest periodically
                if (stats["downloaded"] + stats["existed"]) % 500 == 0:
                    save_manifest(manifest, MANIFEST_FILE)

    # Final manifest save
    save_manifest(manifest, MANIFEST_FILE)

    # Save failed URLs
    if failed_urls:
        failed_path = ANALYSIS_DIR / "failed_downloads.json"
        with open(failed_path, "w") as f:
            json.dump(failed_urls, f, indent=2)
        print(f"\n[WARN] Failed downloads saved to {failed_path}")

    # Print summary
    print("\n" + "=" * 50)
    print("  DOWNLOAD SUMMARY")
    print("=" * 50)
    print(f"  New downloads:   {stats['downloaded']:,}")
    print(f"  Already existed: {stats['existed']:,}")
    print(f"  Failed:          {stats['failed']:,}")
    print(f"  Total processed: {total_tasks:,}")
    print(f"\n  Images saved to: {RAW_IMAGES_DIR}")


if __name__ == "__main__":
    main()
