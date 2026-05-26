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
# pip install dvc dvc-gdrive      # Google Drive (más simple para equipos pequeños)
pip install dvc dvc-s3        # Amazon S3
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
# dvc remote add -d storage gdrive://<ID_DE_CARPETA_COMPARTIDA>

# Opción B: Amazon S3 (Recomendado)
dvc remote add -d storage s3://bioplatform-private/dvc-storage

# Opción C: Azure Blob
# dvc remote add -d storage azure://bioplatform/models

# Configurar credenciales
dvc remote modify --local s3-remote access_key_id TU_ACCESS_KEY_AQUI
dvc remote modify --local s3-remote secret_access_key TU_SECRET_KEY_AQUI

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

## 8. Despliegue en Servidor de Producción y Sincronización

Cuando el proyecto se despliega o sube a un servidor de producción nuevo o existente, el flujo de restauración y sincronización de los pesos y metadatos funciona de la siguiente manera:

### 8.1 Creación de la Carpeta del Modelo Versionado
**Sí, se genera automáticamente.**
Dado que el archivo puntero DVC (`best_model.pth.dvc`) y los archivos de metadatos (`training_config.json`, etc.) se encuentran dentro del subdirectorio versionado (ej: `data/weights/v1.0.20260518021229/`) y están comprometidos en Git, al hacer un `git pull` o clonar el repositorio en el servidor, Git creará físicamente la carpeta correspondiente. Al ejecutar el comando:
```bash
dvc pull
```
DVC leerá el archivo puntero y descargará el archivo pesado de pesos (`best_model.pth`) directamente en el subdirectorio de versión correcto.

### 8.2 Archivos de Evaluación y Métricas
**No es necesario volver a evaluar.**
Los archivos de reporte y métricas de evaluación (como `evaluation_metrics.json`, `classification_report.txt`, `confusion_matrix.txt`, etc.) son archivos livianos de texto. Por lo tanto, **están comprometidos directamente en Git** dentro del directorio de la versión. Al hacer `git pull` en el servidor, estos archivos ya estarán presentes y listos para ser consumidos por FastAPI, el dashboard del Auditor de Modelos y la base de datos.

### 8.3 Entrada en la Base de Datos (PostgreSQL)
**No se genera automáticamente por DVC o Git.** El comando `dvc pull` solo actúa sobre el sistema de archivos y no tiene interacción alguna con la base de datos. La sincronización de la metadata en PostgreSQL depende del escenario:

1. **Modelo Activo Inicial/Semilla (`v1.0.20260518021229`)**:
   Se proporciona el script SQL [seed_ai_metadata.sql](file:///e:/Projects/bioplatform/src/Bio.Backend.AI/data/weights/seed_ai_metadata.sql). Al desplegar la base de datos de producción por primera vez, se debe ejecutar este script para registrar el modelo activo semilla, sus métricas y su historial inicial en las tablas `ai_model_versions` y `ai_training_jobs`.
2. **Modelos Entrenados Automáticamente en el Servidor (Fine-Tuning)**:
   El orquestador (`finetune_orchestrator.py`) realiza el push a DVC e invoca automáticamente al webhook de `.NET Core` al finalizar el entrenamiento. El backend de `.NET Core` captura la llamada y **crea la entrada en la base de datos de forma automática** en la tabla `ai_model_versions` vinculándola al job de entrenamiento.
3. **Modelos Subidos Manualmente por el Administrador**:
   Al subir los archivos por la interfaz administrativa (endpoint `/api/v1/model/upload`), FastAPI guarda localmente los archivos en una nueva versión, inicia la subida a DVC y notifica al webhook de `.NET Core` para que registre automáticamente el modelo y sus métricas en la base de datos.

---

## 9. Troubleshooting

### "Model weights not found" al iniciar el servicio

```bash
# Verificar que exista el subdirectorio versionado y contenga best_model.pth
ls -la data/weights/v1.0.20260518021229/
# → Debe contener best_model.pth y training_config.json

# Si faltan, descargarlos
dvc pull
```

### "Hash mismatch" al verificar

El archivo descargado está corrupto o es una versión diferente. Volver a descargar:

```bash
# Borrar pesos locales corruptos y volver a traerlos con DVC
rm data/weights/v1.0.20260518021229/best_model.pth
dvc pull
```

### El modelo es demasiado grande para la RAM

Verificar que el archivo `training_config.json` en el directorio de la versión especifica el modelo correcto. Los modelos más grandes (ResNet101, EfficientNet-B2) requieren más memoria. En producción, usar 2+ GB de RAM libre.
```
