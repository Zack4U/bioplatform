from __future__ import annotations

"""
Script 10: Generate Species Data via Gemini LLM
=================================================
Reads the master species list (from script 09) and uses Google Gemini
to generate structured species data in batches of 10.

Uses Pydantic models with Gemini's response_schema for guaranteed
JSON structure (Structured Outputs).

Outputs:
    1. CSV — Basic species info for SpeciesImportJob (taxonomy, description, etc.)
    2. JSON — Structured Traditional Uses and Economic Potential per species.
    3. TXT — Generation report with quality metrics.

Uso:
    python scripts/species/10_generate_species_data_llm.py
    python scripts/species/10_generate_species_data_llm.py --limit 20   # dry-run
    python scripts/species/10_generate_species_data_llm.py --batch-size 5

Requisitos:
    pip install google-genai pydantic
    GOOGLE_AI_API_KEY en .env
"""

import argparse
import csv
import json
import os
import re
import sys
import time
import unicodedata
from collections import Counter
from enum import Enum
from pathlib import Path
from typing import Any, Optional

from pydantic import BaseModel, Field

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore

# ── Paths ──────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
MASTER_LIST = PROJECT_ROOT / "data" / "species_catalog" / "master_species_list.json"
OUTPUT_DIR = PROJECT_ROOT / "data" / "species_catalog"
CHECKPOINT_FILE = OUTPUT_DIR / "_checkpoint_llm.json"

# ── CSV columns for SpeciesCsvRecord.cs ────────────────────────────
CSV_COLUMNS = [
    "Kingdom", "Phylum", "Class", "Order", "Family", "Genus",
    "ScientificName", "CommonName", "Slug", "Description",
    "AltitudeRange", "ConservationStatus", "LegalStatus",
    "IsSensitive", "ThumbnailUrl",
]

# Conservation statuses considered sensitive
SENSITIVE_KEYWORDS = {"CR", "EN", "PELIGRO CRÍTICO", "EN PELIGRO"}


# ── Pydantic Schema (Structured Outputs) ──────────────────────────

class ConservationStatus(str, Enum):
    LC = "LC"
    NT = "NT"
    VU = "VU"
    EN = "EN"
    CR = "CR"
    DD = "DD"
    NE = "NE"


class MarketValue(str, Enum):
    ALTO = "Alto"
    MEDIO = "Medio"
    BAJO = "Bajo"
    DESCONOCIDO = "Desconocido"


class SustainabilityLevel(str, Enum):
    ALTO = "Alto"
    MEDIO = "Medio"
    BAJO = "Bajo"


class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TraditionalUseEntry(BaseModel):
    part: str = Field(
        description="Parte de la especie utilizada (ej: Hojas, Tallo, Fruto, Raíz, Látex, Resina, Plumas, Cuerpo entero)"
    )
    category: list[str] = Field(
        description="Categoría(s) principal(es) del uso. OBLIGATORIO elegir de esta lista: "
        "[Medicinal, Alimentario, Mágico-Religioso/Ritual, Construcción, Artesanal, Forraje/Veterinario, Ornamental, Leña/Combustible, Tóxico/Caza]"
    )
    specific_purpose: str = Field(
        description="Propósito exacto de la planta o animal (ej: 'Tratamiento de fiebre y parásitos', 'Elaboración de canastos', 'Alimento en época de escasez')."
    )
    preparation_method: str = Field(
        description="Cómo se prepara o aplica tradicionalmente (ej: 'Infusión', 'Cataplasma', 'Consumo directo crudo', 'Maceración en aguardiente', 'Secado al sol'). Si no se conoce, responde 'Desconocido'."
    )
    description: str = Field(
        description="Descripción etnográfica concisa del uso tradicional"
    )
    community: str = Field(
        description="Comunidad indígena (ej. Emberá Chamí), afrodescendiente o campesina que lo practica. "
        "Si no hay evidencia documentada específica de la región, responde "
        "'Uso generalizado regional' o 'Desconocido'. "
        "NO inventar comunidades bajo ninguna circunstancia."
    )
    traditional_warnings: str = Field(
        description="Precauciones, tabúes o toxicidad según la tradición (ej: 'Tóxico en altas dosis', 'No consumir en embarazo'). Responde 'Ninguna conocida' si no aplica."
    )


