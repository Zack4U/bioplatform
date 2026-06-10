"""
Script 02f: Descarga Incremental (Delta) de Imágenes Validadas
================================================================
Consulta la tabla `species_images` en PostgreSQL (BioCommerce_Scientific)
para obtener las imágenes validadas por expertos, compara con lo que ya
existe en `data/raw_images/`, y descarga solo las faltantes desde S3.

Workflow:
  1. Conecta a PostgreSQL y consulta `species_images` JOIN `species` JOIN `taxonomy`
     donde `is_validated_by_expert = true`.
  2. Compara las URLs de imágenes contra los archivos locales en `raw_images/`.
  3. Descarga las imágenes faltantes desde el bucket público de S3 (sin auth).
  4. Organiza cada imagen en la jerarquía:
     raw_images/Kingdom/Phylum/Class/Family/Species_name/filename.jpg
  5. Genera un manifiesto JSON (`delta_manifest.json`) para que
     `03_organize_dataset.py` pueda aplicar el Replay Buffer.

Prerequisitos:
  - PostgreSQL (BioCommerce_Scientific) accesible
  - Variables de entorno: PG_HOST, PG_PORT, PG_USER, PG_PASSWORD, PG_DATABASE
  - El bucket S3 es público (no requiere credenciales AWS)

Uso:
    python scripts/dataset/02f_download_delta.py [--workers 6] [--dry-run]
"""

import argparse
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv
from tqdm import tqdm

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent  # Bio.Backend.AI/
RAW_IMAGES_DIR = PROJECT_ROOT / "data" / "raw_images"
ANALYSIS_DIR = PROJECT_ROOT / "data" / "dataset_analysis"
MANIFEST_FILE = ANALYSIS_DIR / "delta_manifest.json"

# Load .env
load_dotenv(PROJECT_ROOT / ".env")

# ── Image extensions ───────────────────────────────────────────────
_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _get_db_connection():
    """Create a synchronous psycopg2 connection to PostgreSQL."""
    try:
        import psycopg2
    except ImportError:
        print("[ERROR] psycopg2 not installed. Run: pip install psycopg2-binary")
        sys.exit(1)

    host = os.environ.get("PG_HOST", "localhost")
    port = int(os.environ.get("PG_PORT", "5433"))
    user = os.environ.get("PG_USER", "postgres")
    password = os.environ.get("PG_PASSWORD", "DevPassword123!")
    database = os.environ.get("PG_DATABASE", "BioCommerce_Scientific")

    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=database,
        )
        return conn
    except Exception as exc:
        print(f"[ERROR] Cannot connect to PostgreSQL: {exc}")
        print(f"  Host: {host}:{port}, DB: {database}, User: {user}")
        sys.exit(1)


def fetch_validated_images() -> list[dict]:
    """
    Query species_images for all expert-validated images,
    enriched with taxonomy for folder organization.

    Returns list of dicts:
      { image_url, species_name, kingdom, phylum, class_name, family }
    """
    query = """
        SELECT
            si.image_url,
            s.scientific_name,
            COALESCE(t.kingdom, 'Unknown')    AS kingdom,
            COALESCE(t.phylum, 'Unknown')     AS phylum,
            COALESCE(t.class_name, 'Unknown') AS class_name,
            COALESCE(t.family, 'Unknown')     AS family
        FROM species_images si
        JOIN species s ON si.species_id = s.id
        LEFT JOIN taxonomy t ON s.taxonomy_id = t.id
        WHERE si.is_validated_by_expert = true
        ORDER BY s.scientific_name, si.created_at
    """

    conn = _get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(query)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
    finally:
        conn.close()

    results = [dict(zip(columns, row)) for row in rows]
    print(f"  → {len(results):,} validated images found in database")
    return results


def _build_local_path(
    raw_dir: Path,
    kingdom: str,
    phylum: str,
    class_name: str,
    family: str,
    species_name: str,
    filename: str,
) -> Path:
    """
    Build the local path following the taxonomy folder hierarchy.
    Species names use underscores (Genus_species).
    """
    species_folder = species_name.strip().replace(" ", "_")
    return (
        raw_dir
        / kingdom.strip()
        / phylum.strip()
        / class_name.strip()
        / family.strip()
        / species_folder
        / filename
    )


def _extract_filename_from_url(url: str) -> str:
    """Extract filename from S3 URL."""
    parsed = urlparse(url)
    return Path(parsed.path).name


def scan_existing_images(raw_dir: Path) -> set[str]:
    """
    Scan existing raw_images/ and build a set of known filenames
    per species for deduplication.

    Returns set of "Species_name/filename.jpg" keys.
    """
    existing: set[str] = set()
    if not raw_dir.exists():
        return existing

    for root, _dirs, files in os.walk(raw_dir):
        root_path = Path(root)
        for f in files:
            if Path(f).suffix.lower() in _IMAGE_EXTENSIONS:
                # Build relative key: parent_folder/filename
                species_folder = root_path.name
                existing.add(f"{species_folder}/{f}")

    return existing


