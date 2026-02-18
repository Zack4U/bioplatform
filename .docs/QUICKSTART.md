# 🚀 BioPlatform Caldas - Quick Start Guide

Guía paso a paso para inicializar cada microservicio del proyecto y desplegar en desarrollo.

---

## 📋 Requisitos Previos

### Software Necesario

| Herramienta | Versión | Verificar |
|-------------|---------|----------|
| Docker Desktop | 4.x+ | `docker --version` |
| .NET SDK | 8.0+ | `dotnet --version` |
| Node.js | 18+ LTS | `node --version` |
| Python | 3.11+ | `python --version` |
| Git | 2.x+ | `git --version` |
| npm / yarn | 9+ | `npm --version` |

### Extensiones VS Code Recomendadas
- C# Dev Kit (`ms-dotnettools.csdevkit`)
- Python (`ms-python.python`)
- Pylance (`ms-python.vscode-pylance`)
- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- Tailwind CSS (`bradlc.vscode-tailwindcss`)
- Prisma (`prisma.prisma`)

---

# PARTE 1: Inicializar Microservicios

## 1️⃣ Clonar y Configurar Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-organizacion/bioplatform.git
cd bioplatform

# Crear rama de desarrollo local
git checkout -b develop
```

## 2️⃣ Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env
```

**Edita `.env` con estas secciones:**

```env
# ========== BASES DE DATOS ==========
# SQL Server (Transacciones)
DB_SQL_SERVER=localhost
DB_SQL_PORT=1433
DB_SQL_DATABASE=BioCommerce_Transactional
DB_SQL_USER=sa
DB_SQL_PASSWORD=BioPass@2026Secure

# PostgreSQL (Científico + PostGIS)
DB_PG_HOST=localhost
DB_PG_PORT=5432
DB_PG_DATABASE=biocommerce_scientific
DB_PG_USER=postgres
DB_PG_PASSWORD=BioPass@2026Secure

# Redis (Caché)
REDIS_HOST=localhost
REDIS_PORT=6379

# ========== SEGURIDAD ==========
JWT_SECRET=YOUR_VERY_LONG_SECRET_KEY_AT_LEAST_64_CHARACTERS_GENERATED_HERE
JWT_EXPIRATION_MINUTES=60
JWT_REFRESH_EXPIRATION_DAYS=7

# ========== APIs EXTERNAS ==========
OPENAI_API_KEY=sk-XXX...  # Obtener de https://platform.openai.com
STRIPE_PUBLIC_KEY=pk_test_XXX...
STRIPE_SECRET_KEY=sk_test_XXX...

# ========== AMBIENTE ==========
ASPNETCORE_ENVIRONMENT=Development
NODE_ENV=development
```

---

## 3️⃣ Inicializar Backend .NET 8 (Bio.Backend.Core)

### Crear estructura de proyecto (si no existe)

```bash
cd src

# 1. Crear la carpeta principal del backend
mkdir Bio.Backend.Core
cd Bio.Backend.Core

# 2. Crear la solución (.sln)
dotnet new sln -n Bio.Backend.Core

# 3. Configurar Nuget
dotnet nuget add source https://api.nuget.org/v3/index.json -n nuget.org

# 4. Crear proyectos por capa (Clean Architecture)
dotnet new classlib -n Bio.Domain -f net8.0
dotnet new classlib -n Bio.Application -f net8.0
dotnet new classlib -n Bio.Infrastructure -f net8.0
dotnet new webapi -n Bio.API -f net8.0 --use-controllers

# 5. Agregar proyectos a la solución
dotnet sln add Bio.Domain/Bio.Domain.csproj
dotnet sln add Bio.Application/Bio.Application.csproj
dotnet sln add Bio.Infrastructure/Bio.Infrastructure.csproj
dotnet sln add Bio.API/Bio.API.csproj

# Application depende de Domain
dotnet add Bio.Application/Bio.Application.csproj reference Bio.Domain/Bio.Domain.csproj

# Infrastructure depende de Application y Domain
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj reference Bio.Application/Bio.Application.csproj
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj reference Bio.Domain/Bio.Domain.csproj

# API depende de Infrastructure
dotnet add Bio.API/Bio.API.csproj reference Bio.Infrastructure/Bio.Infrastructure.csproj

cd ..
```

