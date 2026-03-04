"""
Script 01: Análisis del Dataset GBIF de Biodiversidad de Caldas
================================================================
Parsea occurrence.txt y multimedia.txt del Darwin Core Archive (GBIF),
genera estadísticas de distribución taxonómica e imágenes por especie.

Uso:
    python scripts/01_analyze_dataset.py

Salida:
    - data/dataset_analysis/species_summary.csv
    - data/dataset_analysis/taxonomy_tree.json
    - data/dataset_analysis/stats_report.txt
    - data/dataset_analysis/class_distribution.png
"""

import csv
import json
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path

# ── Resolve paths ──────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent                          # Bio.Backend.AI/
DATASET_DIR = PROJECT_ROOT / "dataset-metadata"
OUTPUT_DIR = PROJECT_ROOT / "data" / "dataset_analysis"

OCCURRENCE_FILE = DATASET_DIR / "occurrence.txt"
MULTIMEDIA_FILE = DATASET_DIR / "multimedia.txt"


def parse_occurrence(filepath: Path) -> list[dict]:
    """Parse GBIF occurrence.txt (tab-separated) into a list of dicts."""
    records: list[dict] = []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            records.append(row)
    print(f"[INFO] Parsed {len(records):,} occurrence records.")
    return records


def parse_multimedia(filepath: Path) -> dict[str, list[str]]:
    """
    Parse multimedia.txt → { gbifID: [url1, url2, ...] }
    Solo incluye StillImage (imágenes, no audio).
    """
    media_map: dict[str, list[str]] = defaultdict(list)
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        for row in reader:
            if row.get("type") == "StillImage" and row.get("identifier"):
                media_map[row["gbifID"]].append(row["identifier"])
    total_images = sum(len(v) for v in media_map.values())
    print(f"[INFO] Parsed {total_images:,} image URLs for {len(media_map):,} occurrences.")
    return media_map


def build_species_summary(
    occurrences: list[dict],
    media_map: dict[str, list[str]],
) -> list[dict]:
    """
    Build a summary per species with taxonomy + image counts.
    Only includes occurrences identified to SPECIES rank with images.
    """
    species_data: dict[str, dict] = {}

    for occ in occurrences:
        gbif_id = occ.get("gbifID", "")
        taxon_rank = occ.get("taxonRank", "").upper()
        species_name = occ.get("species", "").strip()
        scientific_name = occ.get("scientificName", "").strip()

        # Solo incluir registros identificados a nivel de especie o subespecie
        if taxon_rank not in ("SPECIES", "SUBSPECIES"):
            continue
        if not species_name:
            continue

        # Usar 'species' como label (binomial, ej: "Bombus funebris")
        label = species_name

        if label not in species_data:
            species_data[label] = {
                "species": label,
                "scientific_name": scientific_name,
                "kingdom": occ.get("kingdom", ""),
                "phylum": occ.get("phylum", ""),
                "class": occ.get("class", ""),
                "order": occ.get("order", ""),
                "family": occ.get("family", ""),
                "genus": occ.get("genus", ""),
                "occurrence_count": 0,
                "image_count": 0,
                "image_urls": [],
                "gbif_ids": [],
                "municipalities": set(),
                "iucn_status": occ.get("iucnRedListCategory", ""),
            }

        entry = species_data[label]
        entry["occurrence_count"] += 1
        entry["gbif_ids"].append(gbif_id)

        # Agregar imágenes vinculadas
        urls = media_map.get(gbif_id, [])
        entry["image_count"] += len(urls)
        entry["image_urls"].extend(urls)

        # Municipio
        municipality = occ.get("municipality", "").strip()
        if municipality:
            # Extraer solo nombre del municipio (antes de la coma)
            mun_name = municipality.split(",")[0].strip()
            entry["municipalities"].add(mun_name)

    # Convertir sets a listas para serialización
    for entry in species_data.values():
        entry["municipalities"] = sorted(entry["municipalities"])

    # Ordenar por cantidad de imágenes (descendente)
    result = sorted(species_data.values(), key=lambda x: x["image_count"], reverse=True)
    return result