def download_image(url: str, dest_path: Path, timeout: int = 30) -> bool:
    """Download a single image from a public URL."""
    try:
        resp = requests.get(url, timeout=timeout, stream=True)
        resp.raise_for_status()

        dest_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dest_path, "wb") as f:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)

        return True
    except Exception:
        return False


def run_delta_download(
    workers: int = 6,
    dry_run: bool = False,
) -> dict:
    """
    Main delta download pipeline.

    Returns manifest dict with new/existing/failed image lists.
    """
    print("=" * 60)
    print("  DELTA DOWNLOAD - Validated Images from S3")
    print("=" * 60)

    # Step 1: Fetch validated images from DB
    print("\n[STEP 1/4] Querying PostgreSQL for validated images...")
    db_images = fetch_validated_images()

    if not db_images:
        print("[WARN] No validated images found in the database.")
        return {
            "new_images": [],
            "existing_images": [],
            "failed": [],
            "total_downloaded": 0,
        }

    # Step 2: Scan existing local images
    print(f"\n[STEP 2/4] Scanning existing images in {RAW_IMAGES_DIR}...")
    existing_keys = scan_existing_images(RAW_IMAGES_DIR)
    print(f"  → {len(existing_keys):,} existing images found locally")

    # Step 3: Calculate delta
    print("\n[STEP 3/4] Calculating delta...")
    new_images: list[dict] = []
    existing_images: list[dict] = []

    for img in db_images:
        filename = _extract_filename_from_url(img["image_url"])
        species_folder = img["scientific_name"].strip().replace(" ", "_")
        key = f"{species_folder}/{filename}"

        local_path = _build_local_path(
            RAW_IMAGES_DIR,
            img["kingdom"],
            img["phylum"],
            img["class_name"],
            img["family"],
            img["scientific_name"],
            filename,
        )

        entry = {
            "url": img["image_url"],
            "path": str(local_path),
            "species": img["scientific_name"],
            "kingdom": img["kingdom"],
            "phylum": img["phylum"],
            "class_name": img["class_name"],
            "family": img["family"],
        }

        if key in existing_keys or local_path.exists():
            existing_images.append(entry)
        else:
            new_images.append(entry)

    print(f"  → New images to download:  {len(new_images):,}")
    print(f"  → Already existing:        {len(existing_images):,}")

    if dry_run:
        print("\n[DRY RUN] No downloads performed.")
        manifest = {
            "new_images": new_images,
            "existing_images": existing_images,
            "failed": [],
            "total_downloaded": 0,
            "dry_run": True,
        }
        _save_manifest(manifest)
        return manifest

    # Step 4: Download delta
    if not new_images:
        print("\n[INFO] No new images to download. Dataset is up to date.")
        manifest = {
            "new_images": [],
            "existing_images": existing_images,
            "failed": [],
            "total_downloaded": 0,
        }
        _save_manifest(manifest)
        return manifest

    print(f"\n[STEP 4/4] Downloading {len(new_images):,} images ({workers} workers)...")

    failed: list[dict] = []
    downloaded: list[dict] = []
    start = time.time()

    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {}
        for entry in new_images:
            fut = executor.submit(download_image, entry["url"], Path(entry["path"]))
            futures[fut] = entry

        for fut in tqdm(
            as_completed(futures), total=len(futures), desc="  Downloading"
        ):
            entry = futures[fut]
            try:
                ok = fut.result()
                if ok:
                    downloaded.append(entry)
                else:
                    failed.append(entry)
            except Exception:
                failed.append(entry)

    elapsed = time.time() - start

    print(f"\n  → Downloaded:  {len(downloaded):,}")
    print(f"  → Failed:      {len(failed):,}")
    print(f"  → Time:        {elapsed:.1f}s")

    manifest = {
        "new_images": downloaded,
        "existing_images": existing_images,
        "failed": failed,
        "total_downloaded": len(downloaded),
    }
    _save_manifest(manifest)

    return manifest


def _save_manifest(manifest: dict) -> None:
    """Save the delta manifest JSON for downstream scripts."""
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"  → Manifest saved: {MANIFEST_FILE}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download validated species images (delta) from S3"
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=6,
        help="Number of parallel download threads (default: 6)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only calculate delta, don't download images",
    )
    args = parser.parse_args()

    manifest = run_delta_download(
        workers=args.workers,
        dry_run=args.dry_run,
    )

    print("\n" + "=" * 60)
    print("  DELTA DOWNLOAD COMPLETE")
    print("=" * 60)
    print(f"  New downloads:  {manifest['total_downloaded']:,}")
    print(f"  Already local:  {len(manifest['existing_images']):,}")
    print(f"  Failed:         {len(manifest.get('failed', [])):,}")
    print(f"  Manifest:       {MANIFEST_FILE}")
    print("\n  Next: python scripts/dataset/03_organize_dataset.py \\")
    print(f"          --new-images-manifest {MANIFEST_FILE}")


if __name__ == "__main__":
    main()