### Instalar paquetes NuGet esenciales

```bash
# --- 1. CAPA APPLICATION (Lógica) ---
dotnet add Bio.Application/Bio.Application.csproj package MediatR
dotnet add Bio.Application/Bio.Application.csproj package FluentValidation.DependencyInjectionExtensions
dotnet add Bio.Application/Bio.Application.csproj package AutoMapper

# --- 2. CAPA INFRASTRUCTURE (Datos y Servicios) ---
# EF Core y Bases de Datos
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj package Microsoft.EntityFrameworkCore
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj package Microsoft.EntityFrameworkCore.SqlServer
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj package Microsoft.EntityFrameworkCore.Design

# Rendimiento (Redis y Dapper)
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj package StackExchange.Redis
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj package Dapper

# Servicios (Stripe y Hangfire Storage)
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj package Stripe.net
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj package Hangfire.SqlServer

# --- 3. CAPA API (Web y Seguridad) ---
# Documentación y Logs
dotnet add Bio.API/Bio.API.csproj package Swashbuckle.AspNetCore
dotnet add Bio.API/Bio.API.csproj package Serilog.AspNetCore

# Autenticación JWT
dotnet add Bio.API/Bio.API.csproj package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add Bio.API/Bio.API.csproj package System.IdentityModel.Tokens.Jwt

# Servidor de Tareas (Hangfire)
dotnet add Bio.API/Bio.API.csproj package Hangfire.AspNetCore
dotnet add Bio.API/Bio.API.csproj package Hangfire.Core
```

## Crear Estructura de Carpetas Interna

```bash
# Crear carpetas en Domain
mkdir -p Bio.Domain/Entities
mkdir -p Bio.Domain/Enums
mkdir -p Bio.Domain/Exceptions
mkdir -p Bio.Domain/Interfaces

# Crear carpetas en Application (CQRS)
mkdir -p Bio.Application/Features/Species/Queries
mkdir -p Bio.Application/Features/Species/Commands
mkdir -p Bio.Application/Features/Products
mkdir -p Bio.Application/DTOs
mkdir -p Bio.Application/Behaviors
mkdir -p Bio.Application/Mappings

# Crear carpetas en Infrastructure
mkdir -p Bio.Infrastructure/Persistence
mkdir -p Bio.Infrastructure/Repositories
mkdir -p Bio.Infrastructure/Services
mkdir -p Bio.Infrastructure/Migrations

# Crear carpetas en API
mkdir -p Bio.API/Middleware
```

### Ejecutar el backend en desarrollo

```bash
# Desde Bio.Backend.Core/

# 1. Restaurar todas las dependencias NuGet
dotnet restore

# 2. Compilar la solución completa
dotnet build --configuration Debug

# 3. Ejecutar el proyecto API
cd Bio.API
dotnet run --configuration Debug

# API disponible en:
# 🔗 http://localhost:5000 (HTTP)
# 🔗 https://localhost:5001 (HTTPS)
# 📚 Swagger: http://localhost:5000/swagger
```

**Nota importante:** Antes de ejecutar, asegúrate de que:
- Las **bases de datos PostgSQL y SQL Server estén corriendo** (vía Docker Compose o instaladas localmente)
- El archivo `.env` esté configurado en la raíz del proyecto con las cadenas de conexión correctas

---

## 4️⃣ Inicializar Frontend Web (Bio.Frontend.Web)

### Crear proyecto Next.js 14

