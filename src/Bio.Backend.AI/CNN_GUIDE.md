# Guía Completa: CNN para Clasificación de Especies - BioPlatform Caldas

## Tabla de Contenidos

1. [Visión General](#1-visión-general)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Estructura del Pipeline](#3-estructura-del-pipeline)
4. [Paso 1: Análisis del Dataset](#4-paso-1-análisis-del-dataset)
5. [Paso 2: Descarga de Imágenes](#5-paso-2-descarga-de-imágenes)
6. [Paso 3: Organización del Dataset](#6-paso-3-organización-del-dataset)
7. [Paso 3.5: Prueba Rápida del Pipeline (Opcional)](#7-paso-35-prueba-rápida-del-pipeline-opcional)
8. [Paso 4: Entrenamiento del Modelo](#8-paso-4-entrenamiento-del-modelo)
9. [Paso 5: Evaluación](#9-paso-5-evaluación)
10. [Paso 6: Integración con FastAPI](#10-paso-6-integración-con-fastapi)
11. [Paso 7: Uso del Endpoint de Clasificación](#11-paso-7-uso-del-endpoint-de-clasificación)
12. [Arquitectura de la CNN](#12-arquitectura-de-la-cnn)
13. [Troubleshooting](#13-troubleshooting)
14. [Métricas y Documentación](#14-métricas-y-documentación)

---

## 1. Visión General

Este pipeline implementa un sistema de **identificación automática de especies** mediante **Transfer Learning** con redes neuronales convolucionales (CNN), utilizando datos de biodiversidad de **Caldas, Colombia** obtenidos de GBIF/iNaturalist.

### Objetivos del Proyecto
- Clasificar **300+ especies** de flora y fauna de Caldas
- Precisión objetivo: **>85%** (requerimiento del proyecto)
- Dataset: **10,000+ imágenes** (disponibles ~44,000 URLs de iNaturalist)
- Modelo: **EfficientNet-B0** (default) o **ResNet50**

### Flujo del Pipeline

```
┌─────────────────┐    ┌────────────────┐    ┌──────────────────┐
│  01_analyze     │───>│  02_download   │───>│  03_organize     │
│  (Parse GBIF)   │    │  (Get images)  │    │  (Train/Val/Test)│
└─────────────────┘    └────────────────┘    └──────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐    ┌────────────────┐    ┌──────────────────┐
│  FastAPI API    │<───│  05_evaluate   │<───│  04_train_cnn    │
│  /api/v1/classify│   │  (Metrics)     │    │  (Transfer Learn)│
└─────────────────┘    └────────────────┘    └──────────────────┘
```

### Dataset Source
- **GBIF Darwin Core Archive** de iNaturalist Research-grade observations
- Ubicación: `Bio.Backend.AI/dataset-metadata/`
- Archivos clave:
  - `occurrence.txt` → ~24,472 registros de ocurrencias con taxonomía completa
  - `multimedia.txt` → ~44,263 URLs de imágenes de iNaturalist

---

## 2. Requisitos Previos

### 2.1 Entorno Python

```bash
# Desde la raíz del proyecto
cd src/Bio.Backend.AI

# Crear y activar virtualenv
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate
```

### 2.2 Instalar Dependencias

```bash
# Dependencias base
pip install -r requirements.txt

# PyTorch con GPU (CUDA 12.1):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# PyTorch con GPU (CUDA 12.4):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124

# PyTorch solo CPU:
pip install torch torchvision
```

### 2.3 Verificar GPU (Opcional pero recomendado)

```python
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
```

> **Nota:** El entrenamiento funciona en CPU pero será ~10x más lento. Se recomienda GPU con ≥4 GB VRAM.

### 2.4 Espacio en Disco
- Imágenes descargadas: ~5-15 GB (dependiendo de filtros)
- Dataset procesado: ~3-8 GB
- Modelo entrenado: ~20-100 MB

---

## 3. Estructura del Pipeline

```
Bio.Backend.AI/
├── scripts/                          # Pipeline de entrenamiento
│   ├── 01_analyze_dataset.py         # Analizar GBIF data
│   ├── 02_download_images.py         # Descargar imágenes
│   ├── 03_organize_dataset.py        # Split train/val/test
│   ├── 04_train_cnn.py              # Entrenar modelo
│   ├── 05_evaluate_model.py         # Evaluar métricas
│   └── 06_export_onnx.py           # Exportar a ONNX (opcional)
│
├── app/                              # FastAPI Service
│   ├── main.py                       # Entry point
│   ├── api/
│   │   └── v1_classify.py           # POST /api/v1/classify
│   ├── models/
│   │   └── vision.py                # Pydantic schemas
│   └── services/
│       └── vision/
│           └── classifier.py        # SpeciesClassifier service
│
├── data/                             # Datos generados
│   ├── dataset_analysis/            # Análisis (CSVs, JSONs)
│   ├── raw_images/                  # Imágenes descargadas
│   │   └── Kingdom/Phylum/Class/Family/Species/
│   ├── processed/                   # Dataset listo para entrenar
│   │   ├── train/Species_name/
│   │   ├── val/Species_name/
│   │   ├── test/Species_name/
│   │   ├── class_mapping.json
│   │   └── class_info.json
│   ├── weights/                     # Modelos entrenados
│   │   ├── best_model.pth
│   │   ├── training_config.json
│   │   └── training_history.json
│   └── evaluation/                  # Métricas de evaluación
│       ├── classification_report.txt
│       ├── confusion_matrix.png
│       └── evaluation_metrics.json
│
└── dataset-metadata/                 # GBIF Darwin Core Archive
    ├── occurrence.txt
    ├── multimedia.txt
    └── meta.xml
```

---

## 4. Paso 1: Análisis del Dataset

Este script parsea el archive de GBIF y genera estadísticas sobre las especies disponibles.

### Ejecutar

```bash
cd src/Bio.Backend.AI
python scripts/01_analyze_dataset.py
```

### ¿Qué hace?
1. Parsea `occurrence.txt` (24,472 registros) → taxonomía por observación
2. Parsea `multimedia.txt` (44,263 URLs) → imágenes por observación
3. Cruza datos por `gbifID` para saber cuántas imágenes tiene cada especie
4. Filtra solo registros a nivel SPECIES/SUBSPECIES
5. Genera:
   - `species_summary.csv` → Resumen por especie
   - `species_with_urls.json` → Datos + URLs (usado por script 02)
   - `taxonomy_tree.json` → Árbol taxonómico completo
   - `stats_report.txt` → Reporte legible con estadísticas
   - `class_distribution.png` → Gráfico de distribución por clase

### Salida esperada

```
  Total de especies únicas:          ~1,200+
  Total de registros de ocurrencia:  ~20,000+
  Total de imágenes disponibles:     ~40,000+
  
  APTITUD PARA CNN (mín. imágenes por especie):
    ≥10 imágenes: ~400 especies
    ≥20 imágenes: ~250 especies
    ≥50 imágenes: ~100 especies
```

### Revisar el Reporte

Revisa `data/dataset_analysis/stats_report.txt` para decidir:
- **¿Cuántas especies incluir?** → Ajustar `--min-images` en scripts 02 y 03
- **¿Qué reinos predominan?** → Animalia vs Plantae vs Fungi
- **¿Hay suficientes imágenes por clase?** → Mínimo 10 para CNN, ideal 20+

---

## 5. Paso 2: Descarga de Imágenes

Descarga imágenes desde iNaturalist S3 organizadas por taxonomía.

### Ejecutar

```bash
# Descargar especies con ≥10 imágenes, máximo 150 por especie
python scripts/02_download_images.py --min-images 10 --max-per-species 150 --workers 6

# Para un dataset más selectivo (mejores resultados con menos datos):
python scripts/02_download_images.py --min-images 20 --max-per-species 100 --workers 8

# Reanudar descarga interrumpida:
python scripts/02_download_images.py --min-images 10 --resume
```

### Parámetros

| Parámetro | Default | Descripción |
|---|---|---|
| `--min-images` | 10 | Mínimo de imágenes que debe tener una especie |
| `--max-per-species` | 150 | Máximo de imágenes a descargar por especie |
| `--workers` | 6 | Hilos de descarga paralelos |
| `--image-size` | 512 | Tamaño de imagen (descarga versión "medium" de iNat) |
| `--resume` | False | Reanudar desde descarga anterior |

### ¿Qué hace?
1. Lee `species_with_urls.json` generado por script 01
2. Filtra especies con ≥ N imágenes
3. Descarga con ThreadPool (6 workers por defecto)
4. Valida cada imagen (no corrupta, formato correcto)
5. Convierte a RGB JPEG, redimensiona a 512px
6. Organiza en: `data/raw_images/Kingdom/Phylum/Class/Family/Species_name/`
7. Genera `download_manifest.json` para soporte de resume

### Estructura de salida

```
data/raw_images/
├── Animalia/
│   ├── Arthropoda/
│   │   └── Insecta/
│   │       ├── Apidae/
│   │       │   └── Bombus_funebris/
│   │       │       ├── 0001_a3f2b1c4.jpg
│   │       │       ├── 0002_7e8d9f0a.jpg
│   │       │       ...
│   │       └── Nymphalidae/
│   │           └── Heliconius_charithonia/
│   │               ...
│   └── Chordata/
│       └── Aves/
│           ├── Cardinalidae/
│           │   └── Piranga_rubra/
│           ...
├── Plantae/
│   └── Tracheophyta/
│       ├── Magnoliopsida/
│       │   └── Onagraceae/
│       │       └── Fuchsia_boliviana/
│       ...
```

### Tiempos estimados
- ~400 especies × ~50 imgs = ~20,000 imágenes ≈ **1-3 horas** (6 workers)
- ~250 especies × ~100 imgs = ~25,000 imágenes ≈ **2-4 horas**

> **Tip:** Si la descarga falla, usa `--resume` para continuar donde se quedó.

---

## 6. Paso 3: Organización del Dataset

Divide las imágenes descargadas en splits `train/val/test` con validación.

### Ejecutar

```bash
# Split estándar: 80/10/10, mínimo 10 imágenes por especie
python scripts/03_organize_dataset.py --min-images 10

# Más estricto: solo especies con ≥20 imágenes
python scripts/03_organize_dataset.py --min-images 20

# Limpiar y re-organizar desde cero:
python scripts/03_organize_dataset.py --min-images 10 --clean
```

### ¿Qué genera?

```
data/processed/
├── train/                    # 80% de imágenes
│   ├── Bombus_funebris/
│   ├── Cattleya_trianae/
│   ├── Piranga_rubra/
│   ...
├── val/                      # 10% de imágenes
│   ├── Bombus_funebris/
│   ...
├── test/                     # 10% de imágenes
│   ├── Bombus_funebris/
│   ...
├── class_mapping.json        # { "Bombus funebris": 0, ... }
├── idx_to_class.json         # { "0": "Bombus funebris", ... }
├── class_info.json           # Taxonomía + conteos por clase
└── dataset_stats.json        # Estadísticas completas del split
```

### Archivos clave generados

**`class_mapping.json`** — Mapeo especie → índice numérico (usado por CNN)
```json
{
  "Bombus funebris": 0,
  "Cattleya trianae": 1,
  "Piranga rubra": 2,
  ...
}
```

**`class_info.json`** — Metadata taxonómica por clase (usado por API)
```json
{
  "Bombus funebris": {
    "class_idx": 0,
    "kingdom": "Animalia",
    "phylum": "Arthropoda",
    "class": "Insecta",
    "family": "Apidae",
    "train_count": 40,
    "val_count": 5,
    "test_count": 5
  }
}
```

---

## 7. Paso 3.5: Prueba Rápida del Pipeline (Opcional)

Antes de entrenar con las ~800 especies completas, se recomienda hacer una **prueba de punta a punta** con un subconjunto pequeño para validar que todo funciona correctamente.

### ¿Por qué hacer esto?

- Verificar que las imágenes se descargaron correctamente
- Confirmar que el modelo entrena sin errores de runtime
- Validar que la evaluación genera métricas correctamente
- Detectar problemas de configuración (CUDA, dependencias, rutas)
- **Tiempo total: ~5 minutos** vs ~30 min del entrenamiento completo

### Ejecutar prueba con 10 especies

```bash
# 1. Organizar solo las top 10 especies (las que tienen más imágenes)
python scripts/03_organize_dataset.py --min-images 10 --max-species 10 --clean

# 2. Entrenar con pocos epochs (~2-3 min en GPU)
python scripts/04_train_cnn.py --epochs 10 --batch-size 32

# 3. Evaluar
python scripts/05_evaluate_model.py
```

### Qué esperar

| Métrica | Prueba (10 especies) | Completo (800+ especies) |
|---|---|---|
| Clases | 10 | ~800 |
| Imágenes train | ~2,400 | ~27,000 |
| Tiempo entrenamiento | ~2-3 min | ~20-30 min |
| Accuracy esperada | ~70-90% | ~60-85% |

> **Nota:** La accuracy con 10 especies será más alta que con 800 porque el problema es mucho más simple. Esto es normal. El objetivo de esta prueba es validar que el pipeline funciona, no obtener un modelo definitivo.

### Si la prueba funciona correctamente

Procede a entrenar con el dataset completo:

```bash
# Reorganizar con todas las especies elegibles
python scripts/03_organize_dataset.py --min-images 10 --clean

# Entrenamiento completo
python scripts/04_train_cnn.py
```

### Parámetro `--max-species`

| Valor | Comportamiento |
|---|---|
| `0` (default) | Incluye todas las especies que cumplan `--min-images` |
| `10` | Solo las 10 especies con más imágenes |
| `50` | Las top 50 por cantidad de imágenes |
| `100` | Las top 100, buen balance para pruebas intermedias |

---

## 8. Paso 4: Entrenamiento del Modelo

### 8.1 Entrenamiento Estándar

```bash
# EfficientNet-B0 (recomendado, rápido y preciso)
python scripts/04_train_cnn.py \
  --model efficientnet_b0 \
  --epochs 50 \
  --batch-size 32 \
  --lr 0.001 \
  --freeze-epochs 5 \
  --unfreeze-lr 0.0001 \
  --patience 10 \
  --image-size 224

# ResNet50 (alternativa más pesada)
python scripts/04_train_cnn.py \
  --model resnet50 \
  --epochs 50 \
  --batch-size 16 \
  --lr 0.001 \
  --freeze-epochs 5 \
  --patience 10
```

### 8.2 Estrategia de Transfer Learning (2 Fases)

El entrenamiento usa una estrategia de **Transfer Learning en 2 fases**:

#### Fase 1: Head Only (Epochs 1-5)
- El **backbone** (capas convolucionales preentrenadas en ImageNet) está **congelado**
- Solo se entrena la **capa clasificadora** (fully connected)
- Learning Rate alto: `0.001`
- Objetivo: aprender la capa final rápidamente

#### Fase 2: Fine-tuning Completo (Epochs 6-50)
- Se **descongelan** todas las capas
- Learning Rate bajo: `0.0001` con **Cosine Annealing**
- El modelo ajusta las features del backbone para especies específicas
- Early Stopping si no mejora en 10 epochs

### 8.3 Parámetros del Entrenamiento

| Parámetro | Default | Descripción |
|---|---|---|
| `--model` | efficientnet_b0 | Arquitectura: efficientnet_b0, efficientnet_b2, resnet50, resnet101 |
| `--epochs` | 50 | Épocas totales máximas |
| `--batch-size` | 32 | Tamaño de batch (reducir si VRAM insuficiente) |
| `--lr` | 0.001 | LR para Phase 1 (head only) |
| `--freeze-epochs` | 5 | Épocas con backbone congelado |
| `--unfreeze-lr` | 0.0001 | LR para Phase 2 (fine-tuning) |
| `--patience` | 10 | Early stopping patience |
| `--image-size` | 224 | Tamaño de entrada (224 para EfficientNet/ResNet) |
| `--label-smoothing` | 0.1 | Label smoothing para regularización |

### 8.4 Data Augmentation

El pipeline aplica las siguientes transformaciones durante entrenamiento:

```
Train:
  → RandomResizedCrop(224, scale=0.7-1.0)   # Recorte aleatorio
  → RandomHorizontalFlip(p=0.5)             # Volteo horizontal
  → RandomVerticalFlip(p=0.1)               # Volteo vertical (leve)
  → RandomRotation(±15°)                    # Rotación leve
  → ColorJitter(brightness, contrast, sat)   # Variación de color
  → RandomAffine(translate=0.1)             # Traslación
  → RandomGrayscale(p=0.05)                 # Escala de grises
  → RandomErasing(p=0.1)                    # Borrado aleatorio

Val/Test:
  → Resize(256) → CenterCrop(224) → Normalize(ImageNet)
```

### 8.5 Manejo de Desbalance de Clases

- **WeightedRandomSampler**: sobremuestrea clases minoritarias
- **Label Smoothing**: 0.1 para evitar sobreconfianza

### 8.6 Salida del Entrenamiento

```
data/weights/
├── best_model.pth           # Mejores pesos (por val_accuracy)
├── final_model.pth          # Pesos al final del entrenamiento
├── training_config.json     # Configuración completa
└── training_history.json    # Loss y accuracy por época
```

### 8.7 Tiempos Estimados

| GPU | ~300 clases / 50 epochs | ~150 clases / 50 epochs |
|---|---|---|
| RTX 3060 (12GB) | ~2-3 horas | ~1-2 horas |
| RTX 4070 | ~1-2 horas | ~45 min |
| CPU (i7) | ~12-20 horas | ~6-10 horas |

---

## 9. Paso 5: Evaluación

```bash
python scripts/05_evaluate_model.py --top-k 5
```

### Métricas Generadas

| Archivo | Contenido |
|---|---|
| `classification_report.txt` | Precision, Recall, F1 por clase + macro/weighted avg |
| `evaluation_metrics.json` | Todas las métricas en formato JSON (para CI/CD) |
| `confusion_matrix.png` | Heatmap de confusion matrix (o texto si >30 clases) |
| `per_class_metrics.csv` | CSV con métricas por clase |
| `misclassified_samples.json` | Top 50 errores con mayor confianza |

### Interpretación

```
  Overall Accuracy:   0.XXXX (XX.X%)
  Top 5 Accuracy:     0.XXXX (XX.X%)
  Target >85%:        ✅ PASSED / ⚠️ BELOW TARGET
```

- **Accuracy >85%**: Cumple requerimiento
- **Top-5 Accuracy >95%**: La especie correcta está en los 5 primeros
- **Revisar `misclassified_samples.json`**: Identifica patrones de confusión
- **Macro F1 vs Weighted F1**: Si hay gran diferencia, hay desbalance

---

## 10. Paso 6: Integración con FastAPI

### Arquitectura del Servicio

```
Request (Image) → FastAPI Controller → SpeciesClassifier Service → CNN Model
     │                  │                        │
     │           v1_classify.py          classifier.py         best_model.pth
     │           (Thin Controller)       (Business Logic)      (Trained Weights)
     │                  │                        │
     └──── Response (Pydantic)  ←────────────────┘
```

### Iniciar el Servicio

```bash
cd src/Bio.Backend.AI

# Development (con hot-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Al iniciar, el modelo se carga automáticamente en el evento `lifespan`.

### Endpoints Disponibles

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/v1/classify` | Clasificar imagen de especie |
| `GET` | `/api/v1/model-info` | Metadata del modelo |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI (documentación interactiva) |

---

## 11. Paso 7: Uso del Endpoint de Clasificación

### 11.1 Con cURL

```bash
curl -X POST "http://localhost:8000/api/v1/classify?top_k=5" \
  -F "file=@mi_especie.jpg" \
  -H "accept: application/json"
```

### 11.2 Con Python

```python
import requests

url = "http://localhost:8000/api/v1/classify"
files = {"file": ("especie.jpg", open("especie.jpg", "rb"), "image/jpeg")}
params = {"top_k": 5, "confidence_threshold": 0.01}

response = requests.post(url, files=files, params=params)
result = response.json()

for pred in result["predictions"]:
    print(f"  {pred['rank']}. {pred['species']} ({pred['confidence']:.1%})")
    print(f"     Familia: {pred['taxonomy']['family']}")
```

### 11.3 Respuesta de Ejemplo

```json
{
  "predictions": [
    {
      "species": "Cattleya trianae",
      "confidence": 0.9234,
      "rank": 1,
      "taxonomy": {
        "kingdom": "Plantae",
        "phylum": "Tracheophyta",
        "class": "Liliopsida",
        "order": "Asparagales",
        "family": "Orchidaceae",
        "genus": "Cattleya",
        "iucn_status": "VU"
      }
    },
    {
      "species": "Cattleya warscewiczii",
      "confidence": 0.0412,
      "rank": 2,
      "taxonomy": { ... }
    }
  ],
  "model": "efficientnet_b0",
  "num_classes": 312
}
```

### 11.4 Desde el Frontend (React/Next.js)

```typescript
// services/aiService.ts
import { apiClient } from '@/lib/axios';

export interface ClassificationResult {
  predictions: {
    species: string;
    confidence: number;
    rank: number;
    taxonomy: {
      kingdom: string;
      phylum: string;
      class: string;
      order: string;
      family: string;
      genus: string;
      iucn_status: string;
    };
  }[];
  model: string;
  num_classes: number;
}

export async function classifySpeciesImage(
  file: File,
  topK: number = 5,
): Promise<ClassificationResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ClassificationResult>(
    `/ai/api/v1/classify?top_k=${topK}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}
```

---

## 12. Arquitectura de la CNN

### EfficientNet-B0 (Modelo por defecto)

```
Input Image (224×224×3)
    │
    ▼
┌─────────────────────────┐
│  EfficientNet-B0        │  ← Pretrained on ImageNet (1.2M images)
│  (Backbone - Features)  │
│  7 MBConv Blocks        │     Frozen in Phase 1
│  ~4M parameters         │     Fine-tuned in Phase 2
└─────────────────────────┘
    │
    ▼ (1280-dim feature vector)
┌─────────────────────────┐
│  Classification Head    │
│  Dropout(0.3)           │  ← Regularization
│  Linear(1280 → N)       │  ← N = number of species
└─────────────────────────┘
    │
    ▼
  Softmax → Probabilities per species
```

### ¿Por qué EfficientNet-B0?
1. **Eficiente**: Solo ~5.3M parámetros (vs ~25.6M de ResNet50)
2. **Preciso**: State-of-the-art accuracy/compute trade-off
3. **Rápido**: Inferencia ~10ms en GPU, ~50ms en CPU
4. **Ideal para Transfer Learning** en datasets pequeños/medianos

---

## 13. Troubleshooting

### Error: CUDA out of memory
```bash
# Reducir batch size
python scripts/04_train_cnn.py --batch-size 16

# O usar un modelo más pequeño
python scripts/04_train_cnn.py --model efficientnet_b0 --batch-size 16
```

### Error: PIL.UnidentifiedImageError
Imágenes corruptas se filtran automáticamente en el script 03. Si persiste:
```bash
# Re-organizar limpiando
python scripts/03_organize_dataset.py --clean
```

### Accuracy baja (<70%)
1. **Más imágenes**: Subir `--max-per-species 200` en script 02
2. **Menos clases**: Subir `--min-images 20` en script 03
3. **Más epochs**: `--epochs 80 --patience 15`
4. **Modelo más grande**: `--model efficientnet_b2`

### Modelo no carga en FastAPI
```
WARNING: CNN model weights not found
```
→ Asegúrate de que `data/weights/best_model.pth` y `data/weights/training_config.json` existen.

### Descarga interrumpida
```bash
python scripts/02_download_images.py --resume
```

---

## 14. Métricas y Documentación

### Para la Entrega del Proyecto

Los siguientes archivos se generan automáticamente para documentación:

| Entregable | Archivo | Ubicación |
|---|---|---|
| Métricas del modelo | `evaluation_metrics.json` | `data/evaluation/` |
| Classification Report | `classification_report.txt` | `data/evaluation/` |
| Confusion Matrix | `confusion_matrix.png` | `data/evaluation/` |
| Configuración de entrenamiento | `training_config.json` | `data/weights/` |
| Historial de entrenamiento | `training_history.json` | `data/weights/` |
| Distribución del dataset | `dataset_stats.json` | `data/processed/` |
| Análisis taxonómico | `species_summary.csv` | `data/dataset_analysis/` |
| Swagger API Docs | `/docs` | http://localhost:8000/docs |

### Commit Convention

```bash
git add scripts/ app/services/vision/ app/api/v1_classify.py app/models/vision.py
git commit -m "feat(vision): implement CNN species classification pipeline

- Add GBIF dataset analysis script (01_analyze_dataset.py)
- Add iNaturalist image downloader with resume (02_download_images.py)
- Add dataset split organizer (03_organize_dataset.py)
- Add EfficientNet-B0 training with transfer learning (04_train_cnn.py)
- Add comprehensive evaluation with metrics (05_evaluate_model.py)
- Add SpeciesClassifier inference service
- Add POST /api/v1/classify FastAPI endpoint
- Add Pydantic models for vision API"
```

### Comando Rápido Completo (Pipeline end-to-end)

```bash
cd src/Bio.Backend.AI

# 1. Analizar dataset
python scripts/01_analyze_dataset.py

# 2. Descargar imágenes (esto toma horas)
python scripts/02_download_images.py --min-images 10 --max-per-species 150 --workers 6

# 3. Organizar en train/val/test
python scripts/03_organize_dataset.py --min-images 10

# 3.5 (Opcional) Prueba rápida con 10 especies antes de entrenar todo
python scripts/03_organize_dataset.py --min-images 10 --max-species 10 --clean
python scripts/04_train_cnn.py --epochs 10 --batch-size 32
python scripts/05_evaluate_model.py
# Si todo funciona, reorganizar con todas las especies:
python scripts/03_organize_dataset.py --min-images 10 --clean

# 4. Entrenar (GPU recomendada)
python scripts/04_train_cnn.py --model efficientnet_b0 --epochs 50 --batch-size 32

# 5. Evaluar
python scripts/05_evaluate_model.py

# 6. Iniciar API
uvicorn app.main:app --reload --port 8000

# 7. Probar
curl -X POST "http://localhost:8000/api/v1/classify" -F "file=@test_image.jpg"
```

---

## Notas de Seguridad

- **Nunca hardcodear API keys** en scripts. Usar `.env`.
- Las imágenes de iNaturalist son CC BY-NC 4.0 — solo para uso académico/no-comercial.
- Recordar la regla de `is_sensitive`: al integrar con el catálogo, **enmascarar coordenadas** de especies amenazadas (solo devolver municipio).
- Los pesos del modelo (`best_model.pth`) contienen conocimiento derivado del dataset — incluir en `.gitignore` si es >100MB.
