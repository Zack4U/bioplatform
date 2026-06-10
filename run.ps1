# ===========================================
# BioCommerce Caldas - Run Services Script (Windows PowerShell)
# Windows counterpart of run.sh — opens one PowerShell window per service.
# ===========================================
#
# Usage:
#   .\run.ps1                 # all services (docker, core, ai, web)
#   .\run.ps1 all
#   .\run.ps1 core ai         # only the listed services
#   .\run.ps1 docker core web
#
# Services: docker | infra, core, ai, web, mobile, all
# ===========================================
[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Services
)

$ErrorActionPreference = 'Stop'
$RootDir = $PSScriptRoot

# Default = all
if (-not $Services -or $Services.Count -eq 0 -or ($Services.Count -eq 1 -and $Services[0] -eq 'all')) {
    $Services = @('docker', 'core', 'ai', 'web')
}

# Opens a new PowerShell window in $WorkDir running $Command (stays open after exit).
function Open-Window {
    param($Title, $WorkDir, $Command)
    $full = Join-Path $RootDir $WorkDir
    if (-not (Test-Path $full)) {
        Write-Host "[X] Directorio no encontrado: $full" -ForegroundColor Red
        return
    }
    $inner = "`$host.UI.RawUI.WindowTitle = '$Title'; " +
             "Write-Host '=== $Title ===' -ForegroundColor Yellow; " +
             "Set-Location '$full'; $Command"
    Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $inner)
}

function Start-Service-Window {
    param($Service)
    Write-Host ''
    Write-Host '=======================================' -ForegroundColor Cyan
    Write-Host "> Iniciando: $Service" -ForegroundColor Cyan
    Write-Host '=======================================' -ForegroundColor Cyan

    switch ($Service.ToLower()) {
        { $_ -in 'docker', 'infra' } {
            Write-Host 'Infraestructura (Docker Compose)' -ForegroundColor Yellow
            Open-Window 'docker' '.' 'docker-compose up -d; docker-compose logs -f'
            Write-Host '[OK] Docker levantado' -ForegroundColor Green
        }
        'core' {
            Write-Host 'Backend .NET' -ForegroundColor Yellow
            Open-Window 'core' 'src/Bio.Backend.Core' 'dotnet watch run --project Bio.API/Bio.API.csproj'
            Write-Host '[OK] Backend iniciando...' -ForegroundColor Green
        }
        'ai' {
            Write-Host 'AI Service (Python)' -ForegroundColor Yellow
            # Activa el venv de la raiz (.venv\Scripts\Activate.ps1) antes de uvicorn.
            Open-Window 'ai' 'src/Bio.Backend.AI' '..\..\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload --port 8000'
            Write-Host '[OK] AI Service iniciando...' -ForegroundColor Green
        }
        'web' {
            Write-Host 'Frontend Web (Next.js)' -ForegroundColor Yellow
            Open-Window 'web' 'src/Bio.Frontend.Web' 'npm run dev'
            Write-Host '[OK] Frontend Web iniciando...' -ForegroundColor Green
        }
        'mobile' {
            Write-Host 'Frontend Mobile (Expo)' -ForegroundColor Yellow
            Open-Window 'mobile' 'src/Bio.Frontend.Mobile' 'npx expo start'
            Write-Host '[OK] Frontend Mobile iniciando...' -ForegroundColor Green
        }
        default {
            Write-Host "[!] Servicio desconocido: $Service" -ForegroundColor Red
        }
    }
}

# Header
Write-Host ''
Write-Host '+============================================================+' -ForegroundColor Green
Write-Host '|       BioPlatform Caldas - Development Orchestrator         |' -ForegroundColor Green
Write-Host '|                  OS: Windows (PowerShell)                  |' -ForegroundColor Green
Write-Host '+============================================================+' -ForegroundColor Green

$validServices = @('docker', 'infra', 'core', 'ai', 'web', 'mobile')
foreach ($svc in $Services) {
    if ($validServices -contains $svc.ToLower()) {
        Start-Service-Window $svc
        Start-Sleep -Seconds 1
    }
    else {
        Write-Host "[!] Servicio desconocido: $svc" -ForegroundColor Red
    }
}

Write-Host ''
Write-Host 'URLs de Acceso:' -ForegroundColor Yellow
Write-Host '   Frontend Web:   http://localhost:3000'
Write-Host '   Backend API:    http://localhost:5070'
Write-Host '   AI Service:     http://localhost:8000'
Write-Host ''
Write-Host 'Nota: Se ha abierto una ventana PowerShell independiente por cada servicio.' -ForegroundColor Yellow
