# ============================================================================
# BioPlatform Caldas - one-shot production installer (Windows Server / Desktop)
# ----------------------------------------------------------------------------
# Brings the whole stack up with Docker, applies EF Core migrations and lets the
# backend seed the scientific catalog. Idempotent and RESUMABLE by section.
#
# Usage:
#   .\install.ps1                  # run every section in order (from scratch)
#   .\install.ps1 -From migrate    # resume starting at a section
#   .\install.ps1 -Only apps       # run a single section
#
# Sections (in order): env, infra, migrate, weights, apps, verify
#   env      Ensure .env exists (copied from .env.prod.example).
#   infra    Start databases + wait healthy.
#   migrate  Apply EF Core migrations (BioDbContext + ScientificDbContext).
#   weights  dvc pull of the CNN model weights from S3 (skips if present).
#   apps     Build & start backend-core, ai-service, frontend-web, nginx.
#            Backend SEEDS the scientific catalog on first boot (idempotent).
#   verify   Print container + health status.
#
# Requires: Docker Desktop / Engine with LINUX containers enabled.
# ============================================================================
[CmdletBinding()]
param(
    [ValidateSet('env','infra','migrate','weights','apps','verify')] [string]$From,
    [ValidateSet('env','infra','migrate','weights','apps','verify')] [string]$Only
)

$ErrorActionPreference = 'Stop'
$Compose   = @('compose','-f','docker-compose.yml','-f','docker-compose.prod.yml')
$SdkImage  = 'mcr.microsoft.com/dotnet/sdk:8.0'
$BackendDir= 'src/Bio.Backend.Core'
$AiDir     = 'src/Bio.Backend.AI'
$ApiProject= 'Bio.API/Bio.API.csproj'
$Sections  = @('env','infra','migrate','weights','apps','verify')

function Log  { param($m) Write-Host "`n[install] $m" -ForegroundColor Cyan }
function Die  { param($m) Write-Host "[install:error] $m" -ForegroundColor Red; exit 1 }

function Should-Run {
    param($s)
    if ($Only) { return $s -eq $Only }
    if ($From) {
        $started = $false
        foreach ($x in $Sections) {
            if ($x -eq $From) { $started = $true }
            if ($x -eq $s) { return $started }
        }
        return $false
    }
    return $true
}

function Wait-Healthy {
    param($name)
    Log "Waiting for $name to be healthy ..."
    for ($i=0; $i -lt 60; $i++) {
        $st = (docker inspect -f '{{.State.Health.Status}}' $name 2>$null)
        if ($st -eq 'healthy') { Log "$name healthy."; return }
        Start-Sleep -Seconds 5
    }
    Die "$name did not become healthy in time."
}

function Get-DockerNetwork {
    (docker network ls --filter name=bioplatform-network --format '{{.Name}}' | Select-Object -First 1)
}

function Section-env {
    Log 'Section: env'
    if (-not (Test-Path .env)) {
        if (-not (Test-Path .env.prod.example)) { Die '.env.prod.example missing.' }
        Copy-Item .env.prod.example .env
        Die '.env created from template. EDIT it with real secrets, then re-run -From infra.'
    }
    Log '.env present.'
}

function Section-infra {
    Log 'Section: infra (databases)'
    docker @Compose up -d sqlserver postgres redis chromadb
    Wait-Healthy 'bioplatform-sqlserver-prod'
    Wait-Healthy 'bioplatform-postgres-prod'
    Wait-Healthy 'bioplatform-redis-prod'
}

