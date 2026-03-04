# 🚀 Script de Ejecución - BioCommerce Caldas

## Overview

Usamos un único script bash (`run.sh`) para ejecutar todos los servicios de forma rápida y sencilla.

**Funciona en:**
- 🐧 Linux
- 🍎 macOS  
- 🪟 Windows (Git Bash o WSL)

**Servicios disponibles:**
- `docker` / `infra`: Infraestructura (Docker Compose)
- `core`: Backend .NET (port 5050)
- `ai`: AI Service Python (port 8000)
- `web`: Frontend Web Next.js (port 3000)
- `mobile`: Frontend Mobile Expo (port 19000)
- `all`: Todos los servicios

---

## Comando Básico

```bash
# Levanta TODO
bash run.sh

# O explícitamente
bash run.sh all
```

### Servicios Individuales

```bash
# Solo infraestructura
bash run.sh docker

# Solo backend
bash run.sh core

# Solo AI
bash run.sh ai

# Solo frontend web
bash run.sh web

# Solo frontend mobile
bash run.sh mobile
```

### Múltiples Servicios

```bash
# Levanta backend y AI (sin Docker)
bash run.sh core ai

# Levanta Docker, Backend y Frontend Web
bash run.sh docker core web
```

### Resultado

Cada servicio se abre en una **nueva ventana (bash) independiente**:

```
┌─────────────────────────┐
│ Docker Compose          │  (bash: docker-compose up -d)
└─────────────────────────┘
┌─────────────────────────┐
│ Backend .NET (5050)     │  (bash: dotnet watch run)
└─────────────────────────┘
┌─────────────────────────┐
│ AI Service (8000)       │  (bash: uvicorn app.main:app --reload)
└─────────────────────────┘
┌─────────────────────────┐
│ Frontend Web (3000)     │  (bash: npm run dev)
└─────────────────────────┘
```

### Tips para Git Bash

**Instalar Git Bash (si no lo tienes):**
1. Descargar desde https://git-scm.com/download/win
2. Instalar con opciones por defecto
3. Acceder desde: `Start > Git Bash` o Click derecho en carpeta > Git Bash Here

**Ejecutar el script:**
```bash
# Git Bash en el directorio del proyecto
bash run.sh all
```

**Notas:**
- Git Bash usa la ruta `/c/Users/...` en lugar de `C:\Users\...`
- Los comandos bash funcionan igual que en Linux/macOS
- Puedes usar todas las herramientas de Linux (grep, sed, etc.)

---

## 🧪 Ejecutar Tests

```bash
# Ejecutar todos los tests con descripción
dotnet test --logger "console;verbosity=detailed" src/Bio.Backend.Core/Bio.UnitTests/Bio.UnitTests.csproj
```

```bash
# Ejecutar todos los tests sin descripción
dotnet test src/Bio.Backend.Core/Bio.UnitTests/Bio.UnitTests.csproj
```

---

## macOS / Linux

### Requisito: tmux (opcional pero recomendado)

**macOS (Homebrew):**
```bash
brew install tmux
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt-get install tmux
```

Si no tienes tmux, el script abrirá terminales individuales automáticamente.

### Comando Básico

```bash
# Levanta TODO
bash run.sh

# O explícitamente
bash run.sh all
```

### Servicios Individuales

```bash
# Solo infraestructura
bash run.sh docker

# Solo backend
bash run.sh core

# Solo AI
bash run.sh ai

# Solo frontend
bash run.sh web

# Solo mobile
bash run.sh mobile
```

### Múltiples Servicios

```bash
# Levanta backend y AI
bash run.sh core ai

# Levanta todo excepto mobile
bash run.sh docker core ai web
```

### Con tmux (Recomendado)

Si tienes tmux instalado, cada servicio corre en una ventana separada dentro de la misma sesión.

**Ver todas las ventanas:**
```bash
tmux list-windows -t bioplatform
```

**Conectar a la sesión:**
```bash
tmux attach -t bioplatform
```

**Navegar en tmux:**
- `Ctrl+B + n` : siguiente ventana
- `Ctrl+B + p` : ventana anterior
- `Ctrl+B + w` : lista de ventanas
- `Ctrl+B + d` : desconectar (dejar corriendo en background)
- `Ctrl+B + x` : cerrar ventana actual