def build_taxonomy_tree(species_list: list[dict]) -> dict:
    """Build a hierarchical taxonomy tree: Kingdom > Phylum > Class > Order > Family > Genus > Species."""
    tree: dict = {}
    for sp in species_list:
        kingdom = sp["kingdom"] or "Unknown"
        phylum = sp["phylum"] or "Unknown"
        cls = sp["class"] or "Unknown"
        order = sp["order"] or "Unknown"
        family = sp["family"] or "Unknown"
        genus = sp["genus"] or "Unknown"
        species = sp["species"]

        tree.setdefault(kingdom, {})
        tree[kingdom].setdefault(phylum, {})
        tree[kingdom][phylum].setdefault(cls, {})
        tree[kingdom][phylum][cls].setdefault(order, {})
        tree[kingdom][phylum][cls][order].setdefault(family, {})
        tree[kingdom][phylum][cls][order][family].setdefault(genus, [])
        if species not in tree[kingdom][phylum][cls][order][family][genus]:
            tree[kingdom][phylum][cls][order][family][genus].append(species)

    return tree


def generate_report(species_list: list[dict]) -> str:
    """Generate a human-readable statistics report."""
    total_species = len(species_list)
    total_images = sum(sp["image_count"] for sp in species_list)
    total_occurrences = sum(sp["occurrence_count"] for sp in species_list)

    # Distribución por reino
    kingdom_counts = Counter(sp["kingdom"] for sp in species_list)
    class_counts = Counter(sp["class"] for sp in species_list)
    family_counts = Counter(sp["family"] for sp in species_list)

    # Especies con suficientes imágenes para CNN
    MIN_IMAGES_CNN = 10
    species_with_enough = [sp for sp in species_list if sp["image_count"] >= MIN_IMAGES_CNN]
    species_20plus = [sp for sp in species_list if sp["image_count"] >= 20]
    species_50plus = [sp for sp in species_list if sp["image_count"] >= 50]

    lines = [
        "=" * 70,
        "  ANÁLISIS DEL DATASET DE BIODIVERSIDAD DE CALDAS",
        "  GBIF Darwin Core Archive - iNaturalist Research-Grade",
        "=" * 70,
        "",
        f"Total de especies únicas:          {total_species:,}",
        f"Total de registros de ocurrencia:   {total_occurrences:,}",
        f"Total de imágenes disponibles:      {total_images:,}",
        f"Promedio imágenes/especie:          {total_images / max(total_species, 1):.1f}",
        "",
        "─" * 40,
        "DISTRIBUCIÓN POR REINO:",
        "─" * 40,
    ]
    for kingdom, count in kingdom_counts.most_common():
        imgs = sum(sp["image_count"] for sp in species_list if sp["kingdom"] == kingdom)
        lines.append(f"  {kingdom:20s} → {count:4d} especies, {imgs:6d} imágenes")

    lines += [
        "",
        "─" * 40,
        "TOP 10 CLASES POR # DE ESPECIES:",
        "─" * 40,
    ]
    for cls, count in class_counts.most_common(10):
        lines.append(f"  {cls:25s} → {count:4d} especies")

    lines += [
        "",
        "─" * 40,
        "TOP 15 FAMILIAS POR # DE ESPECIES:",
        "─" * 40,
    ]
    for family, count in family_counts.most_common(15):
        lines.append(f"  {family:25s} → {count:4d} especies")

    lines += [
        "",
        "─" * 40,
        "APTITUD PARA CNN (mín. imágenes por especie):",
        "─" * 40,
        f"  ≥10 imágenes: {len(species_with_enough):4d} especies ({sum(sp['image_count'] for sp in species_with_enough):,} imgs)",
        f"  ≥20 imágenes: {len(species_20plus):4d} especies ({sum(sp['image_count'] for sp in species_20plus):,} imgs)",
        f"  ≥50 imágenes: {len(species_50plus):4d} especies ({sum(sp['image_count'] for sp in species_50plus):,} imgs)",
        "",
        "─" * 40,
        "TOP 20 ESPECIES CON MÁS IMÁGENES:",
        "─" * 40,
    ]
    for sp in species_list[:20]:
        lines.append(
            f"  {sp['species']:45s} │ {sp['image_count']:5d} imgs │ {sp['family']:20s} │ {sp['kingdom']}"
        )

    lines += [
        "",
        "─" * 40,
        "ESPECIES CON POCAS IMÁGENES (Top 20 con <5):",
        "─" * 40,
    ]
    low_img_species = [sp for sp in species_list if sp["image_count"] < 5]
    for sp in low_img_species[:20]:
        lines.append(
            f"  {sp['species']:45s} │ {sp['image_count']:2d} imgs │ {sp['family']}"
        )
    lines.append(f"\n  Total con <5 imágenes: {len(low_img_species)} especies")

    return "\n".join(lines)


