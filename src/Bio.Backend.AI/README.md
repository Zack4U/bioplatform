# BioPlatform AI Service — Species Classification CNN

Microservicio de clasificación de especies mediante redes neuronales convolucionales (CNN) para la plataforma de biodiversidad y biocomercio de Caldas, Colombia.

## Arquitectura

```
Bio.Backend.AI/
├── app/
│   ├── main.py                     # FastAPI entry point + lifecycle
│   ├── api/
│   │   └── v1_classify.py          # POST /api/v1/classify, GET /api/v1/model-info
│   ├── core/
│   │   ├── config.py               # Settings (pydantic-settings, .env)
│   │   └── database.py             # Async PostgreSQL (asyncpg + SQLAlchemy)
│   ├── models/
│   │   └── vision.py               # Pydantic schemas (request/response)
│   └── services/
│       ├── species_repository.py   # DB queries (species, taxonomy, geo)
│       └── vision/
│           └── classifier.py       # SpeciesClassifier (CNN inference)
├── data/
│   ├── weights/                    # Model weights (NOT in Git — use DVC)
│   │   ├── best_model.pth
│   │   └── training_config.json
│   └── processed/
│       └── class_info.json         # Taxonomy metadata per class
├── scripts/
│   ├── download_model.py           # Download/verify model weights
│   ├── 04_train_cnn.py             # Train (see CNN_GUIDE.md)
│   ├── 05_evaluate_model.py        # Evaluate model metrics
│   └── model_auditor.py            # Visual audit web UI
├── requirements.txt
├── DockerFile
├── .env.example
└── CNN_GUIDE.md                    # Full training pipeline guide
```

## Quickstart

### 1. Prerequisites

- **Python 3.11+**
- **PostgreSQL** running (via `docker-compose up -d` from project root)
- **PyTorch** installed (GPU recommended, CPU works)

### 2. Setup Environment

```bash
cd src/Bio.Backend.AI

# Create virtual environment
python -m venv .venv
source .venv/bin/activate       # Linux/Mac
# .venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Install PyTorch (CUDA 13.0 — adjust for your GPU)
pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu130

# CPU-only alternative:
# pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

### 3. Get Model Weights

Model weights are **not stored in Git** (too large). Choose one method:

```bash
# Option A: DVC (recommended for team)
pip install dvc dvc-gdrive
dvc pull

# Option B: Download script (URL or auto-detect)
python scripts/download_model.py

# Option C: Manual
# Place best_model.pth and training_config.json in data/weights/
```

See [Model Versioning](#model-versioning) below for details.

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PG_HOST` | PostgreSQL host | `localhost` |
| `PG_PORT` | PostgreSQL port | `5432` |
| `PG_USER` | Database user | `postgres` |
| `PG_PASSWORD` | Database password | — |
| `PG_DATABASE` | Database name | `biocommerce_scientific` |
| `MODEL_WEIGHTS_PATH` | Path to model file | `data/weights/best_model.pth` |

### 5. Run the Service

```bash
# Development (with hot reload)
python -m app.main
# or
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

### 6. Verify

```bash
# Health check
curl http://localhost:8000/health

# Classify an image
curl -X POST http://localhost:8000/api/v1/classify \
  -F "file=@test_image.jpg" \
  -F "top_k=5"

# Model info
curl http://localhost:8000/api/v1/model-info
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Service info and available endpoints |
| `GET` | `/health` | Health check (model + database status) |
| `GET` | `/docs` | Swagger UI (interactive API docs) |
| `POST` | `/api/v1/classify` | Classify a species image (top-K predictions) |
| `GET` | `/api/v1/model-info` | CNN model metadata and class list |

### POST /api/v1/classify

**Parameters:**
- `file` (form): Image file (JPEG, PNG, WebP). Max 10 MB.
- `top_k` (query): Number of predictions (1-20, default: 5).
- `confidence_threshold` (query): Min confidence (0.0-1.0, default: 0.01).

**Response:** Each prediction includes:
- CNN confidence score and taxonomy (from `class_info.json`)
- **Enriched species data from PostgreSQL** (description, ecology, conservation status, geographic distributions)
- If the species is not in the DB → `species_data.found_in_db = false` with an alert message

**Bio-Safety:** Species flagged as `is_sensitive` have exact GPS coordinates masked. Only municipality names are returned.

## Model Versioning

CNN model files (~200-500 MB) **cannot be stored in Git**. We use **DVC (Data Version Control)** to track them alongside code history.

### Initial Setup (one time per repo)

```bash
pip install dvc dvc-gdrive   # or dvc-s3, dvc-azure

cd src/Bio.Backend.AI
dvc init
dvc remote add -d storage gdrive://<shared_folder_id>
```

### Track a New Model Version

```bash
# After training a new model:
dvc add data/weights/best_model.pth
git add data/weights/best_model.pth.dvc data/weights/.gitignore
git commit -m "chore(ai): update model weights v2.0.0"
git tag model-v2.0.0
dvc push
git push --tags
```

### Pull Weights on a New Machine

```bash
git clone <repo>
cd src/Bio.Backend.AI
dvc pull    # downloads weights from remote storage
```

### Alternative: Direct Download

If DVC is not configured, set `MODEL_REMOTE_URL` in `.env` pointing to the weights file (Google Drive shared link, S3 presigned URL, Azure SAS):

```bash
python scripts/download_model.py --method url
```

### Integrity Verification

Set `MODEL_SHA256` in `.env` to automatically verify the model hash:

```bash
python scripts/download_model.py --verify
```

## Docker

```bash
# Build
docker build -t bioplatform-ai -f DockerFile .

# Run (connect to host PostgreSQL)
docker run -p 8000:8000 \
  -e PG_HOST=host.docker.internal \
  -e PG_PASSWORD=your_password \
  bioplatform-ai
```

## Database Connection

The service connects to **PostgreSQL (BioCommerce_Scientific)** to enrich CNN predictions with:

- Species descriptions, ecology, traditional uses
- Conservation status (IUCN / Colombian Red Lists)
- Geographic distributions (PostGIS)
- Sensitive species flag (coordinates masked)

If the database is unavailable, the service still works in **degraded mode** — returning CNN predictions with taxonomy from the local `class_info.json` file only.

## Related Documentation

- **[CNN_GUIDE.md](CNN_GUIDE.md)** — Full pipeline: dataset preparation → training → evaluation
- **[SCRIPTS_GUIDE.md](../../SCRIPTS_GUIDE.md)** — All available scripts
- **[Data Dictionary](../../.docs/Bioplatform/03-Data_Dictionary.md)** — Database schema reference
