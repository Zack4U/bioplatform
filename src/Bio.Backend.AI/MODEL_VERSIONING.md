# Guía de Manejo de Pesos del Modelo CNN (.pth)

## Proyecto: BioPlatform AI Service — Caldas, Colombia

Esta guía explica cómo guardar, versionar, distribuir y restaurar los archivos de pesos del modelo CNN (`.pth`) que **no se almacenan en Git** debido a su tamaño (~200-500 MB).

---

## 1. ¿Qué es un archivo `.pth`?

Un archivo `.pth` (PyTorch) contiene los **pesos entrenados** de la red neuronal. Es el resultado del proceso de entrenamiento y lo que permite al modelo clasificar imágenes de especies.

**Archivos clave en `data/weights/`:**

| Archivo | Descripción | Tamaño aprox. |
|---------|-------------|---------------|
| `best_model.pth` | Mejor modelo según validación (el que se usa en producción) | 200-400 MB |
| `final_model.pth` | Último checkpoint del entrenamiento | 200-400 MB |
| `swa_model.pth` | Modelo con Stochastic Weight Averaging | 200-400 MB |
| `training_config.json` | Metadatos del modelo (arquitectura, clases, hiperparámetros) | ~50 KB |
| `training_history.json` | Historial de métricas por época | ~20 KB |

> **Importante:** `training_config.json` sí debe estar en Git. Solo los `.pth` están excluidos.

---

## 2. ¿Por qué no se suben a Git?

- Los archivos `.pth` pesan entre 200-500 MB
- GitHub tiene un límite de 100 MB por archivo
- El historial de Git se inflaría con cada versión del modelo
- Los archivos binarios no se benefician del diff de Git

El `.gitignore` del proyecto ya excluye estos archivos:

```gitignore
data/weights/*.pt
data/weights/*.pth
data/weights/*.onnx
data/weights/*.h5
data/weights/*.bin
data/weights/*.safetensors
```

---

## 3. Estrategia de Versionado con DVC

### 3.1 ¿Qué es DVC?

