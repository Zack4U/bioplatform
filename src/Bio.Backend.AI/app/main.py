import logging

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup/Shutdown lifecycle: load CNN model and check DB on startup."""
    settings = get_settings()

    # ── Startup ────────────────────────────────────────────────
    logger.info("Starting BioPlatform AI Service...")

    # Load CNN model
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

    # Check DB connectivity (non-blocking)
    try:
        from app.core.database import check_db_connection

        db_ok = await check_db_connection()
        if db_ok:
            logger.info(f"PostgreSQL connected: {settings.pg_host}:{settings.pg_port}/{settings.pg_database}")
        else:
            logger.warning("PostgreSQL unreachable. Species enrichment will be unavailable.")
    except Exception as e:
        logger.warning(f"PostgreSQL check skipped: {e}")

    yield

    # ── Shutdown ───────────────────────────────────────────────
    logger.info("Shutting down BioPlatform AI Service.")
    try:
        from app.core.database import dispose_engine

        await dispose_engine()
    except Exception:
        pass


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Microservicio de IA para identificación de especies y biocomercio – Caldas, Colombia",
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routers ──────────────────────────────────────────
from app.api.v1_classify import router as classify_router  # noqa: E402

app.include_router(classify_router)


@app.get("/health", tags=["Infrastructure"])
async def health() -> dict[str, Any]:
    """
    Health check endpoint for Docker / load balancer probes.
    Reports CNN model status and PostgreSQL connectivity.
    """
    from app.core.database import check_db_connection
    from app.services.vision.classifier import get_classifier

    classifier = get_classifier()
    db_connected = await check_db_connection()

    return {
        "status": "healthy" if classifier.is_loaded else "degraded",
        "service": "bio-ai",
        "model_loaded": classifier.is_loaded,
        "num_classes": classifier.num_classes,
        "database_connected": db_connected,
    }


@app.get("/", tags=["Infrastructure"])
async def root() -> dict[str, Any]:
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
        reload=True,
    )