**Ejemplo completo:**
```bash
# Terminal 1: Ejecutar todo
bash run.sh all

# Terminal 2 (en otra ventana): Conectar a tmux
tmux attach -t bioplatform

# Dentro de tmux: navegar entre ventanas
Ctrl+B n  # ver Docker logs
Ctrl+B n  # ver Backend
Ctrl+B n  # ver AI
...

# Desconectar y dejar corriendo
Ctrl+B d

# Más tarde, reconectar
tmux attach -t bioplatform
```

---

## ⚡ Quick Start Completo

```bash
# Terminal 1
bash run.sh

# Espera a que se abran las ventanas de cada servicio
# Accede a http://localhost:3000
```

### macOS
```bash
# Terminal 1
bash run.sh

# Si instalaste tmux:
tmux attach -t bioplatform

# Navega con Ctrl+B + n
```

### Linux
```bash
# Terminal 1
bash run.sh

# Si instalaste tmux:
tmux attach -t bioplatform
```

---

## 📍 URLs Después de Ejecutar

| Servicio | URL | Estado |
|---|---|---|
| **Frontend Web** | http://localhost:3000 | Abierto en navegador |
| **Backend API** | http://localhost:5050 | Disponible con Swagger |
| **AI Service** | http://localhost:8000 | Disponible con Docs |
| **pgAdmin** | http://localhost:5050 | UI de PostgreSQL |
| **Adminer** | http://localhost:8090 | UI de SQL Server |
| **Seq** | http://localhost:5341 | Logs centralizados |

---

## 🔍 Troubleshooting

### Git Bash en Windows: "bash: run.sh: command not found"

Asegúrate de estar en el directorio correcto:
```bash
cd /c/Users/TuUsuario/Projects/bioplatform
bash run.sh
```

### "Port already in use"

Si un puerto está en uso:

**Git Bash / macOS / Linux:**
```bash
# Buscar proceso usando puerto 5050
netstat -ano | grep :5050  # Linux/Git Bash
lsof -i :5050             # macOS

# Matar el proceso
kill <PID>
```

### macOS/Linux: "venv not found"

Asegúrate de haber ejecutado el setup:
```bash
bash setup.sh
```

### macOS/Linux: Terminales no se abren (sin tmux)

Instala tmux:
```bash
brew install tmux  # macOS
sudo apt-get install tmux  # Linux
```

Or prueba con `gnome-terminal` en Linux.

---

## 💡 Tips y Trucos

### Ver logs en tiempo real

**Windows PowerShell:**
```powershell
# En otra ventana PowerShell
docker-compose logs -f
```

**Windows Git Bash:**
```bash
# En otra ventana Git Bash
docker-compose logs -f
```

### Detener un servicio específico

**Windows PowerShell:**
- Cierra la ventana del servicio (Ctrl+C o el botón X)

**Windows Git Bash:**
- Cierra la ventana bash del servicio (Ctrl+C o el botón X)

**macOS/Linux con tmux:**
```bash
# Abre el servicio que quieres detener
tmux select-window -t bioplatform:ai

# Presiona Ctrl+C para detenerlo
```

### Recargar un servicio sin cerrar otros

**Windows (PowerShell o Git Bash):**
1. Cierra la ventana del servicio (Ctrl+C o cerrar ventana)
2. Ejecuta de nuevo: `.\run.ps1 core` (PowerShell) o `bash run.sh core` (Git Bash)

**macOS/Linux:**
1. En tmux, ve a esa ventana
2. Presiona Ctrl+C
3. Ejecuta el comando nuevamente en esa ventana

---

## 📝 Scripts Disponibles

### run.ps1 (Windows PowerShell)
- Abre una ventana PowerShell por cada servicio
- Cada ventana es independiente
- Ctrl+C para detener un servicio

**Requisitos:**
- PowerShell (incluído en Windows)
- El proyecto tiene que estar en una ruta sin espacios (recomendado)

### run.sh (macOS/Linux)
- Usa tmux si está disponible (recomendado)
- Si no tmux, abre terminales individuales
- Mucho más flexible que Windows

**Requisitos:**
- bash (incluído en macOS/Linux)
- tmux (opcional pero recomendado)
- OR gnome-terminal/xterm (para Linux sin tmux)

---

## 🚨 Importante

**El script `.env` DEBE estar configurado** antes de ejecutar los servicios. Ver [DEVELOPMENT.md](./DEVELOPMENT.md) para más información.

```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Edita con tus valores
nano .env  # o usa tu editor favorito
```