[DVC (Data Version Control)](https://dvc.org) es una herramienta que funciona como Git, pero para archivos grandes. Guarda un **archivo puntero** (`.dvc`) en Git y el archivo real en un almacenamiento remoto (Google Drive, S3, Azure Blob, etc.).

### 3.2 Instalación (una sola vez)

```bash
# Instalar DVC con el backend de tu elección
pip install dvc dvc-gdrive      # Google Drive (más simple para equipos pequeños)
# pip install dvc dvc-s3        # Amazon S3
# pip install dvc dvc-azure     # Azure Blob Storage
# pip install dvc dvc-gcs       # Google Cloud Storage
```

### 3.3 Inicialización del repositorio DVC (una sola vez)

```bash
cd src/Bio.Backend.AI

# Inicializar DVC en el proyecto
dvc init

# Configurar almacenamiento remoto
# Opción A: Google Drive (carpeta compartida del equipo)
dvc remote add -d storage gdrive://<ID_DE_CARPETA_COMPARTIDA>

# Opción B: Amazon S3
# dvc remote add -d storage s3://bioplatform-models/weights

# Opción C: Azure Blob
# dvc remote add -d storage azure://bioplatform/models

# Confirmar la configuración en Git
git add .dvc/ .dvcignore
git commit -m "chore(ai): initialize DVC for model versioning"
```

### 3.4 Registrar un modelo (después de cada entrenamiento)

```bash
# 1. Agregar el archivo a DVC (crea best_model.pth.dvc)
dvc add data/weights/best_model.pth

# 2. Commit del archivo puntero en Git
git add data/weights/best_model.pth.dvc data/weights/.gitignore
git commit -m "chore(ai): update model weights v2.0.0 (accuracy 88.3%)"

# 3. Etiquetar la versión del modelo
git tag model-v2.0.0 -m "EfficientNet-B2, 719 classes, val_acc=88.3%"

# 4. Subir los pesos al almacenamiento remoto
dvc push

# 5. Subir los tags a Git
git push && git push --tags
```

### 3.5 Descargar los pesos en otra máquina

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd src/Bio.Backend.AI

# Descargar los pesos desde el remoto DVC
dvc pull
# → Descarga best_model.pth (~300 MB) desde Google Drive / S3 / Azure
```

### 3.6 Cambiar a una versión anterior del modelo

```bash
# Ver las versiones disponibles
git tag --list "model-*"
# model-v1.0.0
# model-v1.1.0
# model-v2.0.0

# Cambiar a una versión anterior
git checkout model-v1.1.0 -- data/weights/best_model.pth.dvc
dvc checkout
# → Restaura el best_model.pth de la versión 1.1.0

# Volver a la versión actual
git checkout HEAD -- data/weights/best_model.pth.dvc
dvc checkout
```

---

## 4. Alternativa: Sin DVC (Google Drive directo)

Si el equipo no quiere usar DVC, se pueden manejar los pesos manualmente con Google Drive y el script de descarga incluido.

### 4.1 Subir el modelo

1. Entrena el modelo → genera `data/weights/best_model.pth`
2. Sube el archivo a una carpeta compartida de Google Drive
3. Genera un enlace de descarga directa
4. Registra la URL y el hash en `.env`:

```env
MODEL_REMOTE_URL=https://drive.google.com/uc?id=XXXXXXXXXXXXX&export=download
MODEL_SHA256=a1b2c3d4e5f6...
```

### 4.2 Obtener el hash SHA256

```bash
# Windows (PowerShell)
Get-FileHash data/weights/best_model.pth -Algorithm SHA256

# Linux / Mac / Git Bash
sha256sum data/weights/best_model.pth
```

### 4.3 Descargar el modelo

```bash
# Auto-detectar método (prueba DVC → URL → local existente)
python scripts/download_model.py

# Forzar descarga por URL
python scripts/download_model.py --method url

# Solo verificar integridad
python scripts/download_model.py --verify
```

---

## 5. Flujo de Trabajo Completo

### Al entrenar un nuevo modelo:

```
1. python scripts/04_train_cnn.py          # Entrenar
2. python scripts/05_evaluate_model.py     # Evaluar métricas
3. dvc add data/weights/best_model.pth     # Registrar en DVC
4. git add -A && git commit               # Commit del puntero .dvc
5. git tag model-vX.Y.Z                    # Etiquetar versión
6. dvc push                                # Subir pesos al remoto
7. git push --tags                         # Subir tag a GitHub
```

### Al configurar una máquina nueva:

```
1. git clone <repo>                        # Clonar código
2. cd src/Bio.Backend.AI
3. python -m venv .venv && source ...      # Crear venv
4. pip install -r requirements.txt         # Instalar deps
5. pip install torch torchvision           # Instalar PyTorch
6. dvc pull                                # Descargar pesos
7. python -m app.main                      # Lanzar servicio
```

### Al desplegar en Docker:

```dockerfile
# Los pesos se copian en el build (deben existir localmente)
COPY data/weights/ ./data/weights/
```

O se descargan en runtime con el script:

```dockerfile
RUN python scripts/download_model.py --method url
```

---

## 6. Convención de Nombres para Versiones

| Tag | Descripción |
|-----|-------------|
| `model-v1.0.0` | Primer modelo en producción |
| `model-v1.1.0` | Mejora de accuracy/recall |
| `model-v2.0.0` | Cambio de arquitectura (ej: de ResNet50 a EfficientNet-B2) |
| `model-v2.0.1` | Hotfix (re-entrenamiento con datos corregidos) |

Formato: `model-vMAJOR.MINOR.PATCH`

- **MAJOR**: Cambio de arquitectura o dataset completamente nuevo
- **MINOR**: Mejora de métricas (más datos, hiperparámetros ajustados)
- **PATCH**: Corrección (etiquetas corregidas, imágenes limpiadas)

---

## 7. Tabla de Referencia Rápida

| Acción | Comando |
|--------|---------|
| Registrar modelo nuevo | `dvc add data/weights/best_model.pth` |
| Subir pesos al remoto | `dvc push` |
| Descargar pesos | `dvc pull` |
| Ver versiones | `git tag --list "model-*"` |
| Restaurar versión anterior | `git checkout model-vX.Y.Z -- data/weights/best_model.pth.dvc && dvc checkout` |
| Verificar integridad | `python scripts/download_model.py --verify` |
| Descargar por URL | `python scripts/download_model.py --method url` |
| Ver configuración del modelo | `cat data/weights/training_config.json` |

---

## 8. Troubleshooting

### "Model weights not found" al iniciar el servicio

```bash
# Verificar que existan los archivos
ls -la data/weights/
# → Debe contener best_model.pth y training_config.json

# Si faltan, descargarlos
dvc pull
# o
python scripts/download_model.py
```

### "Hash mismatch" al verificar

El archivo descargado está corrupto o es una versión diferente. Volver a descargar:

```bash
rm data/weights/best_model.pth
python scripts/download_model.py --method url
```

### DVC pide autenticación de Google Drive

La primera vez que se usa `dvc push` o `dvc pull` con Google Drive, se abre un navegador para autenticarse con OAuth. El token se guarda localmente en `~/.config/dvc/`.

### El modelo es demasiado grande para la RAM

Verificar que `training_config.json` especifica el modelo correcto. Los modelos más grandes (ResNet101, EfficientNet-B2) requieren más memoria. En producción, usar 2+ GB de RAM libre.
