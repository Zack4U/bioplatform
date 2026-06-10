import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

# Search for .env in current, parent, or grandparent directories
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "../../../.env"))
load_dotenv()  # Also load local .env if exists

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup/Shutdown lifecycle: load CNN model and check DB on startup."""
    settings = get_settings()

    # -- Startup --------------------------------------------------------
    logger.info("Starting BioPlatform AI Service...")

    # Load CNN model dictated by the DB registry (ai_model_versions).
    # The active version is the single source of truth: if no version is
    # active, the CNN stays suspended (it must NOT load the newest weights
    # on disk).
    try:
        from app.services.model_registry_repository import get_active_model_version
        from app.services.vision.classifier import get_classifier

        classifier = get_classifier()
        active = await get_active_model_version()

        if active is None:
            logger.warning(
                "No active model version in the registry. CNN suspended — "
                "/api/v1/classify will return 503 until an admin activates a version."
            )
        else:
            classifier.load_model(version=active["version"])
            logger.info(
                "CNN model loaded from registry: version=%s, %d classes",
                active["version"],
                classifier.num_classes,
            )
    except FileNotFoundError as e:
        logger.warning(
            f"Active model weights not found on disk: {e}. /api/v1/classify will return 503."
        )
    except Exception as e:
        logger.warning(f"Failed to load CNN model: {e}. Classify endpoint unavailable.")

    # Check DB connectivity (non-blocking)
    try:
        from app.core.database import check_db_connection

        db_ok = await check_db_connection()
        if db_ok:
            logger.info(
                f"PostgreSQL connected: {settings.pg_host}:{settings.pg_port}/{settings.pg_database}"
            )
        else:
            logger.warning(
                "PostgreSQL unreachable. Species enrichment will be unavailable."
            )
    except Exception as e:
        logger.warning(f"PostgreSQL check skipped: {e}")

    yield

    # -- Shutdown -------------------------------------------------------
    logger.info("Shutting down BioPlatform AI Service.")
    try:
        from app.core.database import dispose_engine

        await dispose_engine()
    except Exception:
        pass


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Microservicio de IA para identificacion de especies y biocomercio - Caldas, Colombia",
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

# -- Register Routers ----------------------------------------------------------
from app.api.v1_assistant import router as assistant_router  # noqa: E402
from app.api.v1_classify import router as classify_router  # noqa: E402
from app.api.v1_metrics import router as metrics_router  # noqa: E402
from app.api.v1_model_registry import router as model_registry_router  # noqa: E402
from app.api.v1_system import router as system_router  # noqa: E402
from app.api.v1_training import router as training_router  # noqa: E402

app.include_router(classify_router)
app.include_router(metrics_router)
app.include_router(assistant_router)
app.include_router(model_registry_router)
app.include_router(system_router)
app.include_router(training_router)


@app.get("/health", tags=["Infrastructure"])
async def health() -> dict[str, Any]:
    """
    Health check endpoint for Docker / load balancer probes.
    Reports CNN model status and PostgreSQL connectivity.
    """
    import sqlalchemy as sa

    from app.core.database import check_db_connection, get_db_session
    from app.services.vision.classifier import get_classifier

    classifier = get_classifier()
    db_connected = await check_db_connection()

    # Count species in the database (best-effort)
    db_species_count = 0
    if db_connected:
        try:
            async with get_db_session() as session:
                result = await session.execute(sa.text("SELECT COUNT(*) FROM species"))
                db_species_count = result.scalar() or 0
        except Exception:
            pass

    return {
        "status": "healthy" if classifier.is_loaded else "degraded",
        "service": "bio-ai",
        "model_loaded": classifier.is_loaded,
        "num_classes": classifier.num_classes,
        "database_connected": db_connected,
        "db_species_count": db_species_count,
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
            "hardware": "GET /api/v1/system/hardware",
            "finetune": "POST /api/v1/training/finetune",
            "upload": "POST /api/v1/model/upload",
            "reload": "POST /api/v1/model/reload",
            "validate": "POST /api/v1/model/validate",
            "health": "GET /health",
            "liveness": "GET /health/liveness",
            "readiness": "GET /health/readiness",
            "startup": "GET /health/startup",
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
