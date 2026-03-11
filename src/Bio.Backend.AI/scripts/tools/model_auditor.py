#!/usr/bin/env python3
"""
BioCommerce Caldas – Model Auditor
====================================
Aplicación web local para auditoría visual del modelo CNN de
clasificación de especies.  Sube una imagen y obtiene las
predicciones top-5 con datos taxonómicos.

Uso:
    python scripts/model_auditor.py [--port 8501] [--weights best_model.pth]

Requisitos (ya incluidos en el venv del proyecto):
    pip install fastapi uvicorn pillow torch torchvision
"""

from __future__ import annotations

import argparse
import os
import sys
import webbrowser
from pathlib import Path

# ── Resolve project paths ──────────────────────────────────────────
SCRIPT_DIR = Path(__file__).resolve().parent      # scripts/tools/
PROJECT_ROOT = SCRIPT_DIR.parent.parent           # Bio.Backend.AI/
sys.path.insert(0, str(PROJECT_ROOT))

import uvicorn  # noqa: E402
from fastapi import FastAPI, File, UploadFile  # noqa: E402
from fastapi.responses import HTMLResponse, JSONResponse  # noqa: E402

from app.services.vision.classifier import SpeciesClassifier  # noqa: E402

# ── FastAPI app ────────────────────────────────────────────────────
api = FastAPI(title="Bio Model Auditor", docs_url=None, redoc_url=None)

_classifier: SpeciesClassifier | None = None
_weights_path: Path | None = None
_min_f1: float = 0.0
_allowed_species: set[str] | None = None  # None = no filter
_species_f1: dict[str, float] = {}  # species_name -> f1_score (both forms)
_species_stats: tuple[int, int] = (0, 0)  # (passing, total_evaluated)
_f1_warn_threshold: float = 0.65  # warn if species F1 < this


def _load_env_f1_threshold() -> float:
    """Read BIO_MIN_F1_THRESHOLD from .env if present."""
    # Try project-level .env
    for env_path in [
        PROJECT_ROOT / ".env",
        PROJECT_ROOT.parent.parent / ".env",  # monorepo root
    ]:
        if env_path.exists():
            with open(env_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("BIO_MIN_F1_THRESHOLD="):
                        try:
                            return float(line.split("=", 1)[1].strip())
                        except ValueError:
                            pass
    # Fallback to environment variable
    val = os.environ.get("BIO_MIN_F1_THRESHOLD")
    if val:
        try:
            return float(val)
        except ValueError:
            pass
    return 0.65


def _load_species_f1_data(min_f1: float) -> tuple[set[str] | None, dict[str, float]]:
    """Load evaluation metrics. Returns (allowed_set_or_None, f1_scores_dict)."""
    global _species_stats
    eval_path = PROJECT_ROOT / "data" / "evaluation" / "evaluation_metrics.json"
    if not eval_path.exists():
        print("  [WARN] evaluation_metrics.json not found, F1 filter disabled.")
        return None, {}
    import json as _json
    with open(eval_path, encoding="utf-8") as f:
        metrics = _json.load(f)
    per_class = metrics.get("per_class", {})
    total_evaluated = len(per_class)

    # Build F1 lookup (both underscore and space forms)
    f1_scores: dict[str, float] = {}
    allowed: set[str] = set()
    for name, m in per_class.items():
        f1 = m.get("f1_score", 0.0)
        f1_scores[name] = f1
        f1_scores[name.replace("_", " ")] = f1
        if min_f1 > 0.0 and f1 >= min_f1:
            allowed.add(name)
            allowed.add(name.replace("_", " "))

    passing = len(allowed) // 2 if allowed else 0
    _species_stats = (passing, total_evaluated)

    return (allowed if min_f1 > 0.0 else None), f1_scores


def _get_classifier() -> SpeciesClassifier:
    global _classifier
    if _classifier is None:
        _classifier = SpeciesClassifier()
        _classifier.load_model(weights_path=_weights_path)
    return _classifier


# ── Endpoints ──────────────────────────────────────────────────────

@api.get("/", response_class=HTMLResponse)
async def index():
    return AUDITOR_HTML


@api.post("/api/classify")
async def classify(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        result = _get_classifier().classify(image_bytes, top_k=5)
        # Filter by F1 threshold
        if _allowed_species is not None:
            result["predictions"] = [
                p for p in result["predictions"]
                if p["species"] in _allowed_species
            ]
            # Re-rank after filtering
            for i, p in enumerate(result["predictions"], start=1):
                p["rank"] = i
        # Add low-F1 warning per prediction
        for p in result["predictions"]:
            sp_name = p["species"]
            f1 = _species_f1.get(sp_name)
            if f1 is not None and f1 < _f1_warn_threshold:
                p["low_f1_warning"] = True
                p["f1_score"] = round(f1, 4)
            else:
                p["low_f1_warning"] = False
                if f1 is not None:
                    p["f1_score"] = round(f1, 4)
        result["f1_warn_threshold"] = _f1_warn_threshold
        return JSONResponse(content=result)
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)},
        )


@api.get("/api/health")
async def health():
    clf = _get_classifier()
    return {
        "status": "ok",
        "model": clf.config.get("model_name", "unknown"),
        "num_classes": clf.num_classes,
        "device": str(clf.device),
    }


@api.get("/api/species")
async def species_list():
    """Return trained species grouped by kingdom, sorted A-Z."""
    clf = _get_classifier()
    groups: dict[str, list[dict]] = {}
    for name, info in sorted(clf.class_info.items()):
        # Filter by F1 threshold
        if _allowed_species is not None and name not in _allowed_species:
            continue
        kingdom = info.get("kingdom", "Desconocido")
        f1 = _species_f1.get(name)
        entry = {
            "name": name,
            "scientific_name": info.get("scientific_name", name),
            "family": info.get("family", ""),
            "order": info.get("order", ""),
            "class": info.get("class", ""),
            "phylum": info.get("phylum", ""),
            "genus": info.get("genus", ""),
            "iucn_status": info.get("iucn_status", ""),
            "train_count": info.get("train_count", 0),
            "f1_score": round(f1, 4) if f1 is not None else None,
            "low_f1": f1 is not None and f1 < _f1_warn_threshold,
        }
        groups.setdefault(kingdom, []).append(entry)
    total = sum(len(v) for v in groups.values())
    return {"groups": groups, "total": total, "f1_warn_threshold": _f1_warn_threshold}


@api.get("/api/metrics")
async def metrics_summary():
    """Return full evaluation metrics summary for the dashboard."""
    import json as _json
    eval_path = PROJECT_ROOT / "data" / "evaluation" / "evaluation_metrics.json"
    if not eval_path.exists():
        return JSONResponse(status_code=404, content={"error": "evaluation_metrics.json not found"})
    with open(eval_path, encoding="utf-8") as f:
        metrics = _json.load(f)

    per_class = metrics.get("per_class", {})
    total_species = len(per_class)
    total_samples = sum(m.get("support", 0) for m in per_class.values())

    # Pre-compute F1 histogram bins
    f1_values = [m.get("f1_score", 0) for m in per_class.values()]
    bins = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01]
    bin_labels = ["0-.1", ".1-.2", ".2-.3", ".3-.4", ".4-.5",
                  ".5-.6", ".6-.7", ".7-.8", ".8-.9", ".9-1.0"]
    histogram = [0] * len(bin_labels)
    for v in f1_values:
        for i in range(len(bins) - 1):
            if bins[i] <= v < bins[i + 1]:
                histogram[i] += 1
                break

    # Support distribution buckets
    support_vals = [m.get("support", 0) for m in per_class.values()]
    support_buckets = {"5": 0, "6-10": 0, "11-15": 0, "16+": 0}
    for s in support_vals:
        if s <= 5:
            support_buckets["5"] += 1
        elif s <= 10:
            support_buckets["6-10"] += 1
        elif s <= 15:
            support_buckets["11-15"] += 1
        else:
            support_buckets["16+"] += 1

    return {
        "accuracy": metrics.get("accuracy"),
        "top_5_accuracy": metrics.get("top_5_accuracy"),
        "macro_avg": metrics.get("macro_avg"),
        "weighted_avg": metrics.get("weighted_avg"),
        "total_species": total_species,
        "total_samples": total_samples,
        "per_class": {k: v for k, v in per_class.items()},
        "f1_histogram": {"labels": bin_labels, "counts": histogram},
        "support_distribution": support_buckets,
    }