function Section-migrate {
    Log 'Section: migrate (EF Core)'
    $net = Get-DockerNetwork
    if (-not $net) { Die "bioplatform network not found - run 'infra' first." }

    # DbContexts live in Bio.Infrastructure (= migrations assembly); Bio.API is the startup
    # project. Same invocation as migrate.sh (-p / -s). Detect existing migrations per context
    # via its snapshot file; distinct names avoid a class clash in the shared Migrations folder.
    $inner = @'
set -e
export PATH="$PATH:/root/.dotnet/tools"
dotnet tool install --global dotnet-ef >/dev/null 2>&1 || dotnet tool update --global dotnet-ef >/dev/null 2>&1 || true
dotnet restore Bio.API/Bio.API.csproj
ensure_ctx() {
  ctx="$1"; name="$2"
  if ! dotnet ef migrations list --context "$ctx" -p Bio.Infrastructure -s Bio.API --no-connect 2>/dev/null | grep -qE "[0-9]{14}_"; then
    echo "[migrate] no migrations for $ctx - creating $name"
    dotnet ef migrations add "$name" --context "$ctx" -p Bio.Infrastructure -s Bio.API
  fi
  echo "[migrate] applying $ctx ..."
  dotnet ef database update --context "$ctx" -p Bio.Infrastructure -s Bio.API
}
ensure_ctx BioDbContext        InitialCreate
ensure_ctx ScientificDbContext InitialCreateScientific
'@

    # Read .env so we can remap DB_CONNECTION_STRING_* → ConnectionStrings__* keys.
    $envMap = @{}
    foreach ($line in Get-Content .env) {
        if ($line -match '^\s*([^#=]+)=(.*)$') { $envMap[$matches[1].Trim()] = $matches[2] }
    }
    $mount = "$((Get-Location).Path)/$BackendDir"
    docker run --rm --network $net --env-file .env `
        -e "ConnectionStrings__DefaultConnection=$($envMap['DB_CONNECTION_STRING_SQL'])" `
        -e "ConnectionStrings__ScientificConnection=$($envMap['DB_CONNECTION_STRING_PG'])" `
        -e "ConnectionStrings__RedisConnection=$($envMap['REDIS_CONNECTION_STRING'])" `
        -e "ASPNETCORE_ENVIRONMENT=Production" `
        -v "${mount}:/src" -w /src $SdkImage bash -lc $inner
    Log 'Migrations applied.'
}

function Section-weights {
    Log 'Section: weights (DVC pull of CNN model)'
    $existing = Get-ChildItem -Path "$AiDir/data/weights" -Recurse -Filter 'best_model.pth' -ErrorAction SilentlyContinue
    if ($existing) { Log 'Model weights already present - skipping dvc pull.'; return }
    if (-not (Get-Command dvc -ErrorAction SilentlyContinue)) {
        Die "dvc not installed. Run: pip install 'dvc[s3]'  (needed to fetch model weights from S3)."
    }
    $envMap = @{}
    foreach ($line in Get-Content .env) {
        if ($line -match '^\s*([^#=]+)=(.*)$') { $envMap[$matches[1].Trim()] = $matches[2] }
    }
    $env:AWS_ACCESS_KEY_ID     = $envMap['AWS_ACCESS_KEY_ID']
    $env:AWS_SECRET_ACCESS_KEY = $envMap['AWS_SECRET_ACCESS_KEY']
    $env:AWS_DEFAULT_REGION    = if ($envMap['AWS_REGION']) { $envMap['AWS_REGION'] } else { 'us-east-1' }
    Push-Location $AiDir
    try { dvc pull; if ($LASTEXITCODE -ne 0) { Die 'dvc pull failed - check AWS credentials and DVC S3 remote access.' } }
    finally { Pop-Location }
    Log 'Model weights pulled.'
}

function Section-apps {
    Log 'Section: apps (backend, ai, web, nginx)'
    docker @Compose up -d --build backend-core ai-service frontend-web nginx
    Log 'Backend is seeding the scientific catalog on first boot (idempotent).'
    Log 'Follow progress:  docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend-core'
}

function Section-verify {
    Log 'Section: verify'
    docker @Compose ps
}

# ── run ──────────────────────────────────────────────────────────────────────
if (-not (Test-Path docker-compose.prod.yml)) { Die 'Run from the repository root.' }
foreach ($s in $Sections) {
    if (Should-Run $s) { & "Section-$s" }
}
Log 'Done.'
