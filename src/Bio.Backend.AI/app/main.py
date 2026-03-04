import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/Shutdown lifecycle: load CNN model on startup."""
    # ── Startup ────────────────────────────────────────────────
    logger.info("Starting BioPlatform AI Service...")
    try:
        from app.services.vision.classifier import get_classifier
        classifier = get_classifier()
        classifier.load_model()
        logger.info(f"CNN model loaded: {classifier.num_classes} classes")
    except FileNotFoundError:
        logger.warning(
            "CNN model weights not found. /api/v1/classify will return 503. "
            "Train the model first: python scripts/04_train_cnn.py"
        )
    except Exception as e:
        logger.warning(f"Failed to load CNN model: {e}. Classify endpoint unavailable.")

    yield

    # ── Shutdown ───────────────────────────────────────────────
    logger.info("Shutting down BioPlatform AI Service.")


app = FastAPI(
    title="BioPlatform AI Service",
    description="Microservicio de IA para identificación de especies y biocomercio",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──────────────────────────────────────────
from app.api.v1_classify import router as classify_router  # noqa: E402
app.include_router(classify_router)


@app.get("/health")
async def health():
    from app.services.vision.classifier import get_classifier
    classifier = get_classifier()
    return {
        "status": "healthy",
        "service": "bio-ai",
        "model_loaded": classifier.is_loaded,
        "num_classes": classifier.num_classes,
    }


@app.get("/")
async def root():
    return {
        "message": "BioPlatform AI Service",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "classify": "POST /api/v1/classify",
            "model_info": "GET /api/v1/model-info",
            "health": "GET /health",
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