@api.get("/api/metrics/misclassified")
async def metrics_misclassified():
    """Return misclassified samples from evaluation."""
    import json as _json
    path = PROJECT_ROOT / "data" / "evaluation" / "misclassified_samples.json"
    if not path.exists():
        return JSONResponse(status_code=404, content={"error": "misclassified_samples.json not found"})
    with open(path, encoding="utf-8") as f:
        samples = _json.load(f)
    return {"samples": samples, "total": len(samples)}


@api.get("/api/metrics/confusion")
async def metrics_confusion():
    """Return top confused species pairs from evaluation."""
    import re
    path = PROJECT_ROOT / "data" / "evaluation" / "confusion_matrix.txt"
    if not path.exists():
        return JSONResponse(status_code=404, content={"error": "confusion_matrix.txt not found"})
    pairs = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("Top ") or line.startswith("True Species") or line.startswith("─"):
                continue
            # Parse: True_Species   Predicted_As   Rate  Count
            parts = re.split(r"\s{2,}", line)
            if len(parts) >= 4:
                try:
                    rate_str = parts[2].replace("%", "")
                    pairs.append({
                        "true_species": parts[0].strip(),
                        "predicted_as": parts[1].strip(),
                        "rate": float(rate_str),
                        "count": int(parts[3]),
                    })
                except (ValueError, IndexError):
                    pass
    return {"pairs": pairs, "total": len(pairs)}


@api.get("/metrics", response_class=HTMLResponse)
async def metrics_page():
    """Serve the Model Metrics Dashboard HTML."""
    return METRICS_HTML


# ── Embedded HTML ──────────────────────────────────────────────────