```bash
cd src

# Crear proyecto Next.js con TypeScript
npx create-next-app@latest Bio.Frontend.Web --typescript --tailwind --app
# Responde "Yes" a todas las preguntas excepto Vite (use App Router)

cd Bio.Frontend.Web
```

### Instalar dependencias principales

```bash
npm install

# State Management
npm install zustand

# Server State & Data Fetching
npm install @tanstack/react-query axios

# UI Components
npm install shadcn-ui lucide-react clsx class-variance-authority

# Forms
npm install react-hook-form zod @hookform/resolvers

# Utilities
npm install date-fns lodash-es

# Development
npm install --save-dev tailwindcss postcss autoprefixer
npm install --save-dev typescript @types/react @types/node
```

### Ejecutar en desarrollo

```bash
npm run dev

# Frontend disponible en:
# 🔗 http://localhost:3000
```

---

## 5️⃣ Inicializar Backend AI (Bio.Backend.AI)

### Crear entorno virtual Python

```bash
cd src/Bio.Backend.AI

# Crear entorno virtual
python -m venv venv

# Activar (Windows)
.\venv\Scripts\activate

# Activar (Linux/Mac)
source venv/bin/activate
```

### Crear estructura de carpetas

```bash
mkdir -p app/{api,core,models,services}
mkdir -p data/{weights,vector_store}
mkdir -p tests
```

### Instalar dependencias Python

```bash
# Crear requirements.txt
cat > requirements.txt << 'EOF'
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0
requests==2.31.0
numpy==1.24.3
pandas==2.0.3
scikit-learn==1.3.2
tensorflow==2.15.0
torch==2.1.0
torchvision==0.16.0
langchain==0.1.0
chromadb==0.4.10
openai==1.3.0
pillow==10.0.1
opencv-python==4.8.0
pytest==7.4.3
pytest-asyncio==0.21.1
pydantic-settings==2.1.0
EOF

# Instalar dependencias
pip install -r requirements.txt
```

### Crear estructura base del microservicio

```bash
# Crear main.py
cat > main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="BioPlatform AI Service",
    description="Microservicio de IA para identificación de especies",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "bio-ai"}

@app.get("/docs")
async def swagger():
    return {"message": "API Docs available at /docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
EOF
```

### Ejecutar en desarrollo

```bash
python main.py

# API disponible en:
# 🔗 http://localhost:8000
# 📚 Docs: http://localhost:8000/docs
```

---

## 6️⃣ Inicializar Mobile (Bio.Frontend.Mobile)

### Crear proyecto React Native con Expo

```bash
cd src

# Crear app Expo
npx create-expo-app Bio.Frontend.Mobile

cd Bio.Frontend.Mobile
```

### Instalar dependencias

```bash
npm install

# Navigation
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack
npm install react-native-screens react-native-safe-area-context

# Database (Offline-first)
npm install watermelondb @nozbe/watermelondb

# Camera & Vision
npm install react-native-vision-camera

# State Management
npm install zustand

# Forms
npm install react-hook-form zod

# API
npm install axios

# Storage
npm install @react-native-async-storage/async-storage
```

### Ejecutar en desarrollo

```bash
# Iniciar servidor Expo
npm start

# Opción 1: Abrir en Android Emulator
# Presiona 'a'

# Opción 2: Abrir en iOS Simulator (solo Mac)
# Presiona 'i'

# Opción 3: Abrir en tu teléfono
# Escanea el QR con Expo Go app
```

---

## 7️⃣ Inicializar Bases de Datos

### PostgreSQL (Catálogo Científico)

```bash
# Conectarse a PostgreSQL (después de que Docker esté levantado)
psql -h localhost -U postgres -d biocommerce_scientific

# Ejecutar script de inicialización
\i docker/postgres/init.sql

# Crear extensión PostGIS (para geolocalización)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

### SQL Server (Transaccional)

```bash
# Conectarse a SQL Server
sqlcmd -S localhost -U sa -P 'BioPass@2026Secure'

