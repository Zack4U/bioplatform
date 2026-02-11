# Guía de Inicio - BioPlatform Caldas

Esta guía te ayudará a configurar y ejecutar el proyecto desde cero.

---

## 1. Requisitos Previos

### Software Necesario

| Herramienta | Versión Mínima | Verificar Instalación |
|-------------|----------------|----------------------|
| Docker Desktop | 4.x | `docker --version` |
| .NET SDK | 8.0 | `dotnet --version` |
| Node.js | 18.x LTS | `node --version` |
| Python | 3.11+ | `python --version` |
| Git | 2.x | `git --version` |

### Extensiones de VS Code Recomendadas

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-dotnettools.csharp",
    "ms-dotnettools.csdevkit",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma"
  ]
}
```

---

## 2. Clonar y Configurar el Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/tu-organizacion/bioplatform.git
cd bioplatform

# Crear ramas de desarrollo
git checkout -b develop
git push -u origin develop
```

---

## 3. Variables de Entorno

### 3.1 Copiar el archivo de ejemplo

```bash
cp .env.example .env
```

### 3.2 Configurar las variables críticas

Edita el archivo `.env` y completa las siguientes secciones:

#### Bases de Datos
```env
# SQL Server (Transacciones, Identity, Marketplace)
DB_SQL_SERVER=localhost
DB_SQL_PORT=1433
DB_SQL_DATABASE=BioCommerce_Transactional
DB_SQL_USER=sa
DB_SQL_PASSWORD=<TU_PASSWORD_SEGURA>

# PostgreSQL (Catálogo científico, GIS, AI Metadata)
DB_PG_HOST=localhost
DB_PG_PORT=5432
DB_PG_DATABASE=BioCommerce_Scientific
DB_PG_USER=postgres
DB_PG_PASSWORD=<TU_PASSWORD_SEGURA>

# Redis (Caché)
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Autenticación
```env
JWT_SECRET=<GENERA_UN_SECRET_DE_64_CARACTERES>
JWT_EXPIRATION_MINUTES=60
JWT_REFRESH_EXPIRATION_DAYS=7
```

#### APIs Externas (Obtener claves)
```env
# OpenAI - https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Stripe (Sandbox) - https://dashboard.stripe.com/test/apikeys
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

---

## 4. Levantar la Infraestructura con Docker

### 4.1 Iniciar todos los servicios

```bash
# Construir e iniciar contenedores
docker-compose up -d --build

# Verificar que todos los contenedores estén corriendo
docker-compose ps
```

### 4.2 Servicios y Puertos

| Servicio | Puerto Local | Descripción |
|----------|--------------|-------------|
| SQL Server | 1433 | Base de datos transaccional |
| PostgreSQL | 5432 | Catálogo científico + PostGIS |
| Redis | 6379 | Caché de sesiones y datos |
| MongoDB | 27017 | Logs y chat history (opcional) |
| Nginx | 80 / 443 | Gateway / Reverse Proxy |
| Backend .NET | 5000 | API REST principal |
| Backend AI | 8000 | Microservicio de IA (FastAPI) |
| Frontend Web | 3000 | Next.js App |

### 4.3 Verificar conexiones a bases de datos

```bash
# PostgreSQL
docker exec -it bioplatform-postgres psql -U postgres -c "\l"

# SQL Server
docker exec -it bioplatform-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P '<PASSWORD>' -Q "SELECT name FROM sys.databases"

# Redis
docker exec -it bioplatform-redis redis-cli ping
```

---

## 5. Configuración por Microservicio

### 5.1 Backend .NET Core 8 (Bio.Backend.Core)

#### Crear la estructura del proyecto

```bash
cd src

# Crear solución
dotnet new sln -n Bio.Backend.Core

# Crear proyectos por capa (Clean Architecture)
dotnet new classlib -n Bio.Domain -o Bio.Backend.Core/src/Bio.Domain
dotnet new classlib -n Bio.Application -o Bio.Backend.Core/src/Bio.Application
dotnet new classlib -n Bio.Infrastructure -o Bio.Backend.Core/src/Bio.Infrastructure
dotnet new webapi -n Bio.API -o Bio.Backend.Core/src/Bio.API

# Agregar proyectos a la solución
dotnet sln Bio.Backend.Core.sln add Bio.Backend.Core/src/Bio.Domain/Bio.Domain.csproj
dotnet sln Bio.Backend.Core.sln add Bio.Backend.Core/src/Bio.Application/Bio.Application.csproj
dotnet sln Bio.Backend.Core.sln add Bio.Backend.Core/src/Bio.Infrastructure/Bio.Infrastructure.csproj
dotnet sln Bio.Backend.Core.sln add Bio.Backend.Core/src/Bio.API/Bio.API.csproj

# Agregar referencias entre proyectos
cd Bio.Backend.Core/src
dotnet add Bio.Application/Bio.Application.csproj reference Bio.Domain/Bio.Domain.csproj
dotnet add Bio.Infrastructure/Bio.Infrastructure.csproj reference Bio.Application/Bio.Application.csproj
dotnet add Bio.API/Bio.API.csproj reference Bio.Infrastructure/Bio.Infrastructure.csproj
```