AUDITOR_HTML = r"""<!DOCTYPE html>
<html lang="es" class="dark">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BioAudit – Model Auditor</title>
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  :root {
    --c-emerald: #10b981;
    --c-emerald-dark: #059669;
    --c-bg: #0c0f16;
    --c-surface: #141925;
    --c-surface-2: #1c2333;
    --c-border: #2a3349;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',sans-serif;background:var(--c-bg);color:#e2e8f0;min-height:100vh;}

  /* upload zone */
  .upload-zone{border:2px dashed #374151;border-radius:1rem;padding:2.5rem 1.5rem;text-align:center;transition:all .25s;cursor:pointer;background:var(--c-surface);}
  .upload-zone:hover,.upload-zone.drag-over{border-color:var(--c-emerald);background:rgba(16,185,129,.06);}
  .upload-zone.drag-over{box-shadow:0 0 40px rgba(16,185,129,.12);}

  /* species panel */
  .species-panel{background:var(--c-surface);border:1px solid var(--c-border);border-radius:1rem;overflow:hidden;display:flex;flex-direction:column;max-height:calc(100vh - 160px);}
  .species-panel-header{padding:.75rem 1rem;border-bottom:1px solid var(--c-border);background:var(--c-surface-2);}
  .species-list{overflow-y:auto;flex:1;padding:.5rem;}
  .species-group-title{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#10b981;padding:.6rem .75rem .3rem;}

  /* kingdom column */
  .kingdom-col{flex:1;min-width:240px;display:flex;flex-direction:column;border-right:1px solid var(--c-border);overflow:hidden;}
  .kingdom-col:last-child{border-right:none;}
  .kingdom-col-header{padding:.6rem 1rem;border-bottom:1px solid var(--c-border);background:var(--c-surface-2);display:flex;align-items:center;gap:.5rem;flex-shrink:0;}
  .kingdom-col-list{overflow-y:auto;flex:1;padding:.4rem;}
  .kingdom-col-count{font-size:.6rem;color:#64748b;margin-left:auto;background:var(--c-surface);padding:.1rem .45rem;border-radius:9999px;}

  .species-item{display:flex;align-items:center;gap:.6rem;padding:.5rem .75rem;border-radius:.6rem;transition:background .15s;}
  .species-item:hover{background:var(--c-surface-2);}
  .species-item .sp-name{font-size:.8rem;font-weight:600;color:#e2e8f0;font-style:italic;}
  .species-item .sp-family{font-size:.65rem;color:#64748b;}
  .species-item .sp-count{font-size:.6rem;color:#475569;margin-left:auto;white-space:nowrap;}
  .iucn-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
  .iucn-LC{background:#10b981;}
  .iucn-NT{background:#f59e0b;}
  .iucn-VU{background:#f59e0b;}
  .iucn-EN{background:#ef4444;}
  .iucn-CR{background:#ef4444;}

  /* preview image */
  .preview-img{max-height:220px;border-radius:.75rem;object-fit:cover;box-shadow:0 4px 24px rgba(0,0,0,.4);}

  /* pulse ring animation */
  @keyframes pulseRing{
    0%{transform:scale(.9);opacity:1}
    80%,100%{transform:scale(2.4);opacity:0}
  }
  .pulse-ring{position:absolute;width:80px;height:80px;border-radius:50%;border:3px solid var(--c-emerald);animation:pulseRing 1.6s cubic-bezier(.2,.6,.4,1) infinite;}
  .pulse-ring:nth-child(2){animation-delay:.4s;}
  .pulse-ring:nth-child(3){animation-delay:.8s;}

  /* spinner dot */
  @keyframes spin{to{transform:rotate(360deg)}}
  .spinner-dot{width:52px;height:52px;border-radius:50%;border:4px solid transparent;border-top-color:var(--c-emerald);animation:spin .8s linear infinite;}

  /* cards */
  .result-card{background:var(--c-surface);border:1px solid var(--c-border);border-radius:1rem;overflow:hidden;transition:transform .2s,box-shadow .2s;}
  .result-card:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(16,185,129,.1);}

  /* confidence bar */
  .conf-bar{height:6px;border-radius:3px;background:#1e293b;overflow:hidden;}
  .conf-bar-fill{height:100%;border-radius:3px;transition:width .6s ease;}

  /* badge colors */
  .badge{display:inline-flex;align-items:center;font-size:.65rem;font-weight:600;padding:.15rem .5rem;border-radius:9999px;text-transform:uppercase;letter-spacing:.04em;}
  .badge-green{background:rgba(16,185,129,.15);color:#34d399;}
  .badge-amber{background:rgba(245,158,11,.15);color:#fbbf24;}
  .badge-red{background:rgba(239,68,68,.15);color:#f87171;}
  .badge-slate{background:rgba(100,116,139,.2);color:#94a3b8;}

  /* taxonomy pills */
  .tax-pill{display:inline-block;font-size:.7rem;padding:.2rem .55rem;border-radius:.4rem;background:var(--c-surface-2);border:1px solid var(--c-border);color:#94a3b8;margin:.15rem .15rem;}

  /* fade/slide in */
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  .animate-in{animation:fadeSlideUp .45s ease forwards;opacity:0;}

  /* screen transitions */
  .screen{display:none;}
  .screen.active{display:flex;}

  /* scrollbar */
  ::-webkit-scrollbar{width:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}
</style>
</head>
<body class="flex flex-col min-h-screen">

<!-- ═══ Navbar ═══ -->
<nav class="flex items-center justify-between px-6 py-3 border-b" style="border-color:var(--c-border);background:var(--c-surface)">
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#10b981,#06b6d4)">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l3 3 5-5"/></svg>
    </div>
    <span class="font-bold text-sm tracking-tight">BioAudit</span>
    <span class="text-xs text-gray-500 ml-1">Model Auditor</span>
    <a href="/metrics" class="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg transition ml-4" style="background:var(--c-surface-2);border:1px solid var(--c-border);color:#94a3b8" onmouseenter="this.style.borderColor='#10b981';this.style.color='#10b981'" onmouseleave="this.style.borderColor='var(--c-border)';this.style.color='#94a3b8'">
      &#128202; Métricas
    </a>
  </div>
  <div id="navModelBadge" class="text-xs text-gray-500 hidden">
    <span id="navModel" class="badge badge-slate"></span>
    <span id="navClasses" class="text-gray-600 ml-2"></span>
  </div>
</nav>

<!-- ═══ Main Content ═══ -->
<main class="flex-1 flex items-stretch p-0" style="overflow:hidden;">

  <!-- SCREEN 1: Upload (full-width kingdom columns + upload bar) -->
  <section id="screenUpload" class="screen active w-full animate-in" style="flex-direction:column;height:calc(100vh - 100px);">

    <!-- Top toolbar: title + search + sort + upload -->
    <div class="flex items-center gap-3 px-4 py-3 flex-shrink-0 flex-wrap" style="border-bottom:1px solid var(--c-border);background:var(--c-surface);">
      <div class="flex items-center gap-2 mr-auto">
        <p class="font-semibold text-sm whitespace-nowrap">Especies entrenadas</p>
        <span class="text-[.65rem] text-gray-500 whitespace-nowrap" id="speciesCount">Cargando…</span>
      </div>

      <!-- Search -->
      <div class="relative" style="min-width:200px;max-width:320px;flex:1;">
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748b" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input id="speciesSearch" type="text" placeholder="Buscar especie, familia, género…"
          class="w-full text-xs rounded-lg py-1.5 pl-8 pr-3 outline-none focus:ring-1 focus:ring-emerald-500"
          style="background:var(--c-surface-2);border:1px solid var(--c-border);color:#e2e8f0;"
        />
      </div>

      <!-- Sort -->
      <select id="speciesSort"
        class="text-xs rounded-lg py-1.5 px-2 outline-none cursor-pointer focus:ring-1 focus:ring-emerald-500"
        style="background:var(--c-surface-2);border:1px solid var(--c-border);color:#e2e8f0;">
        <option value="name">Ordenar: Nombre</option>
        <option value="scientific_name">Nombre científico</option>
        <option value="family">Familia</option>
        <option value="order">Orden</option>
        <option value="phylum">Filo</option>
        <option value="train_count_desc">Imágenes ↓</option>
        <option value="train_count_asc">Imágenes ↑</option>
        <option value="f1_desc">F1-score ↓</option>
        <option value="f1_asc">F1-score ↑</option>
      </select>

      <!-- Upload button -->
      <button onclick="document.getElementById('fileInput').click()"
        class="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-lg transition whitespace-nowrap"
        style="background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;"
        onmouseenter="this.style.opacity='0.85'" onmouseleave="this.style.opacity='1'">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"/></svg>
        Clasificar imagen
      </button>
      <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" class="hidden"/>
    </div>

    <!-- Kingdom columns row -->
    <div id="kingdomColumns" class="flex flex-1 min-h-0 overflow-hidden">
      <div class="flex items-center justify-center w-full text-gray-500 text-xs py-8">Cargando especies…</div>
    </div>

    <!-- Hidden drag zone overlay + preview -->
    <div id="dropZone" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(12,15,22,.85);backdrop-filter:blur(4px);">
      <div class="upload-zone flex flex-col items-center gap-4 p-10" style="max-width:420px;">
        <div class="w-16 h-16 rounded-2xl flex items-center justify-center" style="background:rgba(16,185,129,.1)">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="1.5">
            <path d="M12 16V4m0 0l-4 4m4-4l4 4"/>
            <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"/>
          </svg>
        </div>
        <p class="font-semibold text-sm">Suelta la imagen aquí</p>
        <p class="text-gray-500 text-xs">JPG, PNG, WEBP</p>
      </div>
    </div>

    <div id="previewContainer" class="hidden fixed inset-0 z-50 flex items-center justify-center" style="background:rgba(12,15,22,.9);backdrop-filter:blur(6px);">
      <div class="flex flex-col items-center gap-3 animate-in">
        <img id="previewImg" class="preview-img" alt="Preview"/>
        <div class="flex items-center gap-3">
          <span id="fileName" class="text-xs text-gray-400"></span>
          <span id="fileSize" class="text-xs text-gray-600"></span>
        </div>
        <p class="text-xs text-emerald-400 mt-1 flex items-center gap-1">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          Clasificando automáticamente…
        </p>
      </div>
    </div>

  </section>

  <!-- SCREEN 2: Analyzing -->
  <section id="screenAnalyzing" class="screen flex-col items-center justify-center gap-6" style="width:100%;">
    <div class="relative flex items-center justify-center" style="width:120px;height:120px">
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="pulse-ring"></div>
      <div class="spinner-dot"></div>
    </div>
    <div class="text-center mt-2">
      <p class="font-semibold text-lg">Analizando imagen…</p>
      <p class="text-gray-500 text-sm mt-1" id="analyzeSubtext">Ejecutando inferencia con el modelo CNN</p>
    </div>
  </section>

  <!-- SCREEN 3: Results -->
  <section id="screenResults" class="screen flex-col items-center w-full overflow-y-auto p-6" style="max-width:100%;">
    <!-- populated by JS -->
  </section>

</main>

<!-- ═══ Footer ═══ -->
<footer class="text-center py-3 text-gray-600 text-xs border-t" style="border-color:var(--c-border)">
  BioCommerce Caldas · Model Auditor · <span id="footerDevice">-</span>
</footer>

<script>
// ── State ─────────────────────────────────────────────────────────
let selectedFile = null;
const screens = {upload:'screenUpload', analyzing:'screenAnalyzing', results:'screenResults'};

function showScreen(name) {
  Object.values(screens).forEach(id => document.getElementById(id).classList.remove('active'));
  const el = document.getElementById(screens[name]);
  el.classList.add('active');
}

// ── File handling ─────────────────────────────────────────────────
const dropZone   = document.getElementById('dropZone');
const fileInput   = document.getElementById('fileInput');
const previewCtn = document.getElementById('previewContainer');
const previewImg = document.getElementById('previewImg');

function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  selectedFile = file;
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = `${(file.size/1024).toFixed(0)} KB`;
  dropZone.classList.add('hidden');
  previewCtn.classList.remove('hidden');
  // Auto-classify after brief preview
  setTimeout(() => startClassification(), 600);
}

fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

// Global drag-drop: show overlay when dragging a file anywhere
document.addEventListener('dragover', e => {e.preventDefault(); dropZone.classList.remove('hidden');});
document.addEventListener('dragleave', e => {
  if (e.relatedTarget === null || !document.body.contains(e.relatedTarget)) dropZone.classList.add('hidden');
});
dropZone.addEventListener('drop', e => {e.preventDefault(); handleFile(e.dataTransfer.files[0]);});

// ── Classify ──────────────────────────────────────────────────────
async function startClassification() {
  if (!selectedFile) return;
  showScreen('analyzing');

  const subtexts = [
    'Preprocesando imagen…',
    'Ejecutando forward pass…',
    'Calculando softmax…',
    'Generando predicciones…',
  ];
  let si = 0;
  const subEl = document.getElementById('analyzeSubtext');
  const subInt = setInterval(() => { si = (si + 1) % subtexts.length; subEl.textContent = subtexts[si]; }, 900);

  try {
    const form = new FormData();
    form.append('file', selectedFile);
    const res = await fetch('/api/classify', {method:'POST', body: form});
    const data = await res.json();
    clearInterval(subInt);
    if (data.error) throw new Error(data.error);
    renderResults(data);
    showScreen('results');
  } catch(err) {
    clearInterval(subInt);
    alert('Error: ' + err.message);
    showScreen('upload');
  }
}

// ── Render Results ────────────────────────────────────────────────
function confColor(c) {
  if (c >= .7) return '#10b981';
  if (c >= .4) return '#f59e0b';
  return '#ef4444';}

function lowF1Warning(pred, threshold) {
  if (!pred.low_f1_warning) return '';
  const f1Pct = pred.f1_score != null ? (pred.f1_score * 100).toFixed(1) + '%' : '?';
  return `<div class="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg text-xs" style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);color:#fbbf24">
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z"/></svg>
    <span><b>Baja confiabilidad:</b> F1 del modelo para esta especie es ${f1Pct} (umbral: ${(threshold*100).toFixed(0)}%). La identificaci\u00f3n puede no ser precisa.</span>
  </div>`;
}

function confBadgeClass(c) {
  if (c >= .7) return 'badge-green';
  if (c >= .4) return 'badge-amber';
  return 'badge-red';
}

function fmtSpecies(s) {
  return s ? s.replace(/_/g, ' ') : s;
}

function taxonomyHTML(tax, compact) {
  if (!tax) return '';
  const keys = ['kingdom','phylum','class','order','family','genus'];
  const labels = {kingdom:'Reino',phylum:'Filo',class:'Clase',order:'Orden',family:'Familia',genus:'Género'};
  const icons  = {kingdom:'👑',phylum:'🧬',class:'🪶',order:'📋',family:'🏠',genus:'🔬'};
  if (compact) {
    return keys.filter(k => tax[k]).map(k => `<span class="tax-pill"><b>${labels[k]}:</b> ${tax[k]}</span>`).join(' ');
  }
  return `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">`
    + keys.filter(k => tax[k]).map(k => `
      <div class="rounded-lg px-3 py-2" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
        <div class="text-[.65rem] text-gray-500 uppercase tracking-wider">${icons[k]} ${labels[k]}</div>
        <div class="text-sm font-semibold text-gray-200 mt-0.5">${tax[k]}</div>
      </div>`).join('')
    + `</div>`;
}

function iucnBadge(status) {
  if (!status) return '';
  const colors = {
    'LC':'badge-green','NT':'badge-amber','VU':'badge-amber',
    'EN':'badge-red','CR':'badge-red','EW':'badge-red','EX':'badge-red',
  };
  const names = {
    'LC':'Least Concern','NT':'Near Threatened','VU':'Vulnerable',
    'EN':'Endangered','CR':'Critically Endangered','EW':'Extinct in Wild','EX':'Extinct',
  };
  const cls = colors[status] || 'badge-slate';
  return `<span class="badge ${cls}">${status}${names[status] ? ' · '+names[status] : ''}</span>`;
}

function renderResults(data) {
  const ctn = document.getElementById('screenResults');
  const preds = data.predictions || [];
  const top = preds[0];
  const alts = preds.slice(1);
  const warnThreshold = data.f1_warn_threshold || 0.65;

  let html = `
    <div class="w-full animate-in" style="animation-delay:.05s">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h2 class="text-xl font-bold">Resultado del Análisis</h2>
          <p class="text-gray-500 text-xs mt-0.5">Modelo: ${data.model || '?'} · ${data.num_classes || '?'} clases</p>
        </div>
        <button onclick="resetAudit()" class="text-xs px-4 py-2 rounded-lg font-medium transition" style="background:var(--c-surface-2);border:1px solid var(--c-border);color:#94a3b8"
                onmouseenter="this.style.borderColor='#10b981'" onmouseleave="this.style.borderColor='var(--c-border)'">
          ← Nueva imagen
        </button>
      </div>
    </div>`;

  if (top) {
    const pct = (top.confidence * 100).toFixed(1);
    const sciName = top.taxonomy?.scientific_name || '';
    html += `
    <div class="result-card w-full p-6 mb-5 animate-in" style="border-color:${confColor(top.confidence)};animation-delay:.1s">
      <div class="flex flex-col md:flex-row gap-5 items-start">
        <img src="${previewImg.src}" class="w-32 h-32 rounded-xl object-cover flex-shrink-0" alt="Uploaded"/>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="badge ${confBadgeClass(top.confidence)}">Top 1</span>
            ${iucnBadge(top.taxonomy?.iucn_status)}
          </div>
          <h3 class="text-xl font-bold mt-1"><em>${fmtSpecies(top.species)}</em></h3>
          ${sciName ? `<p class="text-xs text-gray-500 mt-0.5">${sciName}</p>` : ''}
          <div class="flex items-center gap-3 mt-3">
            <span class="text-2xl font-extrabold" style="color:${confColor(top.confidence)}">${pct}%</span>
            <div class="conf-bar flex-1"><div class="conf-bar-fill" style="width:${pct}%;background:${confColor(top.confidence)}"></div></div>
          </div>
          ${lowF1Warning(top, warnThreshold)}
        </div>
      </div>
      ${taxonomyHTML(top.taxonomy, false)}
    </div>`;
  }

  if (alts.length) {
    html += `<p class="text-xs text-gray-500 mb-3 mt-1 animate-in" style="animation-delay:.2s">Alternativas</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">`;
    alts.forEach((p, i) => {
      const pct = (p.confidence * 100).toFixed(1);
      html += `
      <div class="result-card p-4 animate-in" style="animation-delay:${.25 + i * .08}s">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="badge badge-slate">#${p.rank}</span>
            ${iucnBadge(p.taxonomy?.iucn_status)}
          </div>
          <span class="text-sm font-bold" style="color:${confColor(p.confidence)}">${pct}%</span>
        </div>
        <p class="font-semibold text-sm"><em>${fmtSpecies(p.species)}</em></p>
        <div class="conf-bar mt-2"><div class="conf-bar-fill" style="width:${pct}%;background:${confColor(p.confidence)}"></div></div>
        ${lowF1Warning(p, warnThreshold)}
        <div class="mt-2 flex flex-wrap">${taxonomyHTML(p.taxonomy, true)}</div>
      </div>`;
    });
    html += `</div>`;
  }

  ctn.innerHTML = html;
}

function resetAudit() {
  selectedFile = null;
  previewImg.src = '';
  previewCtn.classList.add('hidden');
  dropZone.classList.add('hidden');
  fileInput.value = '';
  showScreen('upload');
}

// ── Species Data Store ──────────────────────────────────────────
let _speciesData = null;  // raw data from API
let _currentSort = 'name';
let _currentSearch = '';

// ── Search & Sort handlers ──────────────────────────────────────
document.getElementById('speciesSearch').addEventListener('input', e => {
  _currentSearch = e.target.value.trim().toLowerCase();
  renderKingdomColumns();
});
document.getElementById('speciesSort').addEventListener('change', e => {
  _currentSort = e.target.value;
  renderKingdomColumns();
});

function sortSpecies(list, key) {
  const copy = [...list];
  if (key === 'train_count_desc') return copy.sort((a, b) => b.train_count - a.train_count);
  if (key === 'train_count_asc')  return copy.sort((a, b) => a.train_count - b.train_count);
  if (key === 'f1_desc') return copy.sort((a, b) => (b.f1_score ?? -1) - (a.f1_score ?? -1));
  if (key === 'f1_asc')  return copy.sort((a, b) => (a.f1_score ?? 999) - (b.f1_score ?? 999));
  return copy.sort((a, b) => (a[key] || '').localeCompare(b[key] || ''));
}

function filterSpecies(list, q) {
  if (!q) return list;
  return list.filter(sp => {
    const hay = [sp.name, sp.scientific_name, sp.family, sp.order, sp.genus, sp.class, sp.phylum].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function renderKingdomColumns() {
  if (!_speciesData) return;
  const ctn = document.getElementById('kingdomColumns');
  const groups = _speciesData.groups || {};
  const kingdomIcons = {Animalia:'🐾', Plantae:'🌿', Fungi:'🍄', Chromista:'🔬', Protozoa:'🦠'};
  const kingdomColors = {Animalia:'#f59e0b', Plantae:'#10b981', Fungi:'#a78bfa', Chromista:'#38bdf8', Protozoa:'#fb7185'};
  const iucnDots = {LC:'iucn-LC', NT:'iucn-NT', VU:'iucn-VU', EN:'iucn-EN', CR:'iucn-CR'};

  // Sort kingdoms: Animalia, Plantae, Fungi, then rest
  const order = ['Animalia','Plantae','Fungi'];
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  let html = '';
  let totalVisible = 0;

  for (const kingdom of sortedKeys) {
    const filtered = filterSpecies(groups[kingdom] || [], _currentSearch);
    const sorted = sortSpecies(filtered, _currentSort);
    totalVisible += sorted.length;
    const icon = kingdomIcons[kingdom] || '🔬';
    const color = kingdomColors[kingdom] || '#94a3b8';

    html += `<div class="kingdom-col">`;
    html += `<div class="kingdom-col-header">
      <span style="font-size:1rem">${icon}</span>
      <span class="font-semibold text-xs" style="color:${color}">${kingdom}</span>
      <span class="kingdom-col-count">${sorted.length}</span>
    </div>`;
    html += `<div class="kingdom-col-list">`;

    if (sorted.length === 0) {
      html += `<div class="flex items-center justify-center py-6 text-gray-600 text-xs">Sin resultados</div>`;
    }

    for (const sp of sorted) {
      const dot = sp.iucn_status && iucnDots[sp.iucn_status]
        ? `<span class="iucn-dot ${iucnDots[sp.iucn_status]}" title="${sp.iucn_status}"></span>` : '';
      const sortLabel = _currentSort === 'family' ? sp.family
        : _currentSort === 'order' ? sp.order
        : _currentSort === 'phylum' ? (sp.phylum || '')
        : _currentSort === 'scientific_name' ? (sp.scientific_name || sp.name)
        : (_currentSort === 'f1_desc' || _currentSort === 'f1_asc') ? (sp.f1_score != null ? 'F1: ' + (sp.f1_score * 100).toFixed(1) + '%' : 'F1: N/A')
        : sp.family + (sp.order ? ' · ' + sp.order : '');
      const f1Badge = sp.low_f1
        ? `<span class="badge badge-amber" style="font-size:.55rem;padding:.1rem .35rem" title="F1: ${sp.f1_score != null ? (sp.f1_score*100).toFixed(1)+'%' : '?'}">⚠ F1 bajo</span>`
        : '';
      html += `
        <div class="species-item">
          ${dot}
          <div style="min-width:0;overflow:hidden">
            <div class="sp-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${fmtSpecies(sp.name)} ${f1Badge}</div>
            <div class="sp-family" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sortLabel}</div>
          </div>
          <span class="sp-count">${sp.train_count} imgs</span>
        </div>`;
    }

    html += `</div></div>`;
  }

  ctn.innerHTML = html;
  document.getElementById('speciesCount').textContent = `${totalVisible} de ${_speciesData.total} especies`;
}

// ── Load model info + species list on startup ───────────────────
(async () => {
  try {
    const [healthRes, speciesRes] = await Promise.all([
      fetch('/api/health'),
      fetch('/api/species'),
    ]);
    const d = await healthRes.json();
    document.getElementById('navModelBadge').classList.remove('hidden');
    document.getElementById('navModel').textContent = d.model;
    document.getElementById('navClasses').textContent = d.num_classes + ' clases · ' + d.device;
    document.getElementById('footerDevice').textContent = d.device;

    _speciesData = await speciesRes.json();
    renderKingdomColumns();
  } catch(_){}
})();
</script>
</body>
</html>
"""

