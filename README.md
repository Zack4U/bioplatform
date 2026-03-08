# BioPlatform Caldas

## Plataforma de Biodiversidad y Biocomercio con IA Generativa

[![Status](https://img.shields.io/badge/Status-Development-yellow.svg)]()
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]()
[![Python](https://img.shields.io/badge/Python-3.11-3776AB)]()

Plataforma digital integral para la identificación, catalogación y aprovechamiento sostenible de la biodiversidad del departamento de Caldas, Colombia.

---

## Características Principales

| Módulo                        | Descripción                                                          |
| ----------------------------- | -------------------------------------------------------------------- |
| **Catálogo de Biodiversidad** | Flora, fauna y hongos con información taxonómica y ecológica         |
| **Identificación con IA**     | CNN (ResNet50/EfficientNet) con >85% de precisión para 300+ especies |
| **Marketplace**               | Conexión productores-compradores con trazabilidad y pagos integrados |
| **RAG & Chatbot**             | Consultas especializadas y generación de planes de negocio           |
| **Compliance**                | Gestión de permisos ABS según normativa colombiana                   |
| **App Móvil**                 | Identificación en campo con soporte offline                          |

---

## Stack Tecnológico

```
Backend:    .NET 8 (Clean Architecture) + FastAPI (Python)
Frontend:   Next.js 14 + React Native (Expo)
Databases:  PostgreSQL (PostGIS) | SQL Server | Redis | MongoDB
AI/ML:      TensorFlow/PyTorch | LangChain | ChromaDB | OpenAI GPT-4
DevOps:     Docker | GitHub Actions | Nginx
```

---

## Requisitos Técnicos Comunes (Ajustados)

### Backend (.NET Core 8+)

- Clean Architecture / Hexagonal.
- CQRS con MediatR.
- Repository Pattern y Unit of Work.
- FluentValidation y AutoMapper (o Mapperly).
- xUnit con cobertura mínima 70%.

### Frontend (Next.js 14 - App Router)

- TypeScript obligatorio.
- Estado global (Zustand/Redux) y server state (React Query).
- UI con Shadcn/ui o Material-UI.
- Formularios con React Hook Form + Zod.
- Accesibilidad WCAG 2.1 AA y diseño responsive.

### IA y Datos

- Modelo predictivo entrenado y evaluado con métricas documentadas.
- Integración con LLMs (OpenAI, Gemini, etc.).
- RAG con embeddings y vector DB (ChromaDB o Pinecone).
- MLOps con MLflow o DVC.

### Seguridad y DevOps

- JWT con Refresh Tokens, RBAC y 2FA (TOTP).
- Rate limiting, sanitización de inputs y protección XSS/SQLi.
- Dockerfile multi-stage y Docker Compose.
- CI/CD en GitHub Actions o GitLab CI.

---

## Quick Start

### Requisitos

- Docker Desktop 4.x+
- .NET 8 SDK
- Node.js 18+
- Python 3.11+

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-organizacion/bioplatform.git
cd bioplatform

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (DB, OpenAI, Stripe, etc.)

# 3. Setup inicial (restaurar dependencias)
# Windows:
.\setup.ps1

# macOS/Linux:
bash setup.sh
```

### Ejecutar Servicios Locales

**Recomendación:** Usa el script bash que abre una terminal por cada servicio.

```bash
# macOS/Linux/Git Bash en Windows:
bash run.sh           # Levanta todo (docker + core + ai + web)
bash run.sh core ai   # Levanta solo backend y AI
```

**Servicios disponibles:** `docker`, `core`, `ai`, `web`, `mobile`, `all`

Ver [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md) para más detalles.

### Verificar Servicios (Alternativo)

### Puertos

| Servicio                | Puerto                |
| ----------------------- | --------------------- |
| Frontend Web            | http://localhost:3000 |
| Backend API             | http://localhost:5070 |
| AI Service              | http://localhost:8000 |
| ChromaDB (Vector Store) | http://localhost:8001 |
| PostgreSQL              | localhost:5433        |
| SQL Server              | localhost:1433        |
| Redis                   | localhost:6379        |
| Adminer (DB UI)         | http://localhost:8090 |
| pgAdmin                 | http://localhost:5050 |
| Seq (Logs)              | http://localhost:5341 |

---

## Documentación y Guías

| Documento                                                  | Descripción                                    |
| ---------------------------------------------------------- | ---------------------------------------------- |
| [DEVELOPMENT.md](./DEVELOPMENT.md)                         | Guía completa para desarrollo local            |
| [SCRIPTS_GUIDE.md](./SCRIPTS_GUIDE.md)                     | Uso de scripts de ejecución (run.sh / run.ps1) |
| [SETUP_SUMMARY.md](./SETUP_SUMMARY.md)                     | Resumen visual del setup                       |
| [CHANGELOG_DOCKER.md](./CHANGELOG_DOCKER.md)               | Cambios en estrategia Docker                   |
| [Getting Started](.docs/GETTING_STARTED.md)                | Guía completa de configuración inicial         |
| [Requirements](.docs/bioplatform/01-Requirements.md)       | Requerimientos funcionales y técnicos          |
| [Guidelines](.docs/bioplatform/02-Guidelines%20.md)        | Lineamientos generales del proyecto            |
| [Data Dictionary](.docs/bioplatform/03-Data_Dictionary.md) | Estructura de bases de datos                   |
| [Dev Guidelines](.docs/bioplatform/05-Dev_Guidelines.md)   | Estándares de desarrollo                       |

---

## Documentación Original

## Estructura del Proyecto

```
bioplatform/
├── .docs/                    # Documentación
├── .github/workflows/        # CI/CD
├── docker/
│   ├── nginx/               # Configuración reverse proxy
│   ├── postgres/            # Scripts init PostgreSQL
│   └── sqlserver/           # Scripts init SQL Server
├── src/
│   ├── Bio.Backend.Core/    # API .NET 8 (Clean Architecture)
│   ├── Bio.Backend.AI/      # Microservicio Python (FastAPI)
│   ├── Bio.Frontend.Web/    # Next.js 14
│   └── Bio.Frontend.Mobile/ # React Native (Expo)
├── .env.example
├── docker-compose.yml
└── docker-compose.override.yml
```

---

## Normativa Legal

Este proyecto cumple con:

- **Decreto 3016 de 2013** - Reglamentación de recursos genéticos
- **Decisión 391 de 1996** - Régimen Común sobre Acceso a Recursos Genéticos
- **Protocolo de Nagoya** - Acceso y participación en beneficios (ABS)

---

## Equipo

Universidad de Caldas - Proyecto Integrador 2025-2026

---

## Licencia

Este proyecto es de uso académico.