class EconomicPotentialEntry(BaseModel):
    sector: str = Field(
        description="Sector económico. OBLIGATORIO elegir uno o más de esta lista: "
        "[Ecoturismo, Cosmecéutica y Cuidado Personal, Nutracéutica y Alimentos Funcionales, "
        "Fitoterapia y Farmacéutica, Bioinsumos Agrícolas, Artesanías, Construcción/Maderas, "
        "Fitorremediación, Ornamental]"
    )
    products: list[str] = Field(
        description="Lista de productos reales (ej: 'Aceite esencial', 'Colorante natural', 'Extracto hidroalcohólico', 'Fibra para cestería')"
    )
    active_properties: list[str] = Field(
        default_factory=list,
        description="Compuestos biológicos o propiedades físicas que justifican este uso (ej: 'Taninos', 'Antioxidantes', 'Resistencia a la humedad', 'Alcaloides'). Vacío si no aplica o se desconoce."
    )
    description: str = Field(
        description="Descripción breve del potencial económico y cómo se procesa en español"
    )
    market_value: MarketValue = Field(
        description="Valor de mercado estimado: Alto, Medio, Bajo, o Desconocido"
    )
    sustainability_level: SustainabilityLevel = Field(
        description="Nivel de sostenibilidad de la explotación: Alto, Medio, o Bajo"
    )


class SpeciesData(BaseModel):
    scientific_name: str = Field(description="Nombre científico exacto")
    common_name: str = Field(description="Nombre común en español (Colombia)")
    kingdom: str = Field(description="Reino taxonómico")
    phylum: str = Field(description="Filo taxonómico")
    class_name: str = Field(
        description="Clase taxonómica (ej: Aves, Mammalia, Magnoliopsida)",
        alias="class_field",
    )
    order: str = Field(description="Orden taxonómico")
    family: str = Field(description="Familia taxonómica")
    genus: str = Field(description="Género taxonómico")
    description: str = Field(
        description="Descripción concisa de 2-3 oraciones en español"
    )
    altitude_range: str = Field(
        description="Rango de altitud típico en msnm "
        "(ej: '1000-2000 msnm') o 'Desconocido'"
    )
    conservation_status: ConservationStatus = Field(
        description="Estado de conservación UICN"
    )
    legal_status: bool = Field(
        description="True si se requiere un permiso legal especial de "
        "alguna entidad gubernamental o institución para "
        "recolectar o explotar la especie. False si no."
    )

    expert_analysis: str = Field(
        description="Razonamiento interno: Escribe un breve párrafo recordando la literatura científica, compuestos químicos o usos etnobotánicos conocidos para esta especie o su género ANTES de llenar las siguientes listas."
    )

    traditional_uses: list[TraditionalUseEntry] = Field(
        default_factory=list,
        description="Lista de usos tradicionales. Vacía si no tiene."
    )
    economic_potential: list[EconomicPotentialEntry] = Field(
        default_factory=list,
        description="Lista de potenciales económicos. Vacía si no tiene."
    )
    confidence: Confidence = Field(
        description="Nivel de confianza en la información generada"
    )


class SpeciesBatchResponse(BaseModel):
    species: list[SpeciesData] = Field(
        description="Lista de especies con información completa"
    )


# ── LLM Prompt ─────────────────────────────────────────────────────

