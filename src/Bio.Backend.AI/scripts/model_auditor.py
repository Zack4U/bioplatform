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
  .upload-zone{border:2px dashed #374151;border-radius:1rem;padding:3rem 2rem;text-align:center;transition:all .25s;cursor:pointer;background:var(--c-surface);}
  .upload-zone:hover,.upload-zone.drag-over{border-color:var(--c-emerald);background:rgba(16,185,129,.06);}
  .upload-zone.drag-over{box-shadow:0 0 40px rgba(16,185,129,.12);}

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
<main class="flex-1 flex items-center justify-center p-6">

  <!-- SCREEN 1: Upload -->
  <section id="screenUpload" class="screen active flex-col items-center w-full max-w-xl animate-in">
    <h1 class="text-2xl font-bold mb-1">Auditoría del Modelo CNN</h1>
    <p class="text-gray-400 text-sm mb-8">Sube una imagen para clasificar la especie con el modelo entrenado</p>

    <div id="dropZone" class="upload-zone w-full flex flex-col items-center gap-4" onclick="document.getElementById('fileInput').click()">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center" style="background:rgba(16,185,129,.1)">
        <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#10b981" stroke-width="1.5">
          <path d="M12 16V4m0 0l-4 4m4-4l4 4"/>
          <path d="M20 16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2"/>
        </svg>
      </div>
      <div>
        <p class="font-semibold text-sm">Arrastra una imagen aquí</p>
        <p class="text-gray-500 text-xs mt-1">o haz clic para seleccionar · JPG, PNG, WEBP</p>
      </div>
      <input type="file" id="fileInput" accept="image/jpeg,image/png,image/webp" class="hidden"/>
    </div>

    <div id="previewContainer" class="hidden mt-6 flex flex-col items-center gap-4 animate-in">
      <img id="previewImg" class="preview-img" alt="Preview"/>
      <div class="flex items-center gap-3">
        <span id="fileName" class="text-xs text-gray-400"></span>
        <span id="fileSize" class="text-xs text-gray-600"></span>
      </div>
      <button id="btnClassify" class="mt-1 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.03] active:scale-[.98]"
              style="background:linear-gradient(135deg,#10b981,#059669);box-shadow:0 4px 15px rgba(16,185,129,.3)">
        <span class="flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/></svg>
          Clasificar Especie
        </span>
      </button>
    </div>
  </section>

  <!-- SCREEN 2: Analyzing -->
  <section id="screenAnalyzing" class="screen flex-col items-center justify-center gap-6">
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
  <section id="screenResults" class="screen flex-col items-center w-full max-w-3xl">
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
  previewCtn.classList.remove('hidden');
}

fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

dropZone.addEventListener('dragover', e => {e.preventDefault(); dropZone.classList.add('drag-over');});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {e.preventDefault(); dropZone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]);});

// ── Classify ──────────────────────────────────────────────────────
document.getElementById('btnClassify').addEventListener('click', async () => {
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
});

// ── Render Results ────────────────────────────────────────────────
function confColor(c) {
  if (c >= .7) return '#10b981';
  if (c >= .4) return '#f59e0b';
  return '#ef4444';
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
  fileInput.value = '';
  showScreen('upload');
}

// ── Load model info on startup ───────────────────────────────────
(async () => {
  try {
    const res = await fetch('/api/health');
    const d = await res.json();
    document.getElementById('navModelBadge').classList.remove('hidden');
    document.getElementById('navModel').textContent = d.model;
    document.getElementById('navClasses').textContent = d.num_classes + ' clases · ' + d.device;
    document.getElementById('footerDevice').textContent = d.device;
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
    args = parser.parse_args()

    global _weights_path
    if args.weights:
        _weights_path = PROJECT_ROOT / "data" / "weights" / args.weights

    url = f"http://localhost:{args.port}"
    print(f"\n  🧬 BioAudit – Model Auditor")
    print(f"  ───────────────────────────")
    print(f"  URL:      {url}")
    print(f"  Weights:  {_weights_path or 'data/weights/best_model.pth (default)'}")
    print(f"  Ctrl+C para detener\n")

    if not args.no_browser:
        import threading
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()

    uvicorn.run(api, host="0.0.0.0", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
