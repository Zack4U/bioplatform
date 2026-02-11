# BioPlatform Caldas

## Plataforma de Biodiversidad y Biocomercio con IA Generativa

[![Status](https://img.shields.io/badge/Status-Development-yellow.svg)]()
[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4)]()
[![Next.js](https://img.shields.io/badge/Next.js-14-black)]()
[![Python](https://img.shields.io/badge/Python-3.11-3776AB)]()

Plataforma digital integral para la identificación, catalogación y aprovechamiento sostenible de la biodiversidad del departamento de Caldas, Colombia.

---

## Características Principales

| Módulo | Descripción |
|--------|-------------|
| **Catálogo de Biodiversidad** | Flora, fauna y hongos con información taxonómica y ecológica |
| **Identificación con IA** | CNN (ResNet50/EfficientNet) con >85% de precisión para 300+ especies |
| **Marketplace** | Conexión productores-compradores con trazabilidad y pagos integrados |
| **RAG & Chatbot** | Consultas especializadas y generación de planes de negocio |
| **Compliance** | Gestión de permisos ABS según normativa colombiana |
| **App Móvil** | Identificación en campo con soporte offline |

---

## Stack Tecnológico

```
Backend:    .NET 10 (Clean Architecture) + FastAPI (Python)
Frontend:   Next.js 14 + React Native (Expo)
Databases:  PostgreSQL (PostGIS) | SQL Server | Redis | MongoDB
AI/ML:      TensorFlow/PyTorch | LangChain | ChromaDB | OpenAI GPT-4
DevOps:     Docker | GitHub Actions | Nginx
```

---

## Quick Start

### Requisitos

- Docker Desktop 4.x+
- .NET 10 SDK
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

# 3. Levantar servicios
docker-compose up -d --build

# 4. Verificar servicios
docker-compose ps
```

### Puertos

| Servicio | Puerto |
|----------|--------|
| Frontend Web | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| AI Service | http://localhost:8000 |
| PostgreSQL | localhost:5432 |
| SQL Server | localhost:1433 |
| Redis | localhost:6379 |
| Adminer (DB UI) | http://localhost:8080 |
| pgAdmin | http://localhost:5050 |

---

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [Getting Started](.docs/GETTING_STARTED.md) | Guía completa de configuración inicial |
| [Requirements](.docs/bioplatform/01-Requirements.md) | Requerimientos funcionales y técnicos |
| [Guidelines](.docs/bioplatform/02-Guidelines%20.md) | Lineamientos generales del proyecto |
| [Data Dictionary](.docs/bioplatform/03-Data_Dictionary.md) | Estructura de bases de datos |
| [Dev Guidelines](.docs/bioplatform/05-Dev_Guidelines.md) | Estándares de desarrollo |

---

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
│   ├── Bio.Backend.Core/    # API .NET 10 (Clean Architecture)
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