#### Instalar paquetes NuGet esenciales

```bash
# En Bio.Application
dotnet add Bio.Application package MediatR
dotnet add Bio.Application package FluentValidation
dotnet add Bio.Application package AutoMapper

# En Bio.Infrastructure
dotnet add Bio.Infrastructure package Microsoft.EntityFrameworkCore
dotnet add Bio.Infrastructure package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add Bio.Infrastructure package Microsoft.EntityFrameworkCore.SqlServer

# En Bio.API
dotnet add Bio.API package Serilog.AspNetCore
dotnet add Bio.API package Swashbuckle.AspNetCore
```

#### Ejecutar el backend

```bash
cd Bio.Backend.Core/src/Bio.API
dotnet restore
dotnet run
# API disponible en: https://localhost:5001 | http://localhost:5000
```

---

### 5.2 Backend AI - Python (Bio.Backend.AI)

#### Crear entorno virtual y estructura

```bash
cd src/Bio.Backend.AI

# Crear entorno virtual
python -m venv venv

# Activar entorno (Windows)
.\venv\Scripts\activate

# Activar entorno (Linux/Mac)
source venv/bin/activate
```

#### Instalar dependencias

```bash
pip install -r requirements.txt
```

#### Contenido de `requirements.txt`

```txt
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# AI & ML
torch==2.1.2
torchvision==0.16.2
tensorflow==2.15.0
langchain==0.1.4
openai==1.10.0
chromadb==0.4.22

# Image Processing
opencv-python==4.9.0.80
Pillow==10.2.0

# Database
asyncpg==0.29.0
sqlalchemy[asyncio]==2.0.25

# Utils
python-dotenv==1.0.0
pydantic==2.5.3
pydantic-settings==2.1.0
```

#### Ejecutar el microservicio

```bash
uvicorn app.main:app --reload --port 8000
# API disponible en: http://localhost:8000
# Docs: http://localhost:8000/docs
```

---

### 5.3 Frontend Web - Next.js 14 (Bio.Frontend.Web)

#### Crear proyecto Next.js

```bash
cd src

# Crear proyecto con TypeScript, Tailwind, ESLint, App Router
npx create-next-app@14 Bio.Frontend.Web --typescript --tailwind --eslint --app --src-dir

cd Bio.Frontend.Web
```

#### Instalar dependencias adicionales

```bash
# UI Components
npx shadcn-ui@latest init

# State Management & Data Fetching
npm install @tanstack/react-query zustand

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Maps & Visualization
npm install leaflet react-leaflet @types/leaflet

# HTTP Client
npm install axios
```

#### Configurar archivo `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'your-storage-bucket.blob.core.windows.net'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AI_API_URL: process.env.NEXT_PUBLIC_AI_API_URL,
  },
}

module.exports = nextConfig
```

#### Ejecutar el frontend

```bash
npm run dev
# App disponible en: http://localhost:3000
```

---

### 5.4 Frontend Móvil - React Native (Bio.Frontend.Mobile)

#### Crear proyecto con Expo

```bash
cd src

npx create-expo-app Bio.Frontend.Mobile --template blank-typescript
cd Bio.Frontend.Mobile
```

#### Instalar dependencias

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context

# Camera & Vision
npx expo install expo-camera expo-image-picker

# Storage & Offline
npx expo install @react-native-async-storage/async-storage
npx expo install expo-sqlite

# Maps & Location
npx expo install expo-location react-native-maps
```

#### Ejecutar en desarrollo

```bash
npx expo start
# Escanear QR con Expo Go (iOS/Android)
# o presionar 'w' para abrir en web
```

---

## 6. Migraciones de Base de Datos

### 6.1 SQL Server (EF Core)

```bash
cd src/Bio.Backend.Core/src/Bio.Infrastructure

# Crear migración inicial
dotnet ef migrations add InitialCreate --startup-project ../Bio.API

# Aplicar migraciones
dotnet ef database update --startup-project ../Bio.API
```

### 6.2 PostgreSQL (Habilitar PostGIS)

