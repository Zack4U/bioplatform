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
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent          # Bio.Backend.AI/
sys.path.insert(0, str(PROJECT_ROOT))

import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse

from app.services.vision.classifier import SpeciesClassifier

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
        print(f"  [WARN] evaluation_metrics.json not found, F1 filter disabled.")
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
    print(f"\n  🧬 BioAudit – Model Auditor")
    print(f"  ───────────────────────────")
    print(f"  URL:      {url}")
    print(f"  Weights:  {_weights_path or 'data/weights/best_model.pth (default)'}")

    if _allowed_species is not None:
        passing, total_eval = _species_stats
        print(f"  Filtro:   F1 >= {_min_f1:.2f}")
        print(f"  Especies: {passing} de {total_eval} evaluadas pasan el umbral")
    else:
        print(f"  Filtro:   ninguno (todas las especies habilitadas)")

    print(f"  Aviso F1: especies con F1 < {_f1_warn_threshold:.2f} mostrarán advertencia")
    print(f"            (configurable: BIO_MIN_F1_THRESHOLD en .env)")
    print(f"  Ctrl+C para detener\n")

    if not args.no_browser:
        import threading
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    uvicorn.run(api, host="0.0.0.0", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