# Ejecutar script de inicialización
:r docker/sqlserver/init.sql
```

---

# PARTE 2: Desplegar en Modo Desarrollo

## 🐳 Opción A: Desplegar con Docker Compose

### Paso 1: Preparar docker-compose.yml

El archivo `docker-compose.yml` ya incluye todos los servicios. Verifica que tenga:

```yaml
version: '3.8'

services:
  # Bases de datos
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: biocommerce_scientific
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: BioPass@2026Secure
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: BioPass@2026Secure
      MSSQL_PID: Developer
    ports:
      - "1433:1433"
    volumes:
      - sqlserver_data:/var/opt/mssql
      - ./docker/sqlserver/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Backend .NET
  backend:
    build:
      context: ./src/Bio.Backend.Core
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
      - "5001:5001"
    environment:
      ASPNETCORE_ENVIRONMENT: Development
      ASPNETCORE_URLS: http://+:5000
      ConnectionStrings__PostgreSQL: Host=postgres;Port=5432;Database=biocommerce_scientific;Username=postgres;Password=BioPass@2026Secure
      ConnectionStrings__SqlServer: Server=sqlserver,1433;Initial Catalog=BioCommerce_Transactional;User Id=sa;Password=BioPass@2026Secure
    depends_on:
      - postgres
      - sqlserver
      - redis

  # Backend AI
  ai-service:
    build:
      context: ./src/Bio.Backend.AI
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - postgres

  # Frontend Web
  web:
    build:
      context: ./src/Bio.Frontend.Web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:5000
      NEXT_PUBLIC_AI_URL: http://localhost:8000

  # Nginx (Gateway)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - web

volumes:
  postgres_data:
  sqlserver_data:
  redis_data:
```

### Paso 2: Levantar todos los servicios

```bash
# Desde la raíz del proyecto
docker-compose up -d --build

# Verificar que todos estén corriendo
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f ai-service
docker-compose logs -f web
```

### Paso 3: Verificar servicios

```bash
# Backend .NET
curl http://localhost:5000/swagger

# AI Service
curl http://localhost:8000/docs

# Frontend Web
curl http://localhost:3000

# PostgreSQL
docker exec -it bioplatform-postgres psql -U postgres -d biocommerce_scientific -c "\d"

# SQL Server
docker exec -it bioplatform-sqlserver sqlcmd -S localhost -U sa -P 'BioPass@2026Secure' -Q "SELECT name FROM sys.databases"

# Redis
docker exec -it bioplatform-redis redis-cli ping
```

### Paso 4: Detener servicios

```bash
# Detener todos
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: Borra datos)
docker-compose down -v

# Reiniciar todo
docker-compose restart
```

---

## 🔧 Opción B: Desplegar Manualmente (Sin Docker)

### Backend .NET 8

```bash
# Desde la raíz del proyecto (BioMarketplace-Caldas/)

# 1. Navegar al backend
cd src/Bio.Backend.Core

# 2. Restaurar todas las dependencias NuGet
dotnet restore

# 3. Compilar la solución
dotnet build --configuration Debug

# 4. Ejecutar el API
cd src/Bio.API
dotnet run --configuration Debug

# Backend disponible en: http://localhost:5000
```

**Alternativa (si tienes Entity Framework Core Migrations):**
```bash
# Desde Bio.Backend.Core/src/Bio.API
# Aplicar migraciones a la base de datos
dotnet ef database update --project ../Bio.Infrastructure

# Luego ejecutar
dotnet run --configuration Debug
```

### Frontend Next.js 14

```bash
# 1. Instalar dependencias
cd src/Bio.Frontend.Web
npm install

# 2. Configurar variables de entorno
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AI_URL=http://localhost:8000
EOF

# 3. Ejecutar en desarrollo
npm run dev

