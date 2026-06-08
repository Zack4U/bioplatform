# ===========================================
# BioPlatform AI Service — Multi-stage Dockerfile
# ===========================================
# Stage 1: Install dependencies
# Stage 2: Production image (slim)
# ===========================================

# ── Stage 1: Builder ──────────────────────────────────────────
# TORCH_DEVICE options: cpu | cu121 | cu124
# GPU build: docker compose build --build-arg TORCH_DEVICE=cu121 ai-service
# Or set TORCH_DEVICE=cu121 in .env
ARG TORCH_DEVICE=cpu

FROM python:3.11-slim AS builder

ARG TORCH_DEVICE

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install \
    torch==2.2.0 torchvision==0.17.0 \
    --index-url https://download.pytorch.org/whl/${TORCH_DEVICE}
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY app/ ./app/
COPY data/weights/ ./data/weights/
COPY data/processed/class_info.json ./data/processed/class_info.json

# Non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]