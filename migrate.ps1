# ===========================================
# BioCommerce Caldas - Database Migrations Script (Windows PowerShell)
# Windows counterpart of migrate.sh — same EF Core invocation (-p / -s).
# ===========================================
[CmdletBinding()]
param(
    # Optional non-interactive args. When omitted the script prompts.
    [ValidateSet('BioDbContext', 'ScientificDbContext', 'Both')] [string]$Context,
    [string]$Name
)

$ErrorActionPreference = 'Stop'

# Rutas
$RootDir = $PSScriptRoot
$CoreDir = Join-Path $RootDir 'src/Bio.Backend.Core'

function Write-Header {
    Write-Host '+============================================================+' -ForegroundColor Cyan
    Write-Host '|        BioCommerce - Migraciones y Actualizaciones         |' -ForegroundColor Cyan
    Write-Host '+============================================================+' -ForegroundColor Cyan
    Write-Host ''
}

function Die { param($m) Write-Host "[migrate:error] $m" -ForegroundColor Red; exit 1 }

Write-Header

# 1. Elegir contexto (prompt si no vino por parametro)
if (-not $Context) {
    Write-Host 'Selecciona el contexto para la migracion:' -ForegroundColor Yellow
    Write-Host '1) BioDbContext (Transaccional - SQL Server)'
    Write-Host '2) ScientificDbContext (Cientifica - PostgreSQL)'
    Write-Host '3) Ambas'
    $opt = Read-Host 'Opcion [1-3]'
    switch ($opt) {
        '1' { $Context = 'BioDbContext' }
        '2' { $Context = 'ScientificDbContext' }
        '3' { $Context = 'Both' }
        default { Die 'Opcion invalida. Saliendo...' }
    }
}

$contexts = if ($Context -eq 'Both') { @('BioDbContext', 'ScientificDbContext') } else { @($Context) }

# 2. Nombre de migracion (prompt si no vino por parametro)
if (-not $Name) {
    Write-Host ''
    Write-Host 'Ingresa el nombre de la migracion (ej. InitialCreate):' -ForegroundColor Yellow
    $Name = Read-Host '>'
}
if ([string]::IsNullOrWhiteSpace($Name)) {
    Die 'El nombre de la migracion no puede estar vacio. Saliendo...'
}

# Verificar directorio core
if (-not (Test-Path $CoreDir)) {
    Write-Host "Error: No se encontro el directorio $CoreDir" -ForegroundColor Red
    Die 'Asegurate de ejecutar este script desde la raiz del proyecto.'
}

# Ejecutar comando con manejo de errores
function Invoke-Step {
    param($Arguments, $Desc)
    Write-Host "> $Desc..." -ForegroundColor Yellow
    Write-Host "  Comando: dotnet $($Arguments -join ' ')"
    & dotnet @Arguments
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Error al ejecutar: $Desc" -ForegroundColor Red
        Die 'Revisa los logs arriba para mas detalles.'
    }
    Write-Host "[OK] Exito: $Desc" -ForegroundColor Green
}

Write-Host ''
Write-Host "Iniciando proceso para: $($contexts -join ', ')" -ForegroundColor Cyan
Write-Host ''

Push-Location $CoreDir
try {
    foreach ($ctx in $contexts) {
        Write-Host '=================================================' -ForegroundColor Cyan
        Write-Host " Procesando contexto: $ctx " -ForegroundColor Cyan
        Write-Host '=================================================' -ForegroundColor Cyan

        Invoke-Step @('ef', 'migrations', 'add', $Name, '--context', $ctx, '-p', 'Bio.Infrastructure', '-s', 'Bio.API') `
            "Creando migracion '$Name' para $ctx"
        Write-Host ''
        Invoke-Step @('ef', 'database', 'update', '--context', $ctx, '-p', 'Bio.Infrastructure', '-s', 'Bio.API') `
            "Actualizando base de datos para $ctx"
        Write-Host ''
    }
}
finally {
    Pop-Location
}

Write-Host 'Proceso completado exitosamente para todas las bases de datos seleccionadas.' -ForegroundColor Green
Write-Host ''