METRICS_HTML = r"""<!DOCTYPE html>
<html lang="es" class="dark">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>BioAudit – Métricas del Modelo CNN</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
  :root {
    --c-emerald: #10b981;
    --c-emerald-dark: #059669;
    --c-bg: #0c0f16;
    --c-surface: #141925;
    --c-surface-2: #1c2333;
    --c-border: #2a3349;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',sans-serif;background:var(--c-bg);color:#e2e8f0;min-height:100vh;}

  /* scrollbar */
  ::-webkit-scrollbar{width:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#334155;border-radius:3px}

  /* KPI cards */
  .kpi-card{background:var(--c-surface);border:1px solid var(--c-border);border-radius:1rem;padding:1.5rem;transition:transform .2s,box-shadow .2s;}
  .kpi-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(16,185,129,.12);}
  .kpi-value{font-size:2.2rem;font-weight:800;line-height:1.1;}
  .kpi-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#64748b;margin-top:.4rem;}
  .kpi-sub{font-size:.65rem;color:#475569;margin-top:.25rem;}

  /* chart containers */
  .chart-card{background:var(--c-surface);border:1px solid var(--c-border);border-radius:1rem;padding:1.25rem;overflow:hidden;}
  .chart-card h3{font-size:.85rem;font-weight:700;margin-bottom:1rem;color:#e2e8f0;}
  .chart-card canvas{max-height:320px;}

  /* data table */
  .data-table{width:100%;border-collapse:collapse;font-size:.75rem;}
  .data-table thead th{text-align:left;padding:.6rem .75rem;border-bottom:2px solid var(--c-border);color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;font-size:.65rem;cursor:pointer;user-select:none;white-space:nowrap;}
  .data-table thead th:hover{color:#10b981;}
  .data-table thead th.sorted-asc::after{content:' ▲';color:#10b981;}
  .data-table thead th.sorted-desc::after{content:' ▼';color:#10b981;}
  .data-table tbody td{padding:.5rem .75rem;border-bottom:1px solid var(--c-border);color:#cbd5e1;white-space:nowrap;}
  .data-table tbody tr:hover{background:var(--c-surface-2);}
  .data-table tbody tr:hover td{color:#e2e8f0;}

  /* badge */
  .badge{display:inline-flex;align-items:center;font-size:.6rem;font-weight:600;padding:.15rem .45rem;border-radius:9999px;text-transform:uppercase;letter-spacing:.04em;}
  .badge-green{background:rgba(16,185,129,.15);color:#34d399;}
  .badge-amber{background:rgba(245,158,11,.15);color:#fbbf24;}
  .badge-red{background:rgba(239,68,68,.15);color:#f87171;}

  /* metric bar */
  .metric-bar{height:5px;border-radius:3px;background:#1e293b;overflow:hidden;width:80px;display:inline-block;vertical-align:middle;margin-left:.4rem;}
  .metric-bar-fill{height:100%;border-radius:3px;transition:width .4s ease;}

  /* panel */
  .panel{background:var(--c-surface);border:1px solid var(--c-border);border-radius:1rem;overflow:hidden;}

  /* fade in */
  @keyframes fadeSlideUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
  .animate-in{animation:fadeSlideUp .45s ease forwards;opacity:0;}

  /* section title */
  .section-title{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:#10b981;font-weight:700;margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem;}
</style>
</head>
<body class="flex flex-col min-h-screen">

<!-- ═══ Navbar ═══ -->
<nav class="flex items-center justify-between px-6 py-3 border-b" style="border-color:var(--c-border);background:var(--c-surface)">
  <div class="flex items-center gap-3">
    <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#10b981,#06b6d4)">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 12l3 3 5-5"/></svg>
    </div>
    <span class="font-bold text-sm tracking-tight">BioAudit</span>
    <a href="/" class="flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-lg transition ml-2" style="background:var(--c-surface-2);border:1px solid var(--c-border);color:#94a3b8" onmouseenter="this.style.borderColor='#10b981';this.style.color='#10b981'" onmouseleave="this.style.borderColor='var(--c-border)';this.style.color='#94a3b8'">
      &#128269; Auditor
    </a>
    <span class="text-xs font-semibold px-3 py-1 rounded-lg" style="background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.3);color:#10b981">
      &#128202; Métricas
    </span>
  </div>
  <div id="navInfo" class="text-xs text-gray-500">
    <span id="navModelName" class="badge" style="background:rgba(100,116,139,.2);color:#94a3b8"></span>
  </div>
</nav>

<!-- ═══ Main Content ═══ -->
<main class="flex-1 overflow-y-auto p-4 md:p-6" style="max-width:1400px;margin:0 auto;width:100%;">

  <!-- Header -->
  <div class="mb-6 animate-in" style="animation-delay:.05s">
    <h1 class="text-xl font-bold">Dashboard de Métricas del Modelo CNN</h1>
    <p class="text-xs text-gray-500 mt-1">Análisis completo de rendimiento basado en datos de evaluación</p>
  </div>

  <!-- Loading state -->
  <div id="loadingState" class="flex flex-col items-center justify-center py-20">
    <div class="w-12 h-12 rounded-full border-4 border-transparent border-t-emerald-500" style="border-top-color:#10b981;animation:spin .8s linear infinite"></div>
    <p class="text-sm text-gray-500 mt-4">Cargando métricas…</p>
  </div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>

  <!-- Dashboard content (hidden until loaded) -->
  <div id="dashboardContent" class="hidden">

    <!-- KPI Row -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in" style="animation-delay:.1s">
      <div class="kpi-card">
        <div class="flex items-center gap-2 mb-2"><span style="font-size:1.2rem">🎯</span><span class="text-[.65rem] text-gray-500 font-semibold uppercase">Accuracy</span></div>
        <div class="kpi-value" style="color:#10b981" id="kpiAccuracy">—</div>
        <div class="kpi-sub" id="kpiAccSub"></div>
        <div class="kpi-sub mt-2 pt-2 border-t font-semibold" style="border-color:var(--c-border)" id="kpiAccTop300">Top-300: —</div>
      </div>
      <div class="kpi-card">
        <div class="flex items-center gap-2 mb-2"><span style="font-size:1.2rem">🏆</span><span class="text-[.65rem] text-gray-500 font-semibold uppercase">Top-5 Accuracy</span></div>
        <div class="kpi-value" style="color:#06b6d4" id="kpiTop5">—</div>
        <div class="kpi-sub">Predicción correcta en top 5</div>
        <div class="kpi-sub mt-2 pt-2 border-t font-semibold" style="border-color:var(--c-border)" id="kpiTop5Top300">Top-300: —</div>
      </div>
      <div class="kpi-card">
        <div class="flex items-center gap-2 mb-2"><span style="font-size:1.2rem">📊</span><span class="text-[.65rem] text-gray-500 font-semibold uppercase">Macro F1-Score</span></div>
        <div class="kpi-value" style="color:#a78bfa" id="kpiMacroF1">—</div>
        <div class="kpi-sub" id="kpiMacroSub"></div>
        <div class="kpi-sub mt-2 pt-2 border-t font-semibold" style="border-color:var(--c-border)" id="kpiMacroF1Top300">Top-300: —</div>
      </div>
      <div class="kpi-card">
        <div class="flex items-center gap-2 mb-2"><span style="font-size:1.2rem">🧬</span><span class="text-[.65rem] text-gray-500 font-semibold uppercase">Especies / Muestras</span></div>
        <div class="kpi-value" style="color:#f59e0b" id="kpiSpecies">—</div>
        <div class="kpi-sub" id="kpiSamples"></div>
      </div>
    </div>

    <!-- Charts Row 1: F1 Histogram + Precision/Recall Scatter -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <div class="chart-card animate-in" style="animation-delay:.15s">
        <h3>📈 Distribución de F1-Score por Clase</h3>
        <canvas id="chartF1Hist"></canvas>
      </div>
      <div class="chart-card animate-in" style="animation-delay:.2s">
        <h3>🔬 Precisión vs Recall por Clase</h3>
        <canvas id="chartPR"></canvas>
      </div>
    </div>

    <!-- Charts Row 2: Confused Pairs + Support Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <div class="chart-card lg:col-span-2 animate-in" style="animation-delay:.25s">
        <h3>⚠️ Top Pares de Especies Confundidas</h3>
        <canvas id="chartConfusion"></canvas>
      </div>
      <div class="chart-card animate-in" style="animation-delay:.3s">
        <h3>📦 Distribución de Soporte (Muestras por Clase)</h3>
        <canvas id="chartSupport"></canvas>
      </div>
    </div>

    <!-- Weighted vs Macro Averages -->
    <div class="chart-card mb-6 animate-in" style="animation-delay:.32s">
      <h3>⚖️ Comparación: Macro vs Weighted Averages</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="avgComparison"></div>
    </div>

    <!-- Per-Class Metrics Table -->
    <div class="panel mb-6 animate-in" style="animation-delay:.35s">
      <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid var(--c-border);background:var(--c-surface-2)">
        <div class="section-title mb-0">📋 Métricas por Clase</div>
        <div class="flex items-center gap-3">
          <input id="classSearch" type="text" placeholder="Buscar especie…"
            class="text-xs rounded-lg py-1.5 px-3 outline-none focus:ring-1 focus:ring-emerald-500"
            style="background:var(--c-bg);border:1px solid var(--c-border);color:#e2e8f0;width:220px;"
          />
          <span id="classCount" class="text-[.6rem] text-gray-600"></span>
        </div>
      </div>
      <div style="max-height:460px;overflow-y:auto;">
        <table class="data-table" id="classTable">
          <thead>
            <tr>
              <th data-col="name">Especie</th>
              <th data-col="precision">Precisión</th>
              <th data-col="recall">Recall</th>
              <th data-col="f1_score">F1-Score</th>
              <th data-col="support">Soporte</th>
            </tr>
          </thead>
          <tbody id="classTableBody"></tbody>
        </table>
      </div>
    </div>

    <!-- Misclassified Samples Table -->
    <div class="panel mb-6 animate-in" style="animation-delay:.4s">
      <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid var(--c-border);background:var(--c-surface-2)">
        <div class="section-title mb-0">❌ Muestras Mal Clasificadas</div>
        <span id="misCount" class="text-[.6rem] text-gray-600"></span>
      </div>
      <div style="max-height:400px;overflow-y:auto;">
        <table class="data-table" id="misTable">
          <thead>
            <tr>
              <th>Especie Real</th>
              <th>Predicción</th>
              <th>Confianza</th>
              <th>Prob. Real</th>
            </tr>
          </thead>
          <tbody id="misTableBody"></tbody>
        </table>
      </div>
    </div>

    <!-- Glossary / Info Section -->
    <div class="panel mb-6 animate-in" style="animation-delay:.45s">
      <div class="px-4 py-3" style="border-bottom:1px solid var(--c-border);background:var(--c-surface-2)">
        <div class="section-title mb-0">📖 Glosario de Métricas</div>
      </div>
      <div class="p-5">
        <p class="text-xs text-gray-400 mb-5">Explicación de las métricas utilizadas para evaluar el rendimiento del modelo CNN de clasificación de especies.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

          <!-- Accuracy -->
          <div class="rounded-xl p-4" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
            <div class="flex items-center gap-2 mb-2">
              <span style="font-size:1.1rem">🎯</span>
              <span class="text-sm font-bold" style="color:#10b981">Accuracy (Exactitud)</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-2">Proporción de predicciones correctas sobre el total de predicciones. Mide qué tan frecuentemente el modelo acierta.</p>
            <div class="rounded-lg px-3 py-1.5" style="background:var(--c-bg);font-family:monospace;font-size:.65rem;color:#94a3b8">
              Accuracy = Predicciones Correctas / Total de Predicciones
            </div>
          </div>

          <!-- Top-5 Accuracy -->
          <div class="rounded-xl p-4" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
            <div class="flex items-center gap-2 mb-2">
              <span style="font-size:1.1rem">🏆</span>
              <span class="text-sm font-bold" style="color:#06b6d4">Top-5 Accuracy</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-2">Proporción de veces que la etiqueta correcta aparece entre las 5 predicciones con mayor confianza. Útil cuando las clases son muy similares visualmente.</p>
            <div class="rounded-lg px-3 py-1.5" style="background:var(--c-bg);font-family:monospace;font-size:.65rem;color:#94a3b8">
              Top-5 Acc = (Correcta en Top 5) / Total
            </div>
          </div>

          <!-- Precision -->
          <div class="rounded-xl p-4" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
            <div class="flex items-center gap-2 mb-2">
              <span style="font-size:1.1rem">🔎</span>
              <span class="text-sm font-bold" style="color:#a78bfa">Precisión (Precision)</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-2">De todas las veces que el modelo predijo una especie, ¿cuántas veces acertó? Una precisión alta significa pocos <strong style="color:#cbd5e1">falsos positivos</strong>.</p>
            <div class="rounded-lg px-3 py-1.5" style="background:var(--c-bg);font-family:monospace;font-size:.65rem;color:#94a3b8">
              Precisión = VP / (VP + FP)
            </div>
          </div>

          <!-- Recall -->
          <div class="rounded-xl p-4" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
            <div class="flex items-center gap-2 mb-2">
              <span style="font-size:1.1rem">📡</span>
              <span class="text-sm font-bold" style="color:#f59e0b">Recall (Sensibilidad)</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-2">De todas las muestras reales de una especie, ¿cuántas logró identificar? Un recall alto significa pocos <strong style="color:#cbd5e1">falsos negativos</strong>.</p>
            <div class="rounded-lg px-3 py-1.5" style="background:var(--c-bg);font-family:monospace;font-size:.65rem;color:#94a3b8">
              Recall = VP / (VP + FN)
            </div>
          </div>

          <!-- F1-Score -->
          <div class="rounded-xl p-4" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
            <div class="flex items-center gap-2 mb-2">
              <span style="font-size:1.1rem">⚖️</span>
              <span class="text-sm font-bold" style="color:#ec4899">F1-Score</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-2">Media armónica entre Precisión y Recall. Balancea ambas métricas en un solo valor. Un F1 alto indica que el modelo es tanto preciso como completo.</p>
            <div class="rounded-lg px-3 py-1.5" style="background:var(--c-bg);font-family:monospace;font-size:.65rem;color:#94a3b8">
              F1 = 2 × (Precisión × Recall) / (Precisión + Recall)
            </div>
          </div>

          <!-- Support -->
          <div class="rounded-xl p-4" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
            <div class="flex items-center gap-2 mb-2">
              <span style="font-size:1.1rem">📦</span>
              <span class="text-sm font-bold" style="color:#14b8a6">Soporte (Support)</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-2">Número de muestras reales de cada especie en el conjunto de evaluación. Clases con bajo soporte pueden tener métricas menos confiables.</p>
            <div class="rounded-lg px-3 py-1.5" style="background:var(--c-bg);font-family:monospace;font-size:.65rem;color:#94a3b8">
              Soporte = Nº de muestras reales de la clase
            </div>
          </div>

          <!-- Macro Average -->
          <div class="rounded-xl p-4" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
            <div class="flex items-center gap-2 mb-2">
              <span style="font-size:1.1rem">📊</span>
              <span class="text-sm font-bold" style="color:#8b5cf6">Macro Average</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-2">Promedio simple de la métrica para todas las clases, sin importar el tamaño de cada clase. Trata a todas las especies por igual, incluso las raras.</p>
            <div class="rounded-lg px-3 py-1.5" style="background:var(--c-bg);font-family:monospace;font-size:.65rem;color:#94a3b8">
              Macro = (1/N) × Σ métrica por clase
            </div>
          </div>

          <!-- Weighted Average -->
          <div class="rounded-xl p-4" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
            <div class="flex items-center gap-2 mb-2">
              <span style="font-size:1.1rem">🧮</span>
              <span class="text-sm font-bold" style="color:#0ea5e9">Weighted Average</span>
            </div>
            <p class="text-xs text-gray-400 leading-relaxed mb-2">Promedio ponderado por el soporte de cada clase. Las especies con más muestras tienen mayor peso. Refleja el rendimiento "real" sobre los datos.</p>
            <div class="rounded-lg px-3 py-1.5" style="background:var(--c-bg);font-family:monospace;font-size:.65rem;color:#94a3b8">
              Weighted = Σ (soporte_i × métrica_i) / Σ soporte_i
            </div>
          </div>

        </div>

        <!-- VP/VN/FP/FN legend -->
        <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[.7rem] text-gray-400 p-4 rounded-xl" style="background:var(--c-surface-2);border:1px solid var(--c-border)">
          <div><strong style="color:#10b981">VP (Verdaderos Positivos):</strong> El modelo predijo correctamente la especie.</div>
          <div><strong style="color:#f59e0b">VN (Verdaderos Negativos):</strong> El modelo descartó correctamente una especie.</div>
          <div><strong style="color:#ef4444">FP (Falsos Positivos):</strong> El modelo se equivocó al predecir una especie que no era (Falsa Alarma).</div>
          <div><strong style="color:#06b6d4">FN (Falsos Negativos):</strong> El modelo no logró detectar la especie cuando sí era (Omisión).</div>
        </div>

      </div>
    </div>

  </div><!-- /dashboardContent -->

</main>

<!-- ═══ Footer ═══ -->
<footer class="text-center py-3 text-gray-600 text-xs border-t" style="border-color:var(--c-border)">
  BioCommerce Caldas · Model Metrics Dashboard
</footer>

<script>
// ── Chart.js Global Config ──
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = '#2a3349';
Chart.defaults.font.family = 'Inter';
Chart.defaults.font.size = 11;

// ── Color Palettes ──
const emerald = '#10b981';
const cyan = '#06b6d4';
const purple = '#a78bfa';
const amber = '#f59e0b';
const red = '#ef4444';
const slate = '#64748b';

function metricColor(v) {
  if (v >= 0.9) return emerald;
  if (v >= 0.7) return cyan;
  if (v >= 0.5) return amber;
  return red;
}

function metricBadge(v) {
  const pct = (v * 100).toFixed(1);
  let cls = 'badge-green';
  if (v < 0.5) cls = 'badge-red';
  else if (v < 0.7) cls = 'badge-amber';
  return `<span class="badge ${cls}">${pct}%</span>`;
}

function miniBar(v, color) {
  const w = Math.round(v * 100);
  return `<div class="metric-bar"><div class="metric-bar-fill" style="width:${w}%;background:${color}"></div></div>`;
}

// ── Data Fetch & Render ──
(async () => {
  try {
    const [metricsRes, misRes, confRes, healthRes] = await Promise.all([
      fetch('/api/metrics'),
      fetch('/api/metrics/misclassified'),
      fetch('/api/metrics/confusion'),
      fetch('/api/health'),
    ]);

    const metrics = await metricsRes.json();
    const misData = await misRes.json();
    const confData = await confRes.json();
    const healthData = await healthRes.json();

    // Show model name
    document.getElementById('navModelName').textContent = healthData.model || '?';

    // Hide loading, show dashboard
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');

    // ── KPI Cards ──
    const acc = metrics.accuracy || 0;
    const top5 = metrics.top_5_accuracy || 0;
    const macroF1 = metrics.macro_avg?.f1_score || 0;

    // Calcular Top 300
    const perClassArr = Object.values(metrics.per_class || {});
    const top300 = perClassArr.sort((a,b) => (b.f1_score||0) - (a.f1_score||0)).slice(0, 300);
    const t300Support = top300.reduce((s, c) => s + (c.support||0), 0);
    const t300Acc = t300Support > 0 ? top300.reduce((s, c) => s + ((c.recall||0)*(c.support||0)), 0) / t300Support : 0;
    const t300MacroF1 = top300.length > 0 ? top300.reduce((s, c) => s + (c.f1_score||0), 0) / top300.length : 0;
    const t300Top5 = Math.min(1.0, t300Acc + Math.max(0, top5 - acc)); // Aproximacion conservadora

    document.getElementById('kpiAccuracy').textContent = (acc * 100).toFixed(1) + '%';
    document.getElementById('kpiAccSub').textContent =
      `P: ${((metrics.weighted_avg?.precision || 0) * 100).toFixed(1)}% · R: ${((metrics.weighted_avg?.recall || 0) * 100).toFixed(1)}%`;
    if (document.getElementById('kpiAccTop300')) {
      document.getElementById('kpiAccTop300').textContent = `Top-300: ${(t300Acc * 100).toFixed(1)}%`;
    }

    document.getElementById('kpiTop5').textContent = (top5 * 100).toFixed(1) + '%';
    if (document.getElementById('kpiTop5Top300')) {
      document.getElementById('kpiTop5Top300').textContent = `Top-300: ${(t300Top5 * 100).toFixed(1)}% (est.)`;
    }

    document.getElementById('kpiMacroF1').textContent = (macroF1 * 100).toFixed(1) + '%';
    document.getElementById('kpiMacroSub').textContent =
      `P: ${((metrics.macro_avg?.precision || 0) * 100).toFixed(1)}% · R: ${((metrics.macro_avg?.recall || 0) * 100).toFixed(1)}%`;
    if (document.getElementById('kpiMacroF1Top300')) {
      document.getElementById('kpiMacroF1Top300').textContent = `Top-300: ${(t300MacroF1 * 100).toFixed(1)}%`;
    }

    document.getElementById('kpiSpecies').textContent = metrics.total_species || '?';
    document.getElementById('kpiSamples').textContent = `${metrics.total_samples || '?'} muestras de test`;

    // ── F1 Histogram ──
    const histData = metrics.f1_histogram || {labels:[], counts:[]};
    new Chart(document.getElementById('chartF1Hist'), {
      type: 'bar',
      data: {
        labels: histData.labels,
        datasets: [{
          label: 'Nº Especies',
          data: histData.counts,
          backgroundColor: histData.counts.map((_, i) => {
            const colors = [red, red, '#f97316', amber, amber, '#84cc16', cyan, emerald, emerald, '#059669'];
            return colors[i] + '99';
          }),
          borderColor: histData.counts.map((_, i) => {
            const colors = [red, red, '#f97316', amber, amber, '#84cc16', cyan, emerald, emerald, '#059669'];
            return colors[i];
          }),
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {display: false},
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.parsed.y} especies`
            }
          }
        },
        scales: {
          x: {title: {display: true, text: 'Rango F1-Score', color: slate}},
          y: {title: {display: true, text: 'Cantidad de especies', color: slate}, beginAtZero: true}
        }
      }
    });

    // ── Precision vs Recall Scatter ──
    const perClass = metrics.per_class || {};
    const prPoints = Object.entries(perClass).map(([name, m]) => ({
      x: m.recall,
      y: m.precision,
      name: name.replace(/_/g, ' '),
      f1: m.f1_score,
    }));
    new Chart(document.getElementById('chartPR'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Especies',
          data: prPoints,
          backgroundColor: prPoints.map(p => {
            const f1 = p.f1 || 0;
            if (f1 >= 0.9) return emerald + 'aa';
            if (f1 >= 0.7) return cyan + 'aa';
            if (f1 >= 0.5) return amber + 'aa';
            return red + 'aa';
          }),
          borderColor: 'transparent',
          pointRadius: 4,
          pointHoverRadius: 7,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {display: false},
          tooltip: {
            callbacks: {
              label: ctx => {
                const p = ctx.raw;
                return `${p.name}: P=${(p.y*100).toFixed(1)}% R=${(p.x*100).toFixed(1)}% F1=${(p.f1*100).toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          x: {title: {display: true, text: 'Recall', color: slate}, min: 0, max: 1.05},
          y: {title: {display: true, text: 'Precisión', color: slate}, min: 0, max: 1.05}
        }
      }
    });

    // ── Confused Pairs Chart ──
    const pairs = (confData.pairs || []).slice(0, 15);
    new Chart(document.getElementById('chartConfusion'), {
      type: 'bar',
      data: {
        labels: pairs.map(p => `${p.true_species.replace(/_/g,' ')} → ${p.predicted_as.replace(/_/g,' ')}`),
        datasets: [{
          label: 'Tasa de confusión',
          data: pairs.map(p => p.rate),
          backgroundColor: pairs.map(p => {
            if (p.rate >= 50) return red + 'cc';
            if (p.rate >= 30) return amber + 'cc';
            return cyan + 'cc';
          }),
          borderColor: pairs.map(p => {
            if (p.rate >= 50) return red;
            if (p.rate >= 30) return amber;
            return cyan;
          }),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {display: false},
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.parsed.x.toFixed(1)}% (${pairs[ctx.dataIndex].count} muestras)`
            }
          }
        },
        scales: {
          x: {title: {display: true, text: 'Tasa de confusión (%)', color: slate}, beginAtZero: true},
          y: {ticks: {font: {size: 9}}}
        }
      }
    });

    // ── Support Distribution Donut ──
    const suppDist = metrics.support_distribution || {};
    const suppLabels = Object.keys(suppDist);
    const suppValues = Object.values(suppDist);
    new Chart(document.getElementById('chartSupport'), {
      type: 'doughnut',
      data: {
        labels: suppLabels.map(l => l + ' muestras'),
        datasets: [{
          data: suppValues,
          backgroundColor: [emerald + 'cc', cyan + 'cc', purple + 'cc', amber + 'cc'],
          borderColor: [emerald, cyan, purple, amber],
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        cutout: '60%',
        plugins: {
          legend: {position: 'bottom', labels: {padding: 12, usePointStyle: true, pointStyleWidth: 8}},
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.label}: ${ctx.parsed} especies (${((ctx.parsed / suppValues.reduce((a,b)=>a+b,0))*100).toFixed(1)}%)`
            }
          }
        }
      }
    });

    // ── Macro vs Weighted Comparison ──
    const avgCtn = document.getElementById('avgComparison');
    const macroAvg = metrics.macro_avg || {};
    const weightedAvg = metrics.weighted_avg || {};
    const avgMetrics = ['precision', 'recall', 'f1_score'];
    const avgLabels = {precision: 'Precisión', recall: 'Recall', f1_score: 'F1-Score'};

    let avgHTML = '';
    for (const key of avgMetrics) {
      const mv = macroAvg[key] || 0;
      const wv = weightedAvg[key] || 0;
      avgHTML += `
        <div class="flex items-center gap-4 px-4 py-3 rounded-lg" style="background:var(--c-surface-2)">
          <div class="flex-1">
            <div class="text-[.65rem] text-gray-500 uppercase font-semibold mb-1">${avgLabels[key]}</div>
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[.65rem] text-gray-400">Macro</span>
                  <span class="text-xs font-bold" style="color:${purple}">${(mv*100).toFixed(1)}%</span>
                </div>
                <div class="metric-bar" style="width:100%"><div class="metric-bar-fill" style="width:${mv*100}%;background:${purple}"></div></div>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[.65rem] text-gray-400">Weighted</span>
                  <span class="text-xs font-bold" style="color:${cyan}">${(wv*100).toFixed(1)}%</span>
                </div>
                <div class="metric-bar" style="width:100%"><div class="metric-bar-fill" style="width:${wv*100}%;background:${cyan}"></div></div>
              </div>
            </div>
          </div>
        </div>`;
    }
    avgCtn.innerHTML = avgHTML;

    // ── Per-Class Table ──
    let classData = Object.entries(perClass).map(([name, m]) => ({
      name, precision: m.precision, recall: m.recall, f1_score: m.f1_score, support: m.support
    }));
    let sortCol = 'f1_score', sortDir = 'desc';
    const tbody = document.getElementById('classTableBody');
    const countEl = document.getElementById('classCount');
    const searchEl = document.getElementById('classSearch');

    function renderClassTable() {
      const q = searchEl.value.trim().toLowerCase();
      let filtered = classData;
      if (q) filtered = classData.filter(r => r.name.toLowerCase().includes(q));
      filtered.sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol];
        if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
        return sortDir === 'asc' ? av - bv : bv - av;
      });
      countEl.textContent = `${filtered.length} de ${classData.length}`;
      tbody.innerHTML = filtered.map(r => {
        const fmtName = r.name.replace(/_/g, ' ');
        return `<tr>
          <td><em>${fmtName}</em></td>
          <td>${(r.precision*100).toFixed(1)}% ${miniBar(r.precision, metricColor(r.precision))}</td>
          <td>${(r.recall*100).toFixed(1)}% ${miniBar(r.recall, metricColor(r.recall))}</td>
          <td>${metricBadge(r.f1_score)}</td>
          <td>${r.support}</td>
        </tr>`;
      }).join('');
      // Update header classes
      document.querySelectorAll('#classTable thead th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
        if (th.dataset.col === sortCol) th.classList.add('sorted-' + sortDir);
      });
    }

    searchEl.addEventListener('input', renderClassTable);
    document.querySelectorAll('#classTable thead th').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.dataset.col;
        if (!col) return;
        if (sortCol === col) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortCol = col; sortDir = col === 'name' ? 'asc' : 'desc'; }
        renderClassTable();
      });
    });
    renderClassTable();

    // ── Misclassified Table ──
    const misSamples = misData.samples || [];
    document.getElementById('misCount').textContent = `${misSamples.length} muestras`;
    const misBody = document.getElementById('misTableBody');
    misBody.innerHTML = misSamples.map(s => {
      const conf = (s.confidence * 100).toFixed(1);
      const trueProb = (s.true_label_prob * 100).toFixed(2);
      const confCls = s.confidence >= 0.7 ? 'badge-red' : s.confidence >= 0.5 ? 'badge-amber' : 'badge-green';
      return `<tr>
        <td><em>${(s.true_label || '').replace(/_/g, ' ')}</em></td>
        <td><em>${(s.predicted_label || '').replace(/_/g, ' ')}</em></td>
        <td><span class="badge ${confCls}">${conf}%</span></td>
        <td style="color:#64748b">${trueProb}%</td>
      </tr>`;
    }).join('');

  } catch(err) {
    document.getElementById('loadingState').innerHTML =
      `<p class="text-red-400 text-sm">Error cargando métricas: ${err.message}</p>`;
  }
})();
</script>
</body>
</html>
"""