SYSTEM_PROMPT = """\
Eres un experto en Bioprospección, Bioeconomía y Biodiversidad colombiana (Eje Cafetero/Caldas). \
Tu tarea es mapear el potencial de biocomercio de especies de flora, fauna y hongos.

REGLAS:
- Genera información para TODAS las especies de la lista.
- No te quedes en lo obvio. Para cada especie, evalúa mentalmente si tiene potencial en: \
  Cosmética (aceites, resinas), Bioinsumos (control de plagas, abonos), Nutracéutica (superalimentos), \
  Farmacéutica (principios activos).
- Si una planta es "maleza", evalúa si sirve para fitorremediación (limpiar suelos) o forraje.
- Si es un ave o anfibio amenazado, su uso principal debe ser Ecoturismo, Fotografía de naturaleza o Educación ambiental.
- Genera información para TODAS las especies. Si no conoces usos, deja las listas vacías, \
  pero esfuérzate por recordar literatura científica de la especie o su género.
- Los nombres comunes deben ser en español colombiano.
- Las descripciones deben ser concisas (2-3 oraciones en español).
- altitude_range: rango altitudinal típico (ej: "1500-2800 msnm") o "Desconocido".
- legal_status: true si la especie requiere permisos legales para su \
  recolección/explotación (ej: CITES, especies amenazadas). false si no.
- conservation_status: usar códigos UICN (LC, NT, VU, EN, CR, DD, NE).
- confidence: "high" si estás muy seguro, "medium" si hay incertidumbre, \
  "low" para especies oscuras o poco documentadas.
- community: Si no hay evidencia documentada de una comunidad específica, \
  responder "Uso generalizado regional" o "Desconocido". NO inventar.\
- Si una especie tiene potenciales económicos en sectores distintos \
  (por ejemplo, sirve para 'Construcción/Maderas' pero también tiene \
  compuestos químicos para 'Cosmecéutica' o 'Bioinsumos'), DEBES crear \
  objetos separados en la lista de economic_potential para cada sector, \
  no mezcles los compuestos en el sector equivocado.

EJEMPLO DE RAZONAMIENTO ESPERADO PARA "expert_analysis":
"Aunque Bixa orellana es conocida comúnmente, su potencial comercial va más allá del colorante tradicional. \
  Científicamente contiene bixina y norbixina, carotenoides altamente valorados en la industria cosmética y \
  alimentaria global por ser antioxidantes naturales y no tóxicos. Tradicionalmente las comunidades indígenas \
  lo usan no solo para tintura, sino como repelente de insectos."

A partir de ese análisis, llenarás las listas de usos con precisión.

"""


def build_batch_prompt(species_names: list[str]) -> str:
    """Build the user prompt for a batch of species."""
    names_list = "\n".join(
        f"  {i}. {name}" for i, name in enumerate(species_names, 1)
    )

    return f"""\
Genera información completa para las siguientes {len(species_names)} especies.
El esquema JSON es forzado por la API — solo rellena los campos con datos precisos.

IMPORTANTE:
- Si la especie no tiene usos tradicionales conocidos, deja traditional_uses: []
- Si la especie no tiene potencial económico claro, deja economic_potential: []
- Para insectos y microorganismos oscuros, usa confidence: "low"
- Cada especie DEBE tener todos los campos de taxonomía
- class_field es la clase taxonómica (ej: Aves, Mammalia, Insecta)
- Oportunidades por Taxonomía: Si la especie específica carece de estudios comerciales detallados, \
  pero su GÉNERO taxonómico es ampliamente usado en la industria (ej. para cosméticos o medicinas), \
  incluye ese potencial económico y usa confidence: "medium" o "low", aclarando en la descripción que \
  el potencial es "Inferido por las características de su género".

Lista de especies:
{names_list}"""


# ── Slug generation ────────────────────────────────────────────────

def generate_slug(scientific_name: str) -> str:
    """Generate URL-friendly slug: 'Vultur gryphus' -> 'vultur-gryphus'."""
    text = unicodedata.normalize("NFKD", scientific_name)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def is_sensitive(status: str) -> bool:
    """Check if conservation status marks species as sensitive."""
    upper = status.upper()
    return any(kw in upper for kw in SENSITIVE_KEYWORDS)


# ── Gemini API ─────────────────────────────────────────────────────

def init_gemini(api_key: str) -> Any:
    """Initialize and return the Gemini client."""
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        return client
    except ImportError:
        print("[ERROR] google-genai not installed. Run: pip install google-genai")
        sys.exit(1)