def plot_class_distribution(species_list: list[dict], output_path: Path) -> None:
    """Generate a bar chart of image distribution by class (top 15)."""
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("[WARN] matplotlib not installed, skipping chart generation.")
        return

    class_images: Counter = Counter()
    for sp in species_list:
        cls = sp["class"] or "Unknown"
        class_images[cls] += sp["image_count"]

    top_classes = class_images.most_common(15)
    labels = [c[0] for c in top_classes]
    values = [c[1] for c in top_classes]

    fig, ax = plt.subplots(figsize=(12, 6))
    bars = ax.barh(labels[::-1], values[::-1], color="#2E8B57")
    ax.set_xlabel("Número de Imágenes")
    ax.set_title("Distribución de Imágenes por Clase Taxonómica (Top 15) - Caldas, Colombia")
    ax.bar_label(bars, padding=3)
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    print(f"[INFO] Chart saved to {output_path}")


def save_species_csv(species_list: list[dict], output_path: Path) -> None:
    """Save species summary as CSV (without image_urls for size)."""
    fieldnames = [
        "species", "scientific_name", "kingdom", "phylum", "class",
        "order", "family", "genus", "occurrence_count", "image_count",
        "municipalities", "iucn_status",
    ]
    with open(output_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for sp in species_list:
            row = {k: sp[k] for k in fieldnames if k != "municipalities"}
            row["municipalities"] = "; ".join(sp["municipalities"])
            writer.writerow(row)
    print(f"[INFO] Species summary CSV saved to {output_path}")


def save_species_with_urls(species_list: list[dict], output_path: Path) -> None:
    """Save full species data including image URLs as JSON (needed by download script)."""
    # Remove sets before serialization
    serializable = []
    for sp in species_list:
        entry = {k: v for k, v in sp.items() if k != "municipalities"}
        entry["municipalities"] = sp["municipalities"]
        serializable.append(entry)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(serializable, f, ensure_ascii=False, indent=2)
    print(f"[INFO] Full species data (with URLs) saved to {output_path}")


def main() -> None:
    # Verificar que los archivos existen
    if not OCCURRENCE_FILE.exists():
        print(f"[ERROR] No se encontró: {OCCURRENCE_FILE}")
        sys.exit(1)
    if not MULTIMEDIA_FILE.exists():
        print(f"[ERROR] No se encontró: {MULTIMEDIA_FILE}")
        sys.exit(1)

    # Crear directorio de salida
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Parsear datos
    print("\n[STEP 1/5] Parsing occurrence records...")
    occurrences = parse_occurrence(OCCURRENCE_FILE)

    print("\n[STEP 2/5] Parsing multimedia (image URLs)...")
    media_map = parse_multimedia(MULTIMEDIA_FILE)

    # 2. Construir resumen por especie
    print("\n[STEP 3/5] Building species summary...")
    species_list = build_species_summary(occurrences, media_map)
    print(f"  → {len(species_list)} species with images found")

    # 3. Generar y guardar salidas
    print("\n[STEP 4/5] Generating outputs...")

    # CSV resumen
    save_species_csv(species_list, OUTPUT_DIR / "species_summary.csv")

    # JSON con URLs (usado por script de descarga)
    save_species_with_urls(species_list, OUTPUT_DIR / "species_with_urls.json")

    # Árbol taxonómico
    taxonomy_tree = build_taxonomy_tree(species_list)
    with open(OUTPUT_DIR / "taxonomy_tree.json", "w", encoding="utf-8") as f:
        json.dump(taxonomy_tree, f, ensure_ascii=False, indent=2)
    print(f"[INFO] Taxonomy tree saved to {OUTPUT_DIR / 'taxonomy_tree.json'}")

    # Reporte de texto
    report = generate_report(species_list)
    with open(OUTPUT_DIR / "stats_report.txt", "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[INFO] Stats report saved to {OUTPUT_DIR / 'stats_report.txt'}")
    print("\n" + report)

    # Chart
    print("\n[STEP 5/5] Generating distribution chart...")
    plot_class_distribution(species_list, OUTPUT_DIR / "class_distribution.png")

    print("\n✅ Analysis complete! Outputs in:", OUTPUT_DIR)


if __name__ == "__main__":
    main()
