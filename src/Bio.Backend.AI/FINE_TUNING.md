# Guía de Fine-Tuning del Modelo CNN

## Proyecto: BioPlatform AI Service — Caldas, Colombia

Esta guía cubre todo lo necesario para hacer fine-tuning del modelo CNN de clasificación de especies, tanto de forma **local** (manual) como **automatizada** (servidor con GPU).

---

## Tabla de Contenidos

1. [Conceptos Clave](#1-conceptos-clave)
2. [Requisitos Previos](#2-requisitos-previos)
3. [Fine-Tuning Local (Recomendado para desarrollo)](#3-fine-tuning-local)
4. [Fine-Tuning Automatizado (Servidor)](#4-fine-tuning-automatizado)
5. [Comandos Recomendados por Hardware](#5-comandos-recomendados-por-hardware)
6. [Estructura de Directorios Versionados](#6-estructura-de-directorios-versionados)
7. [Activación del Modelo (Zero-Downtime)](#7-activación-del-modelo)
8. [Flujos Completos Paso a Paso](#8-flujos-completos)
9. [Troubleshooting](#9-troubleshooting)
10. [Referencia de API](#10-referencia-de-api)

---

## 1. Conceptos Clave

### ¿Qué es Fine-Tuning?

Fine-tuning es el proceso de **ajustar un modelo ya entrenado** con datos nuevos. En BioPlatform, esto ocurre cuando:

- Se validan nuevas imágenes de especies por expertos.
- Se agregan nuevas clases de especies al sistema.
- Se quiere mejorar la precisión en especies donde el modelo falla.

### Warm-Start vs. Training from Scratch

| Estrategia | Descripción | Cuándo usar |
|------------|-------------|-------------|
| **Warm-Start** *(default)* | Retoma desde el último checkpoint (modelo + optimizador + scheduler) | Siempre, excepto cambios de arquitectura |
| **From Scratch** | Inicia desde pesos de ImageNet | Cambio de arquitectura (ej: EfficientNet-B0 → B2) |

> **⚠️ Importante:** Warm-Start preserva el estado del optimizador Adam (momentos de primer y segundo orden). Sin esto, se produce un **spike de loss** en las primeras épocas.

### Replay Buffer (Anti-Olvido Catastrófico)

El sistema usa un **Replay Buffer** para evitar que el modelo olvide lo que ya aprendió:

- Se entrena con **100% de datos nuevos** + **15% de datos antiguos** (muestreo aleatorio estratificado).
- Proporción configurable vía `REPLAY_BUFFER_RATIO` (default: `0.15`).
- El script `03_organize_dataset.py` implementa el Replay Buffer cuando recibe un
  `--new-images-manifest` (generado por `02f_download_delta.py`).
- Sin manifiesto, se usa el comportamiento legacy (todas las imágenes).

### Pointer Swap (Zero-Downtime Reload)

Cuando se activa un modelo nuevo, **no se bloquea el servicio**:

1. El nuevo modelo se carga en un thread separado.
2. Cuando está listo en VRAM/RAM, se hace un **swap atómico** de la referencia.
3. El modelo anterior se libera de memoria.
4. Tiempo de inactividad: **~1 milisegundo**.

---

## 2. Requisitos Previos

### Hardware

```
Mínimo:  GPU con 4 GB VRAM (RTX 3060, GTX 1650 Ti)
Óptimo:  GPU con 8+ GB VRAM (RTX 3070, RTX 4070, A4000)
CPU:     Posible pero 10x más lento (no recomendado para fine-tuning)
```

### Software

```bash
# Python 3.11+
python --version

# PyTorch con CUDA (ajustar cu121 según tu versión de CUDA)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# Dependencias del proyecto
pip install -r requirements.txt

# Verificar GPU disponible
python -c "import torch; print(f'GPU: {torch.cuda.get_device_name(0)}' if torch.cuda.is_available() else 'No GPU')"
```

### Datos

```
data/
├── raw_images/           ← Imágenes organizadas por taxonomía
│   ├── Animalia/
│   │   └── Arthropoda/
│   │       └── Insecta/
│   │           └── Apidae/
│   │               └── Bombus_funebris/
│   │                   ├── img_001.jpg
│   │                   └── img_002.jpg
│   └── Plantae/
│       └── Tracheophyta/
│           └── Magnoliopsida/
│               └── Orchidaceae/
│                   └── Cattleya_trianae/
│                       └── img_003.jpg
├── processed/            ← Dataset listo para entrenar (lo genera 03_organize_dataset.py)
│   ├── train/
│   ├── val/
│   └── test/
├── dataset_analysis/     ← Manifiestos y análisis
│   └── delta_manifest.json  ← Generado por 02f_download_delta.py
└── weights/              ← Pesos del modelo (versionados)
    ├── best_model.pth    ← Modelo activo (flat layout de fallback/legacy)
    ├── training_config.json
    └── v1.0.20260517/    ← Versión específica
        ├── best_model.pth
        ├── checkpoint.pth
        ├── training_config.json
        ├── model.onnx
        ├── classification_report.txt  ← Reporte detallado de la evaluación
        ├── confusion_matrix.png       ← Matriz de confusión visual
        └── evaluation_metrics.json    ← Métricas completas en JSON

```

---

## 3. Fine-Tuning Local

### 3.1 Método Rápido (Script Automatizado)

El script `07_local_finetune.py` automatiza todo el pipeline:

```bash
# Fine-tuning con configuración por defecto (15 epochs, lr=1e-5, warm-start)
python scripts/cnn/07_local_finetune.py
```

Este comando ejecuta en secuencia:
0. ✅ Descargar imágenes nuevas validadas (Delta Download desde S3)
1. ✅ Organizar dataset (con Replay Buffer: 100% nuevas + 15% antiguas)
2. ✅ Entrenar modelo (warm-start desde último checkpoint)
3. ✅ Evaluar métricas (accuracy, F1, confusion matrix)
4. ✅ Exportar a ONNX

### 3.2 Opciones del Script Automatizado

```bash
# Fine-tuning con parámetros personalizados
python scripts/cnn/07_local_finetune.py \
    --epochs 20 \
    --lr 0.00005 \
    --batch-size 16 \
    --version v2.0

# Controlar el Replay Buffer
python scripts/cnn/07_local_finetune.py \
    --replay-ratio 0.25       # 25% de imágenes antiguas (default: 15%)

# Omitir pasos específicos
python scripts/cnn/07_local_finetune.py \
    --skip-download \         # Usar imágenes ya descargadas
    --skip-organize \         # Ya organizaste el dataset manualmente
    --skip-eval \             # No quieres evaluar aún
    --skip-onnx               # No necesitas ONNX

# Entrenar desde cero (sin warm-start)
python scripts/cnn/07_local_finetune.py \
    --no-warm-start \
    --model efficientnet_b2 \
    --epochs 50 \
    --lr 0.001
```

### 3.3 Método Manual (Control Total)

Si necesitas control paso a paso:

```bash
# Paso 0: Descargar imágenes nuevas validadas (Delta Download)
python scripts/dataset/02f_download_delta.py

# Paso 1: Organizar dataset con Replay Buffer
python scripts/dataset/03_organize_dataset.py --clean \
    --new-images-manifest data/dataset_analysis/delta_manifest.json \
    --replay-ratio 0.15

# Paso 2: Entrenar con warm-start
python scripts/cnn/04_train_cnn.py \
    --model efficientnet_b0 \
    --epochs 15 \
    --lr 0.00001 \
    --freeze-epochs 0 \
    --unfreeze-lr 0.00001 \
    --batch-size 32 \
    --output-dir data/weights/v1.0.20260517 \
    --resume-checkpoint data/weights/checkpoint.pth

# Paso 3: Evaluar (se auto-detecta la versión del modelo activo si no se pasa --weights-dir)
python scripts/cnn/05_evaluate_model.py \
    --batch-size 32 \
    --top-k 5

# O especificando un directorio manualmente (guarda los resultados en esa misma subcarpeta):
# python scripts/cnn/05_evaluate_model.py --weights-dir data/weights/v1.0.20260517


# Paso 4: Exportar ONNX
python scripts/cnn/06_export_onnx.py \
    --weights-dir data/weights/v1.0.20260517

# Paso 5: Registrar en DVC
dvc add data/weights/v1.0.20260517
git add data/weights/v1.0.20260517.dvc
git commit -m "chore(ai): fine-tuning v1.0.20260517"
dvc push
```

---

## 4. Fine-Tuning Automatizado

El flujo automatizado se activa desde el backend .NET:

```
Admin UI → .NET API → AI Microservice → Background Training → Webhook → .NET DB
```

### 4.1 Trigger desde Admin API

```bash
# Iniciar fine-tuning (requiere token de Admin)
curl -X POST http://localhost:5000/api/v1/ai/training/start \
    -H "Authorization: Bearer <JWT>" \
    -H "Content-Type: application/json" \
    -d '{
        "epochs": 15,
        "learningRate": 0.00001,
        "replayBufferRatio": 0.15
    }'
```

**Respuesta (202 Accepted):**
```json
{
    "jobId": "a1b2c3d4-...",
    "status": "Running",
    "message": "Fine-tuning started. Results will be sent via webhook."
}
```

### 4.2 Monitoreo

```bash
# Ver trabajos recientes
curl http://localhost:5000/api/v1/ai/training/jobs \
    -H "Authorization: Bearer <JWT>"

# Verificar hardware del servidor AI
curl http://localhost:5000/api/v1/ai/hardware \
    -H "Authorization: Bearer <JWT>"
```

### 4.3 Activación del Modelo Resultante

Cuando el fine-tuning termina, el sistema crea un registro `AiModelVersion` en la base de datos. Para activarlo:

```bash
# Listar versiones disponibles
curl http://localhost:5000/api/v1/ai/models \
    -H "Authorization: Bearer <JWT>"

# Activar una versión (trigger Pointer Swap)
curl -X POST http://localhost:5000/api/v1/ai/models/5/activate \
    -H "Authorization: Bearer <JWT>"
```

---

## 5. Comandos Recomendados por Hardware

### 🟢 GPU con 8+ GB VRAM (RTX 3070, RTX 4070, A4000+)

```bash
# Configuración agresiva — máximo rendimiento
python scripts/cnn/07_local_finetune.py \
    --epochs 25 \
    --lr 0.00003 \
    --batch-size 64
```

### 🟡 GPU con 4-6 GB VRAM (RTX 3060, GTX 1650 Ti)

```bash
# Configuración balanceada
python scripts/cnn/07_local_finetune.py \
    --epochs 15 \
    --lr 0.00001 \
    --batch-size 32
```

### 🟠 GPU con 2-4 GB VRAM (GTX 1050 Ti, MX450)

```bash
# Configuración conservadora
python scripts/cnn/07_local_finetune.py \
    --epochs 10 \
    --lr 0.00001 \
    --batch-size 16
```

### 🔴 Solo CPU (No recomendado)

```bash
# Muy lento, solo para emergencias
python scripts/cnn/07_local_finetune.py \
    --epochs 5 \
    --lr 0.00001 \
    --batch-size 8 \
    --skip-onnx
```

---

## 6. Estructura de Directorios Versionados

Cada fine-tuning crea un directorio con el formato `{PREFIX}.{TIMESTAMP}`:

```
data/weights/
├── best_model.pth              ← Modelo activo (flat, legacy/fallback)
├── training_config.json        ← Config del modelo activo
├── v1.0.20260501120000/        ← Versión 1 (entrenamiento inicial)
│   ├── best_model.pth          ← Mejores pesos (solo model_state_dict)
│   ├── checkpoint.pth          ← Checkpoint completo (model + optimizer + scheduler)
│   ├── training_config.json    ← Hiperparámetros y métricas
│   ├── training_history.json   ← Loss/accuracy por época
│   ├── model.onnx              ← Modelo exportado para inferencia
│   ├── classification_report.txt   ← Reporte detallado de métricas Precision/Recall/F1 por especie
│   ├── confusion_matrix.png        ← Matriz de confusión visual
│   ├── confusion_matrix.txt        ← Reporte de los 20 pares de especies más confundidos
│   ├── evaluation_metrics.json     ← Métricas globales y por clase en JSON (leído por FastAPI/Auditor)
│   ├── per_class_metrics.csv       ← Métricas de precisión en formato CSV
│   └── misclassified_samples.json  ← Top errores de clasificación de alta confianza
├── v1.0.20260510080000/        ← Versión 2 (primer fine-tuning)
│   ├── best_model.pth
│   ├── checkpoint.pth
│   └── ...
└── v1.0.20260517210000/        ← Versión 3 (fine-tuning más reciente)
    ├── best_model.pth
    ├── checkpoint.pth
    └── ...
```

### ¿Qué contiene cada archivo?

| Archivo | Contenido | Uso |
|---------|-----------|-----|
| `best_model.pth` | Solo `model_state_dict` | Inferencia en producción |
| `checkpoint.pth` | `model_state_dict` + `optimizer_state_dict` + `scheduler_state_dict` + `epoch` + `best_val_acc` | Warm-start del próximo fine-tuning |
| `training_config.json` | Arquitectura, num_classes, hiperparámetros, class_names, métricas | Reconstruir el modelo para evaluación |
| `training_history.json` | Loss y accuracy por época | Debugging, visualización del progreso |
| `model.onnx` | Modelo exportado a ONNX | Inferencia optimizada (opcional) |
| `classification_report.txt` | Precision, Recall, F1-Score agrupados por umbral de desempeño | Reporte legible de auditoría técnica |
| `confusion_matrix.png` | Heatmap visual de aciertos y confusiones del modelo | Análisis visual de confusiones |
| `confusion_matrix.txt` | Lista ordenada de los 20 pares más confundidos con su tasa y cantidad | Identificación de especies similares conflictivas |
| `evaluation_metrics.json` | Métricas globales y per-class completas en formato JSON estructurado | Servido por FastAPI en el endpoint `/api/v1/model-metrics` |
| `misclassified_samples.json` | Muestras del set de test mal clasificadas con sus rutas e índices de confianza | Auditoría fina de fallas visuales |


---

## 7. Activación del Modelo

### Método 1: Desde el Backend (.NET)

```bash
# 1. Verificar que la versión es segura
curl -X POST "http://localhost:5000/api/v1/ai/models/3/activate" \
    -H "Authorization: Bearer <JWT>"
# → Deactivate all → Activate v1.0.20260517 → Pointer Swap en AI service
```

### Método 2: Directo al AI Service (para desarrollo)

```bash
# Hot-reload de una versión específica
curl -X POST http://localhost:8000/api/v1/model/reload \
    -H "Content-Type: application/json" \
    -d '{"version": "v1.0.20260517210000"}'

# Version null/vacía == SUSPENDER: descarga el modelo y pausa la clasificación
# (/api/v1/classify devuelve 503). Lo usa el backend al desactivar/eliminar el activo.
curl -X POST http://localhost:8000/api/v1/model/reload \
    -H "Content-Type: application/json" \
    -d '{"version": null}'
```

### Método 3: Validar antes de activar

```bash
# Pre-activación: evalúa contra 50 imágenes de test
curl -X POST "http://localhost:8000/api/v1/model/validate?version=v1.0.20260517210000"
```

**Respuesta:**
```json
{
    "version": "v1.0.20260517210000",
    "accuracy": 0.88,
    "current_active_accuracy": 0.85,
    "accuracy_drop": 0.03,
    "is_safe_to_activate": true,
    "message": "Validation accuracy: 88.0% on 50 test images."
}
```

> Si `accuracy_drop` es negativo y supera el umbral (`VALIDATION_ACCURACY_DROP_THRESHOLD`), se muestra una **advertencia** y requiere confirmación manual.

---

## 8. Flujos Completos

### Flujo A: "Tengo imágenes nuevas y quiero mejorar el modelo"

```bash
# 1. Colocar imágenes en data/raw_images/{nombre_especie}/
#    Ejemplo: data/raw_images/Quercus_humboldtii/foto_001.jpg

# 2. Ejecutar fine-tuning automático
python scripts/cnn/07_local_finetune.py --epochs 15

# 3. Revisar métricas
cat data/weights/v1.0.*/training_config.json | python -m json.tool | grep best_val_accuracy

# 4. Si las métricas son buenas, activar
curl -X POST http://localhost:8000/api/v1/model/reload \
    -d '{"version": "v1.0.20260517210000"}'

# 5. Subir a DVC
dvc add data/weights/v1.0.20260517210000
dvc push
git add -A && git commit -m "feat(ai): fine-tuning v1.0.20260517"
```

### Flujo B: "Quiero cambiar la arquitectura del modelo"

```bash
# 1. Entrenar desde cero con nueva arquitectura
python scripts/cnn/07_local_finetune.py \
    --no-warm-start \
    --model efficientnet_b2 \
    --epochs 50 \
    --lr 0.001 \
    --version v2.0

# 2. Comparar con el modelo activo
python scripts/cnn/05b_compare_models.py

# 3. Si es mejor, activar
curl -X POST http://localhost:8000/api/v1/model/reload \
    -d '{"version": "v2.0"}'
```

### Flujo C: "El servidor hace fine-tuning automático"

```
1. Investigadores suben y validan imágenes vía la app web
2. Admin inicia fine-tuning desde el dashboard:
   POST /api/v1/ai/training/start
3. El backend crea AiTrainingJob → llama al AI service
4. El AI service entrena en background:
   Step 1: Delta Download (descarga imágenes nuevas validadas de S3)
   Step 2: Replay Buffer (100% nuevas + 15% antiguas)
   Step 3: Organizar dataset (split train/val/test)
   Step 4: Warm-start desde último checkpoint
   Step 5: Entrenar modelo
   Step 6: Evaluar métricas
   Step 7: Exportar ONNX
   Step 8: DVC push
5. Al terminar, notifica al backend vía webhook:
   POST /api/webhooks/ai/training-completed
6. El backend crea AiModelVersion en PostgreSQL
7. Admin revisa métricas y activa si es satisfactorio:
   POST /api/v1/ai/models/{id}/activate
8. El backend llama al AI service para Pointer Swap:
   POST /api/v1/model/reload
```

---

## 9. Troubleshooting

### "CUDA out of memory"

```bash
# Reducir batch size
python scripts/cnn/07_local_finetune.py --batch-size 16

# Si aún falla, liberar VRAM
python -c "import torch; torch.cuda.empty_cache()"

# Verificar uso de VRAM
nvidia-smi
```

### "El modelo empeoró después del fine-tuning"

Posibles causas:
1. **Learning rate muy alto** — Reducir a `0.000005` o `0.000001`
2. **Datos ruidosos** — Verificar que las imágenes nuevas estén correctamente etiquetadas
3. **Overfitting** — Reducir epochs o agregar más datos al Replay Buffer

```bash
# Aumentar Replay Buffer (más datos antiguos)
REPLAY_BUFFER_RATIO=0.30 python scripts/cnn/07_local_finetune.py

# Usar learning rate más conservador
python scripts/cnn/07_local_finetune.py --lr 0.000005 --epochs 10
```

### "No se encuentra el checkpoint para warm-start"

```bash
# Verificar qué checkpoints existen
ls data/weights/*/checkpoint.pth 2>/dev/null || echo "No versioned checkpoints"
ls data/weights/checkpoint.pth 2>/dev/null || echo "No flat checkpoint"

# Entrenar desde cero si no hay checkpoint
python scripts/cnn/07_local_finetune.py --no-warm-start
```

### "El webhook no llega al backend .NET"

```bash
# Verificar que el AI service puede contactar al backend
curl -X POST http://bio-backend-api:5000/api/webhooks/ai/training-completed \
    -H "Content-Type: application/json" \
    -d '{"jobId": "test", "status": "Completed", "statusMessage": "test"}'

# Verificar configuración en .env
grep DOTNET_WEBHOOK_URL .env
```

---

## 10. Referencia de API

### AI Service (Python — FastAPI)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health/liveness` | Proceso vivo (siempre 200) |
| `GET` | `/health/readiness` | Modelo cargado + DB conectada |
| `GET` | `/health/startup` | Modelo terminó de cargar |
| `GET` | `/api/v1/system/hardware` | Estado GPU/VRAM |
| `POST` | `/api/v1/training/finetune` | Iniciar fine-tuning (202) |
| `POST` | `/api/v1/model/upload` | Subir modelo manual (202) |
| `POST` | `/api/v1/model/reload` | Hot-reload (Pointer Swap) |
| `POST` | `/api/v1/model/validate` | Validar antes de activar |

### Backend .NET (Admin)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/api/v1/ai/hardware` | Admin | Estado GPU (proxy a AI) |
| `GET` | `/api/v1/ai/models` | Admin | Listar todas las versiones |
| `GET` | `/api/v1/ai/models/active` | Admin | Modelo activo actual |
| `POST` | `/api/v1/ai/models/{id}/activate` | Admin | Activar versión + reload |
| `POST` | `/api/v1/ai/models/{id}/deactivate` | Admin | Desactivar versión + suspender AI |
| `DELETE` | `/api/v1/ai/models/{id}` | Admin | Soft-delete versión (suspende si era activa) |
| `GET` | `/api/v1/ai/training/jobs` | Admin | Trabajos recientes |
| `POST` | `/api/v1/ai/training/start` | Admin | Iniciar fine-tuning |
| `POST` | `/api/webhooks/ai/training-completed` | Internal | Webhook de AI service |

### Variables de Entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `REPLAY_BUFFER_RATIO` | `0.15` | Proporción de datos antiguos en Replay Buffer |
| `DATASET_SPLIT_SEED` | `42` | Semilla para splits reproducibles del dataset |
| `S3_BUCKET_NAME` | `bioplatform-public` | Nombre del bucket público S3 |
| `PREFIX_AI_VERSION` | `v1.0` | Prefijo para tags de versión |
| `MIN_VRAM_GB` | `4.0` | VRAM mínima para permitir training |
| `FINETUNE_DEFAULT_EPOCHS` | `15` | Épocas por defecto |
| `FINETUNE_DEFAULT_LR` | `0.00001` | Learning rate por defecto |
| `VALIDATION_ACCURACY_DROP_THRESHOLD` | `0.05` | Máxima caída aceptable de accuracy |
| `DOTNET_WEBHOOK_URL` | `http://...` | URL del webhook en el backend .NET |
| `DOTNET_API_BASE_URL` | `http://...` | URL base del backend .NET |
| `DVC_REMOTE_NAME` | `myremote` | Nombre del remote de DVC |

---

## Referencia Rápida

```bash
# ─── Fine-tuning rápido (lo más común) ──────────────────
python scripts/cnn/07_local_finetune.py

# ─── Con parámetros personalizados ──────────────────────
python scripts/cnn/07_local_finetune.py --epochs 20 --lr 0.00005

# ─── Sin delta download (imágenes ya locales) ───────────
python scripts/cnn/07_local_finetune.py --skip-download

# ─── Solo organizar y entrenar (sin descarga ni export) ─
python scripts/cnn/07_local_finetune.py --skip-download --skip-onnx

# ─── Desde cero con otra arquitectura ──────────────────
python scripts/cnn/07_local_finetune.py --no-warm-start --model efficientnet_b2 --epochs 50

# ─── Solo Delta Download (sin entrenar) ─────────────────
python scripts/dataset/02f_download_delta.py
python scripts/dataset/02f_download_delta.py --dry-run  # Solo calcular, no descargar

# ─── Recargar modelo en el servicio ─────────────────────
curl -X POST http://localhost:8000/api/v1/model/reload -d '{"version": "v1.0.20260517"}'

# ─── Verificar GPU disponible ──────────────────────────
curl http://localhost:8000/api/v1/system/hardware
```