def call_gemini(
    client: Any,
    species_names: list[str],
    model: str = "gemini-3.1-flash-lite-preview",
    max_retries: int = 3,
) -> Optional[dict]:
    """Call Gemini API with Structured Outputs (response_schema).

    Returns parsed dict matching SpeciesBatchResponse or None.
    """
    from google.genai import types

    prompt = build_batch_prompt(species_names)

    for attempt in range(1, max_retries + 1):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.3,
                    max_output_tokens=8192,
                    response_mime_type="application/json",
                    response_schema=SpeciesBatchResponse,
                ),
            )

            # Check if response has text
            if not response.text:
                print(f"    [WARN] Empty response (attempt {attempt})")
                if hasattr(response, 'prompt_feedback'):
                    print(f"    Feedback: {response.prompt_feedback}")
                continue

            raw_text = response.text.strip()

            # Parse JSON (should always be valid with response_schema)
            data = json.loads(raw_text)

            # Validate structure
            if "species" not in data or not isinstance(data["species"], list):
                print(f"    [WARN] Invalid structure (attempt {attempt})")
                continue

            if len(data["species"]) != len(species_names):
                print(
                    f"    [WARN] Expected {len(species_names)} species, "
                    f"got {len(data['species'])} (attempt {attempt})"
                )
                # Accept partial results
                if len(data["species"]) > 0:
                    return data
                continue

            return data

        except json.JSONDecodeError as e:
            print(f"    [WARN] JSON parse error (attempt {attempt}): {e}")
            if raw_text:
                print(f"    Raw (first 200 chars): {raw_text[:200]}")
        except Exception as e:
            err_str = str(e)
            print(f"    [ERROR] Attempt {attempt}: {type(e).__name__}: {err_str[:300]}")
            if "429" in err_str or "quota" in err_str.lower() or "resource" in err_str.lower():
                wait = 10 * attempt  # 10s, 20s, 30s
                print(f"    ⏳ Rate limited, waiting {wait}s...")
                time.sleep(wait)

        if attempt < max_retries:
            time.sleep(2 * attempt)

    return None


# ── Data processing ────────────────────────────────────────────────

def process_llm_response(
    llm_data: dict,
    master_lookup: dict[str, dict],
) -> tuple[list[dict], list[dict], list[dict]]:
    """Process LLM response into CSV rows, uses JSON, and potential JSON.

    Returns (csv_rows, uses_entries, potential_entries).
    """
    csv_rows: list[dict] = []
    uses_entries: list[dict] = []
    potential_entries: list[dict] = []

    for sp in llm_data.get("species", []):
        sci_name = sp.get("scientific_name", "")
        if not sci_name:
            continue

        # Get thumbnail from master list if available
        master_entry = master_lookup.get(sci_name.lower(), {})
        thumbnail = master_entry.get("thumbnail_url", "")

        conservation = sp.get("conservation_status", "NE")

        csv_row = {
            "Kingdom": sp.get("kingdom", ""),
            "Phylum": sp.get("phylum", ""),
            "Class": sp.get("class_field", ""),
            "Order": sp.get("order", ""),
            "Family": sp.get("family", ""),
            "Genus": sp.get("genus", ""),
            "ScientificName": sci_name,
            "CommonName": sp.get("common_name", ""),
            "Slug": generate_slug(sci_name),
            "Description": sp.get("description", ""),
            "AltitudeRange": sp.get("altitude_range", "Desconocido"),
            "ConservationStatus": conservation,
            "LegalStatus": str(sp.get("legal_status", False)),
            "IsSensitive": str(is_sensitive(conservation)),
            "ThumbnailUrl": thumbnail,
        }
        csv_rows.append(csv_row)

        # Traditional Uses
        uses = sp.get("traditional_uses", [])
        if uses:
            uses_entries.append({
                "scientific_name": sci_name,
                "traditional_uses": uses,
                "confidence": sp.get("confidence", "medium"),
            })

        # Economic Potential
        potential = sp.get("economic_potential", [])
        if potential:
            potential_entries.append({
                "scientific_name": sci_name,
                "economic_potential": potential,
                "confidence": sp.get("confidence", "medium"),
            })

    return csv_rows, uses_entries, potential_entries


# ── Checkpoint ─────────────────────────────────────────────────────