# Frontend en: http://localhost:3000
```

### Backend AI (FastAPI)

```bash
# 1. Activar entorno virtual
cd src/Bio.Backend.AI
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Ejecutar
python main.py

# AI Service en: http://localhost:8000
```

### Mobile (Expo)

```bash
cd src/Bio.Frontend.Mobile

# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
npm start

# Escanea QR con Expo Go o usa emulador
```

### Bases de Datos (Sin Docker)

#### PostgreSQL (requiere instalación local)

```bash
# Windows
psql -h localhost -U postgres -d biocommerce_scientific

# Linux
psql -h localhost -U postgres -d biocommerce_scientific

# Mac
psql -h localhost -U postgres -d biocommerce_scientific

# Ejecutar init script
\i docker/postgres/init.sql
```

#### SQL Server (requiere instalación local)

```bash
# Windows
sqlcmd -S localhost -U sa -P 'BioPass@2026Secure'

# Linux
sqlcmd -S localhost -U sa -P 'BioPass@2026Secure'

# Ejecutar
:r docker/sqlserver/init.sql
```

#### Redis (requiere instalación local)

```bash
# Windows (con Chocolatey)
choco install redis-64

# Linux
sudo apt-get install redis-server

# Mac
brew install redis

# Iniciar Redis
redis-server
```

---

## 📊 Resumen de Puertos Locales

| Servicio | Puerto | URL |
|----------|--------|-----|
| **SQL Server** | 1433 | localhost:1433 |
| **PostgreSQL** | 5432 | localhost:5432 |
| **Redis** | 6379 | localhost:6379 |
| **Backend API** | 5000 | http://localhost:5000 |
| **Backend Swagger** | 5000 | http://localhost:5000/swagger |
| **AI Service** | 8000 | http://localhost:8000 |
| **AI Docs** | 8000 | http://localhost:8000/docs |
| **Frontend Web** | 3000 | http://localhost:3000 |
| **Nginx Gateway** | 80 | http://localhost |
| **Nginx HTTPS** | 443 | https://localhost |

---

## 🔍 Troubleshooting

### Puerto ya en uso

```bash
# Encontrar proceso usando puerto (ejemplo: 5000)
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000

# Matar proceso
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>
```

### Docker error de conexión a bases de datos

```bash
# Esperar a que los servicios estén listos
docker-compose up -d
sleep 30  # Esperar inicialización
docker-compose logs
```

### Base de datos corrupta

```bash
# Limpiar volúmenes y reiniciar
docker-compose down -v
docker-compose up -d --build
```

### Problemas con .NET

```bash
# Limpiar cache y re-buildear
cd src/Bio.Backend.Core
dotnet clean
dotnet build
```

---

## ✅ Checklist de Verificación

- [ ] Cloné el repositorio
- [ ] Configuré `.env` con las claves correctas
- [ ] Instalé todas las herramientas requeridas
- [ ] Backend .NET inicia sin errores en puerto 5000
- [ ] Frontend Next.js inicia en puerto 3000
- [ ] AI Service (FastAPI) inicia en puerto 8000
- [ ] Bases de datos están accesibles
- [ ] Redis está corriendo
- [ ] Docker Compose levanta todos los servicios
- [ ] Puedo acceder a Swagger en http://localhost:5000/swagger
- [ ] Puedo acceder a FastAPI Docs en http://localhost:8000/docs

---

## 📚 Próximos Pasos

1. **Crear primer endpoint**: [Ver guía de Backend](./Bioplatform/05-Dev_Guidelines.md)
2. **Agregar página en Frontend**: [Ver guía de Frontend](./Bioplatform/03-Frontend.md)
3. **Entrenar modelo de IA**: [Ver guía de AI](./Bioplatform/04-AI_Guidelines.md)
4. **Configurar CI/CD**: [Ver GitHub Actions](../.github/workflows/)

---

**¡Listo! Ya podes empezar a desarrollar en BioPlatform Caldas 🚀**
