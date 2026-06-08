#!/usr/bin/env bash
# ============================================================================
# BioPlatform Caldas — one-shot production installer (Linux / macOS / WSL)
# ----------------------------------------------------------------------------
# Brings the whole stack up with Docker, applies EF Core migrations and lets the
# backend seed the scientific catalog. Idempotent and RESUMABLE by section.
#
# Usage:
#   ./install.sh                 # run every section in order (from scratch)
#   ./install.sh --from migrate  # resume starting at a section
#   ./install.sh --only apps     # run a single section
#   ./install.sh --help
#
# Sections (in order):
#   env      Ensure .env exists (copied from .env.prod.example).
#   infra    Start databases (SQL Server, Postgres, Redis, ChromaDB) + wait healthy.
#   migrate  Apply EF Core migrations to BioDbContext (SQL Server) and
#            ScientificDbContext (Postgres). Creates schema; BioDb mock data is
#            baked into its migration. Generates an initial migration if none exist.
#   weights  dvc pull of the CNN model weights from S3. Skips if already present.
#            Requires dvc[s3] + AWS credentials (read from .env).
#   apps     Build & start backend-core, ai-service, frontend-web, nginx.
#            On first boot backend-core SEEDS the scientific catalog
#            (species + images + AI model registry + distributions) — idempotent.
#   verify   Print container + health status.
# ============================================================================
set -euo pipefail

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
SDK_IMAGE="mcr.microsoft.com/dotnet/sdk:8.0"
BACKEND_DIR="src/Bio.Backend.Core"
AI_DIR="src/Bio.Backend.AI"
API_PROJECT="Bio.API/Bio.API.csproj"
SECTIONS=(env infra migrate weights apps verify)

log()  { echo -e "\n\033[1;36m[install]\033[0m $*"; }
die()  { echo -e "\033[1;31m[install:error]\033[0m $*" >&2; exit 1; }

usage() { sed -n '2,40p' "$0"; exit 0; }

# ── arg parsing ──────────────────────────────────────────────────────────────
FROM=""; ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --from)  FROM="${2:-}"; shift 2;;
    --only)  ONLY="${2:-}"; shift 2;;
    -h|--help) usage;;
    *) die "Unknown arg: $1 (use --help)";;
  esac
done

should_run() {
  local s="$1"
  if [[ -n "$ONLY" ]]; then [[ "$s" == "$ONLY" ]]; return; fi
  if [[ -n "$FROM" ]]; then
    local started=0
    for x in "${SECTIONS[@]}"; do
      [[ "$x" == "$FROM" ]] && started=1
      [[ "$x" == "$s" && $started -eq 1 ]] && return 0
    done
    return 1
  fi
  return 0
}

# ── sections ─────────────────────────────────────────────────────────────────
section_env() {
  log "Section: env"
  if [[ ! -f .env ]]; then
    [[ -f .env.prod.example ]] || die ".env.prod.example missing."
    cp .env.prod.example .env
    die ".env created from template. EDIT it with real secrets, then re-run --from infra."
  fi
  log ".env present."
}

wait_healthy() {
  local name="$1" tries=60
  log "Waiting for $name to be healthy ..."
  for ((i=0;i<tries;i++)); do
    local st
    st=$(docker inspect -f '{{.State.Health.Status}}' "$name" 2>/dev/null || echo "starting")
    [[ "$st" == "healthy" ]] && { log "$name healthy."; return 0; }
    sleep 5
  done
  die "$name did not become healthy in time."
}

section_infra() {
  log "Section: infra (databases)"
  $COMPOSE up -d sqlserver postgres redis chromadb
  wait_healthy bioplatform-sqlserver-prod
  wait_healthy bioplatform-postgres-prod
  wait_healthy bioplatform-redis-prod
}

docker_network() {
  docker network ls --filter name=bioplatform-network --format '{{.Name}}' | head -n1
}

section_migrate() {
  log "Section: migrate (EF Core)"
  local net; net=$(docker_network)
  [[ -n "$net" ]] || die "bioplatform network not found — run 'infra' first."

  # Load .env so we can remap DB_CONNECTION_STRING_* → the ConnectionStrings__*
  # keys that Program.cs / dotnet ef actually read.
  set -a; source .env; set +a

  # Runs inside an SDK container ON the compose network so it can resolve the
  # 'sqlserver' / 'postgres' service hostnames used in the connection strings.
  docker run --rm --network "$net" \
    --env-file .env \
    -e "ConnectionStrings__DefaultConnection=${DB_CONNECTION_STRING_SQL}" \
    -e "ConnectionStrings__ScientificConnection=${DB_CONNECTION_STRING_PG}" \
    -e "ConnectionStrings__RedisConnection=${REDIS_CONNECTION_STRING}" \
    -e "ASPNETCORE_ENVIRONMENT=Production" \
    -v "$(pwd)/$BACKEND_DIR:/src" -w /src \
    "$SDK_IMAGE" bash -lc '
      set -e
      export PATH="$PATH:/root/.dotnet/tools"
      dotnet tool install --global dotnet-ef >/dev/null 2>&1 || dotnet tool update --global dotnet-ef >/dev/null 2>&1 || true
      dotnet restore '"$API_PROJECT"'
      add_if_missing() {
        local ctx="$1" out="$2"
        if [ ! -d "$out" ] || [ -z "$(ls -A "$out" 2>/dev/null | grep -v Snapshot || true)" ]; then
          echo "[migrate] no migrations for $ctx — creating InitialCreate";
          dotnet ef migrations add InitialCreate --context "$ctx" --project '"$API_PROJECT"' -o "$out";
        fi
      }
      add_if_missing BioDbContext        Migrations/Bio
      add_if_missing ScientificDbContext Migrations/Scientific
      echo "[migrate] applying BioDbContext ...";        dotnet ef database update --context BioDbContext        --project '"$API_PROJECT"';
      echo "[migrate] applying ScientificDbContext ..."; dotnet ef database update --context ScientificDbContext --project '"$API_PROJECT"';
    '
  log "Migrations applied."
}

section_weights() {
  log "Section: weights (DVC pull of CNN model)"
  if compgen -G "$AI_DIR/data/weights/*/best_model.pth" >/dev/null 2>&1 \
     || [[ -f "$AI_DIR/data/weights/best_model.pth" ]]; then
    log "Model weights already present — skipping dvc pull."
    return 0
  fi
  command -v dvc >/dev/null 2>&1 || die "dvc not installed. Run: pip install 'dvc[s3]'  (needed to fetch model weights from S3)."
  set -a; source .env; set +a
  ( cd "$AI_DIR" \
      && AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-}" \
         AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-}" \
         AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}" \
         dvc pull ) \
    || die "dvc pull failed — check AWS credentials and access to the DVC S3 remote."
  log "Model weights pulled."
}

section_apps() {
  log "Section: apps (backend, ai, web, nginx)"
  $COMPOSE up -d --build backend-core ai-service frontend-web nginx
  log "Backend is seeding the scientific catalog on first boot (idempotent)."
  log "Follow progress:  $COMPOSE logs -f backend-core"
}

section_verify() {
  log "Section: verify"
  $COMPOSE ps
}

# ── run ──────────────────────────────────────────────────────────────────────
[[ -f docker-compose.prod.yml ]] || die "Run from the repository root."
for s in "${SECTIONS[@]}"; do
  should_run "$s" && "section_$s"
done
log "Done."