def load_checkpoint() -> dict[str, Any]:
    """Load LLM generation checkpoint."""
    if CHECKPOINT_FILE.exists():
        try:
            with open(CHECKPOINT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            processed = len(data.get("processed_species", []))
            print(f"[INFO] Loaded checkpoint: {processed} species processed")
            return data
        except (json.JSONDecodeError, IOError):
            print("[WARN] Checkpoint corrupted, starting fresh")
    return {"processed_species": [], "csv_rows": [], "uses": [], "potential": []}


def save_checkpoint(checkpoint: dict[str, Any]) -> None:
    """Save LLM generation checkpoint."""
    with open(CHECKPOINT_FILE, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, ensure_ascii=False, indent=2)


# ── Output ─────────────────────────────────────────────────────────

def save_csv(rows: list[dict], path: Path) -> None:
    """Save CSV for SpeciesImportJob."""
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    print(f"[INFO] CSV saved: {path} ({len(rows)} rows)")


def save_json_output(data: Any, path: Path, label: str) -> None:
    """Save JSON output file."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    count = len(data) if isinstance(data, list) else "N/A"
    print(f"[INFO] {label} saved: {path} ({count} entries)")


def generate_report(
    total: int,
    csv_rows: list[dict],
    uses: list[dict],
    potential: list[dict],
    failed_batches: int,
    elapsed: float,
) -> str:
    """Generate human-readable report."""
    processed = len(csv_rows)
    pct = (processed / max(total, 1)) * 100
    kingdom_counts = Counter(r.get("Kingdom", "?") for r in csv_rows)
    confidence_counts = Counter()
    for u in uses:
        confidence_counts[u.get("confidence", "?")] += 1
    for p in potential:
        confidence_counts[p.get("confidence", "?")] += 1

    with_uses = len(uses)
    with_potential = len(potential)
    with_common = sum(1 for r in csv_rows if r.get("CommonName"))
    with_desc = sum(1 for r in csv_rows if r.get("Description"))
    with_altitude = sum(
        1 for r in csv_rows
        if r.get("AltitudeRange") and r["AltitudeRange"] != "Desconocido"
    )
    with_legal = sum(
        1 for r in csv_rows if r.get("LegalStatus") == "True"
    )
    sensitive = sum(1 for r in csv_rows if r.get("IsSensitive") == "True")

    minutes = elapsed / 60

    lines = [
        "=" * 60,
        "  LLM SPECIES DATA GENERATION REPORT",
        "  Powered by Google Gemini (Structured Outputs)",
        "=" * 60,
        "",
        f"Total species in master list:  {total:,}",
        f"Successfully processed:        {processed:,} ({pct:.1f}%)",
        f"Failed batches:                {failed_batches}",
        f"Time elapsed:                  {minutes:.1f} min",
        "",
        "─" * 40,
        "DATA COMPLETENESS:",
        "─" * 40,
        f"  With common name:    {with_common:4d} / {processed}",
        f"  With description:    {with_desc:4d} / {processed}",
        f"  With altitude range: {with_altitude:4d} / {processed}",
        f"  With legal status:   {with_legal:4d} / {processed} (require permits)",
        f"  With trad. uses:     {with_uses:4d} / {processed}",
        f"  With econ. potential: {with_potential:4d} / {processed}",
        f"  Marked sensitive:    {sensitive:4d} / {processed}",
        "",
        "─" * 40,
        "BY KINGDOM:",
        "─" * 40,
    ]
    for k, c in kingdom_counts.most_common():
        lines.append(f"  {k:20s} → {c:4d}")

    if confidence_counts:
        lines += ["", "─" * 40, "DATA CONFIDENCE:", "─" * 40]
        for conf, c in confidence_counts.most_common():
            lines.append(f"  {conf:10s} → {c:4d} entries")

    lines.append("")
    return "\n".join(lines)


# ── Main ───────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate species data via Gemini LLM (Structured Outputs)"
    )
    parser.add_argument(
        "--limit", type=int, default=0,
        help="Limit species count (0 = all)",
    )
    parser.add_argument(
        "--model", type=str, default="gemini-3.1-flash-lite-preview",
        help="Gemini model to use (default: gemini-3.1-flash-lite-preview)",
    )
    parser.add_argument(
        "--batch-size", type=int, default=10,
        help="Species per LLM request (default: 10)",
    )
    parser.add_argument(
        "--no-checkpoint", action="store_true",
        help="Start fresh, ignore checkpoint",
    )
    args = parser.parse_args()

    # Load env
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists() and load_dotenv:
        load_dotenv(env_file)

    api_key = os.getenv("GOOGLE_AI_API_KEY", "")
    if not api_key:
        print("[ERROR] GOOGLE_AI_API_KEY not set in .env")
        sys.exit(1)

    if not MASTER_LIST.exists():
        print(f"[ERROR] Master list not found: {MASTER_LIST}")
        print("  Run script 09 first: python scripts/species/09_build_master_species_list.py")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Step 1: Load master list ───────────────────────────────────
    print("\n[STEP 1/4] Loading master species list...")
    with open(MASTER_LIST, "r", encoding="utf-8") as f:
        master_data = json.load(f)

    all_species = master_data.get("species", [])
    species_names = [sp["scientific_name"] for sp in all_species]
    master_lookup = {
        sp["scientific_name"].lower(): sp for sp in all_species
    }

    if args.limit > 0:
        species_names = species_names[:args.limit]
        print(f"[INFO] Limited to {args.limit} species (dry-run)")

    print(f"[INFO] {len(species_names):,} species to process")

    # ── Step 2: Load checkpoint ────────────────────────────────────
    print("\n[STEP 2/4] Loading checkpoint...")
    if args.no_checkpoint:
        checkpoint = {
            "processed_species": [], "csv_rows": [],
            "uses": [], "potential": [],
        }
        print("[INFO] Fresh start")
    else:
        checkpoint = load_checkpoint()

    processed_set = set(checkpoint.get("processed_species", []))
    all_csv_rows: list[dict] = list(checkpoint.get("csv_rows", []))
    all_uses: list[dict] = list(checkpoint.get("uses", []))
    all_potential: list[dict] = list(checkpoint.get("potential", []))

    # Filter out already-processed
    remaining = [n for n in species_names if n not in processed_set]
    print(f"[INFO] Already processed: {len(processed_set)}, remaining: {len(remaining)}")

    # ── Step 3: Initialize Gemini & Process ────────────────────────
    model_name = args.model
    print(f"\n[STEP 3/4] Processing species with {model_name}...")
    print("[INFO] Using Structured Outputs (Pydantic response_schema)")
    client = init_gemini(api_key)

    batch_size = args.batch_size
    total_batches = (len(remaining) + batch_size - 1) // batch_size
    failed_batches = 0
    start_time = time.time()

    for batch_idx in range(total_batches):
        batch_start = batch_idx * batch_size
        batch_end = min(batch_start + batch_size, len(remaining))
        batch_names = remaining[batch_start:batch_end]
        batch_num = batch_idx + 1

        print(
            f"\n  [Batch {batch_num}/{total_batches}] "
            f"Processing {len(batch_names)} species..."
        )
        for name in batch_names:
            print(f"    • {name}")

        result = call_gemini(client, batch_names, model=model_name)

        if result is None:
            print(f"  ✗ Batch {batch_num} FAILED after retries")
            failed_batches += 1
            continue

        # Process response
        csv_rows, uses, potential = process_llm_response(result, master_lookup)

        all_csv_rows.extend(csv_rows)
        all_uses.extend(uses)
        all_potential.extend(potential)

        # Update checkpoint
        for sp in result.get("species", []):
            name = sp.get("scientific_name", "")
            if name:
                processed_set.add(name)

        print(
            f"  ✓ Batch {batch_num}: {len(csv_rows)} species, "
            f"{len(uses)} with uses, {len(potential)} with potential"
        )

        # Save checkpoint after each batch
        checkpoint = {
            "processed_species": list(processed_set),
            "csv_rows": all_csv_rows,
            "uses": all_uses,
            "potential": all_potential,
        }
        save_checkpoint(checkpoint)

        # Rate limit (be gentle with free tier)
        if batch_num < total_batches:
            delay = 5  # 15 RPM limit → ~4-5s between requests
            print(f"  ⏳ Waiting {delay}s (rate limit)...")
            time.sleep(delay)

    elapsed = time.time() - start_time

    # ── Step 4: Save outputs ───────────────────────────────────────
    print(f"\n[STEP 4/4] Saving outputs to {OUTPUT_DIR}...")

    # CSV for SpeciesImportJob
    csv_path = OUTPUT_DIR / "species_import_llm.csv"
    save_csv(all_csv_rows, csv_path)

    # JSON: Traditional Uses
    uses_path = OUTPUT_DIR / "species_traditional_uses.json"
    save_json_output(all_uses, uses_path, "Traditional Uses")

    # JSON: Economic Potential
    potential_path = OUTPUT_DIR / "species_economic_potential.json"
    save_json_output(all_potential, potential_path, "Economic Potential")

    # Report
    report = generate_report(
        len(species_names), all_csv_rows,
        all_uses, all_potential, failed_batches, elapsed,
    )
    report_path = OUTPUT_DIR / "llm_generation_report.txt"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"[INFO] Report saved: {report_path}")

    print("\n" + report)
    print(f"\n✅ LLM generation complete! Outputs in: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