```sql
-- Conectarse a la base de datos y ejecutar:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 7. Seeders de Datos Iniciales

### 7.1 Roles del Sistema (SQL Server)

```sql
INSERT INTO Roles (name, description) VALUES
('Admin', 'Full system access'),
('Researcher', 'Can validate species and upload scientific data'),
('Entrepreneur', 'Can create products and sell in marketplace'),
('Community', 'Local communities sharing traditional knowledge'),
('Buyer', 'Can purchase products'),
('EnvironmentalAuthority', 'Verifies permits and sustainability');
```

### 7.2 Taxonomía Inicial (PostgreSQL)

```sql
INSERT INTO taxonomies (kingdom, phylum, family, genus) VALUES
('Plantae', 'Tracheophyta', 'Orchidaceae', 'Cattleya'),
('Plantae', 'Tracheophyta', 'Orchidaceae', 'Masdevallia'),
('Animalia', 'Chordata', 'Trochilidae', 'Coeligena'),
('Fungi', 'Basidiomycota', 'Agaricaceae', 'Agaricus');
```

---

## 8. Estructura Final de Carpetas

```
bioplatform/
├── .github/
│   └── workflows/
│       ├── backend-core.yml
│       ├── ai-service.yml
│       └── web-app.yml
├── .docs/
│   └── bioplatform/
│       ├── 01-Requirements.md
│       ├── 02-Guidelines.md
│       ├── 03-Data_Dictionary.md
│       └── 05-Dev_Guidelines.md
├── docker/
│   ├── nginx/
│   │   └── nginx.conf
│   ├── postgres/
│   │   └── init.sql
│   └── sqlserver/
│       └── init.sql
├── src/
│   ├── Bio.Backend.Core/
│   │   ├── src/
│   │   │   ├── Bio.Domain/
│   │   │   ├── Bio.Application/
│   │   │   ├── Bio.Infrastructure/
│   │   │   └── Bio.API/
│   │   ├── tests/
│   │   └── Dockerfile
│   ├── Bio.Backend.AI/
│   │   ├── app/
│   │   │   ├── api/
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   └── services/
│   │   ├── data/
│   │   │   ├── models_weights/
│   │   │   └── vector_store/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── Bio.Frontend.Web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── services/
│   │   └── Dockerfile
│   └── Bio.Frontend.Mobile/
│       ├── src/
│       └── app.json
├── .dockerignore
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docker-compose.override.yml
└── README.md
```

---

## 9. Flujo de Trabajo Git

### 9.1 Crear una nueva feature

```bash
# Partir siempre de develop actualizado
git checkout develop
git pull origin develop

# Crear rama de feature
git checkout -b feature/BIO-001-auth-login

# Hacer commits siguiendo Conventional Commits
git commit -m "feat(auth): add JWT token generation"
git commit -m "feat(auth): implement 2FA with TOTP"

# Push y crear PR
git push -u origin feature/BIO-001-auth-login
```

### 9.2 Convención de Commits

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formato (no afecta código) |
| `refactor` | Refactorización |
| `test` | Añadir o corregir tests |
| `chore` | Tareas de build, deps, etc. |

---

## 10. Comandos Útiles

### Docker

```bash
# Ver logs de un servicio
docker-compose logs -f backend-core

# Reiniciar un servicio específico
docker-compose restart ai-service

# Limpiar todo y empezar de cero
docker-compose down -v --rmi all
docker-compose up -d --build
```

### Backend .NET

```bash
# Ejecutar tests
dotnet test

# Generar cobertura
dotnet test --collect:"XPlat Code Coverage"

# Formatear código
dotnet format
```

### Frontend

```bash
# Lint y fix
npm run lint -- --fix

# Build de producción
npm run build

# Ejecutar tests
npm test
```

### Python AI

```bash
# Ejecutar tests
pytest

# Formatear código
black app/
isort app/

# Verificar tipos
mypy app/
```

---

## 11. Troubleshooting Común

### Error: Puerto ya en uso

```bash
# Windows - encontrar proceso usando el puerto
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### Error: Docker sin espacio

```bash
docker system prune -a --volumes
```

### Error: Migraciones EF Core

```bash
# Resetear migraciones
dotnet ef database drop --force
dotnet ef migrations remove
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

## 12. Próximos Pasos

1. **Semana 1-2:** Completar documento de visión y arquitectura
2. **Semana 3-4:** Implementar autenticación JWT + 2FA
3. **Semana 5-6:** CRUD de especies y catálogo básico
4. **Semana 7-8:** Entrenar modelo CNN para identificación

Consulta el [Plan de Ejecución](.docs/bioplatform/01-Requirements.md#6-plan-de-ejecución-16-semanas) para el cronograma completo.

---

**¿Preguntas?** Revisa la documentación en `.docs/bioplatform/` o contacta al equipo de desarrollo.