# ── CLI Entry Point ────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="BioCommerce Caldas – Model Auditor UI",
    )
    parser.add_argument(
        "--port", type=int, default=8501,
        help="Puerto del servidor local (default: 8501)",
    )
    parser.add_argument(
        "--weights", type=str, default=None,
        help="Nombre del archivo de pesos en data/weights/ (default: best_model.pth)",
    )
    parser.add_argument(
        "--no-browser", action="store_true",
        help="No abrir el navegador automáticamente",
    )
    parser.add_argument(
        "--min-f1", type=float, default=0.0,
        help="Umbral mínimo de F1-score para filtrar especies (e.g. 0.7). "
             "Usa evaluation_metrics.json para excluir especies por debajo del umbral.",
    )
    args = parser.parse_args()

    global _weights_path, _min_f1, _allowed_species, _species_f1, _f1_warn_threshold
    if args.weights:
        _weights_path = PROJECT_ROOT / "data" / "weights" / args.weights

    _f1_warn_threshold = _load_env_f1_threshold()
    _min_f1 = args.min_f1
    _allowed_species, _species_f1 = _load_species_f1_data(_min_f1)

    url = f"http://localhost:{args.port}"
    print("\n  🧬 BioAudit – Model Auditor")
    print("  ───────────────────────────")
    print(f"  URL:      {url}")
    print(f"  Weights:  {_weights_path or 'data/weights/best_model.pth (default)'}")

    if _allowed_species is not None:
        passing, total_eval = _species_stats
        print(f"  Filtro:   F1 >= {_min_f1:.2f}")
        print(f"  Especies: {passing} de {total_eval} evaluadas pasan el umbral")
    else:
        print("  Filtro:   ninguno (todas las especies habilitadas)")

    print(f"  Aviso F1: especies con F1 < {_f1_warn_threshold:.2f} mostrarán advertencia")
    print("            (configurable: BIO_MIN_F1_THRESHOLD en .env)")
    print("  Ctrl+C para detener\n")

    if not args.no_browser:
        import threading
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    uvicorn.run(api, host="0.0.0.0", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
