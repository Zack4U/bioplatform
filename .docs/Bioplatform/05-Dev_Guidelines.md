# Lineamientos de Desarrollo y Estándares de Ingeniería

## Proyecto: Plataforma de Biodiversidad y Biocomercio (Caldas)

Este documento define los estándares técnicos, flujos de trabajo y arquitectura que todo el equipo de desarrollo debe seguir. El objetivo es garantizar la mantenibilidad, escalabilidad y el cumplimiento de la **Clean Architecture** y la normativa legal del proyecto.

## 

# **1\. Control de Versiones (Git Workflow)**

Utilizaremos una variación de **GitFlow** simplificada para soportar entregas por Sprints.

## **1.1. Estrategia de Ramas (Branching Strategy)**

* **main**: Código de producción estable. Solo acepta Merges desde develop (Release) o hotfix.  
* **develop**: Rama principal de integración. Contiene el código probado del Sprint actual.  
* **feature/\<ticket-id\>-\<short-description\>**: Ramas de desarrollo para nuevas funcionalidades.  
  * *Ejemplo:* feature/BIO-101-auth-login  
* **bugfix/\<ticket-id\>-\<short-description\>**: Correcciones de errores no críticos durante el sprint.  
  * *Ejemplo:* bugfix/BIO-202-fix-image-upload  
* **hotfix/\<short-description\>**: Parches urgentes para producción.  
  * *Ejemplo:* hotfix/security-patch-jwt

## **1.2. Convención de Commits (Conventional Commits)**

Todos los mensajes de commit deben seguir el estándar [Conventional Commits](https://www.conventionalcommits.org/) y ser escritos en **Inglés**.

**Formato:** \<type\>(\<scope\>): \<description\>

* **feat**: Nueva funcionalidad.  
* **fix**: Corrección de errores.  
* **docs**: Cambios solo en documentación.  
* **style**: Cambios de formato (espacios, comas) que no afectan el código.  
* **refactor**: Cambio de código que no arregla bugs ni añade funcionalidades (Clean Code).  
* **test**: Añadir o corregir tests.  
* **chore**: Actualización de tareas de build, dependencias, etc.

**Ejemplos:**

feat(auth): implement 2FA verification using TOTP

fix(vision-api): correct confidence score threshold

docs(readme): update deployment instructions

# **2\. Flujo de Pull Request (PR)**

Ningún código entra a develop sin pasar por este flujo:

1. **Self-Review:** El desarrollador debe revisar su propio código antes de abrir el PR.  
2. **CI Checks:** El pipeline de GitHub Actions debe pasar (Tests, Linting, Build).  
3. **Tamaño:** Los PRs no deben superar los **400 cambios de líneas** (excluyendo archivos generados) para facilitar la revisión.  
4. **Aprobación:** Se requiere al menos **1 aprobación** de un compañero (Backend o Frontend según corresponda).

## **Plantilla de Descripción del PR**

\#\# Description  
Breve descripción de qué hace este PR y por qué.

\#\# Related Ticket  
\[BIO-XXX\](Link al ticket de Jira/Trello)

\#\# Changes  
\- \[x\] Implementado servicio X  
\- \[x\] Agregado componente Y

\#\# How to Test  
1\. Loguearse como 'Investigador'  
2\. Ir a ruta '/species/upload'  
3\. ...

\#\# Screenshots / Evidence (Opcional)  
(Adjuntar imágenes o logs)

# **3\. Estructura de Carpetas:**

BioMarketplace-Caldas/  
├── .github/                        \# Workflows de GitHub Actions (CI/CD)  
│   ├── workflows/  
│   │   ├── backend-core.yml  
│   │   ├── ai-service.yml  
│   │   └── web-app.yml  
│  
├── .docs/                           \# Documentación del proyecto (Arquitectura, Manuales)  
│   ├── architecture/  
│   ├── api-specs/                  \# Swagger/OpenAPI jsons  
│   └── user-manuals/  
│  
├── infrastructure/                 \# Configuración de Infraestructura y DevOps  
│   ├── docker/  
│   │   ├── nginx/                  \# Configuración del Gateway  
│   │   │   ├── nginx.conf  
│   │   │   └── ssl/  
│   │   ├── postgres/               \# Scripts de init para DB Taxonomía  
│   │   ├── sqlserver/              \# Scripts de init para DB Transaccional  
│   │   └── prometheus/             \# Monitoreo (Opcional)  
│   └── k8s/                        \# Manifests para futuro despliegue (Kubernetes)  
│  
├── src/                            \# Código Fuente de todos los servicios  
│   │  
│   ├── Bio.Backend.Core/           \# \[SOLUCIÓN .NET 10 \- CLEAN ARCHITECTURE\]  
│   │   ├── src/  
│   │   │   ├── Bio.Domain/         \# Reglas de negocio puras, Entidades, Value Objects  
│   │   │   ├── Bio.Application/    \# Casos de uso, CQRS (Commands/Queries), Interfaces  
│   │   │   ├── Bio.Infrastructure/ \# EF Core, Repositorios, Servicios Externos (Stripe)  
│   │   │   └── Bio.API/            \# Controladores REST, DI Container, Entry Point  
│   │   ├── tests/                  \# Pruebas Unitarias e Integración (xUnit)  
│   │   └── Dockerfile              \# Dockerfile para el Core  
│   │  
│   ├── Bio.Backend.AI/             \# \[MICROSERVICIO PYTHON \- FASTAPI\]  
│   │   ├── app/  
│   │   │   ├── api/                \# Endpoints (v1/classify, v1/consult)  
│   │   │   ├── core/               \# Config, Seguridad, Logging  
│   │   │   ├── models/             \# Esquemas Pydantic (DTOs)  
│   │   │   └── services/           \# Lógica de negocio IA  
│   │   │       ├── vision/         \# Lógica de CNN, Pre-procesamiento imágenes  
│   │   │       └── rag/            \# Lógica LangChain, Prompts, ChromaDB  
│   │   ├── data/  
│   │   │   ├── models\_weights/     \# Archivos .h5 o .pt (Pesos entrenados)  
│   │   │   └── vector\_store/       \# Persistencia local de ChromaDB  
│   │   ├── requirements.txt  
│   │   └── Dockerfile              \# Dockerfile para IA  
│   │  
│   ├── Bio.Frontend.Web/           \# \[NEXT.JS 14 \- MARKETPLACE & ADMIN\]  
│   │   ├── public/                 \# Assets estáticos  
│   │   ├── src/  
│   │   │   ├── app/                \# App Router (Pages & Layouts)  
│   │   │   ├── components/         \# Shadcn/ui, Componentes Reutilizables  
│   │   │   ├── lib/                \# Utils, Axios/Fetch wrappers  
│   │   │   ├── hooks/              \# Custom Hooks (React Query)  
│   │   │   └── store/              \# Zustand Store  
│   │   └── Dockerfile  
│   │  
│   └── Bio.Frontend.Mobile/        \# \[REACT NATIVE \- EXPO\]  
│       ├── assets/  
│       ├── src/  
│       │   ├── components/  
│       │   ├── navigation/         \# Configuración de rutas  
│       │   ├── screens/            \# Pantallas (Camera, Catalog, Offline)  
│       │   ├── services/           \# Sincronización Offline, API Client  
│       │   └── database/           \# SQLite local config (WatermelonDB/SQLite)  
│       └── app.json  
│  
├── .dockerignore  
├── .env.example                    \# Variables de entorno plantilla  
├── docker-compose.yml              \# Orquestador Maestro  
├── docker-compose.override.yml     \# Configuración local (puertos expuestos)  
└── README.md

# **4\. Backend: .NET 10 (Clean Architecture)**

## **4.1. Estructura de Solución**

La solución debe respetar estrictamente la dependencia de capas: **Domain** no depende de nadie.

src/  
├── BioCommerce.Domain/          \# Núcleo: Entidades y Reglas de Negocio  
│   ├── Entities/                \# Clases POCO (Species, Product)  
│   ├── Enums/  
│   ├── Exceptions/              \# Excepciones de Dominio  
│   └── Interfaces/              \# Interfaces de Repositorios (IRepository)  
│  
├── BioCommerce.Application/     \# Casos de Uso (CQRS)  
│   ├── Features/  
│   │   ├── Species/  
│   │   │   ├── Queries/         \# GetSpeciesByIdQuery  
│   │   │   └── Commands/        \# CreateSpeciesCommand  
│   │   └── Products/  
│   ├── DTOs/  
│   ├── Behaviors/               \# MediatR Pipelines (Validation, Logging)  
│   └── Mappings/                \# AutoMapper Profiles  
│  
├── BioCommerce.Infrastructure/  \# Implementación técnica  
│   ├── Persistence/             \# DbContexts (PostgresDbContext, SqlDbContext)  
│   ├── Repositories/            \# Implementación de IRepository  
│   ├── Services/                \# Servicios externos (Stripe, Azure Storage)  
│   └── Migrations/  
│  
└── BioCommerce.API/             \# Entry Point  
    ├── Controllers/  
    ├── Middleware/              \# Global Error Handling  
    └── Program.cs

## **4.2. Estándares de Código C\#**

* **Naming:**  
  * Clases, Métodos, Propiedades: PascalCase (GetSpeciesById).  
  * Variables locales, parámetros: camelCase (speciesId).  
  * Interfaces: Prefijo I (ISpeciesRepository).  
* **Validaciones:** Usar **FluentValidation** en la capa de Aplicación, nunca en el Controlador.  
* **Controladores:** Deben ser "delgados" (Thin Controllers). Solo reciben la petición y la envían al Mediator.

# **5\. Backend IA: Python (FastAPI)**

## **5.1. Estructura de Proyecto**

ai-service/  
├── app/  
│   ├── api/  
│   │   ├── v1/  
│   │   │   └── endpoints/       \# Rutas (classify, generate-plan)  
│   ├── core/                    \# Config, Security  
│   ├── models/                  \# Pydantic models (Schemas)  
│   ├── services/  
│   │   ├── vision/              \# Lógica de CNN (ResNet50)  
│   │   └── rag/                 \# Lógica de LangChain  
│   └── main.py  
├── tests/  
├── requirements.txt  
└── Dockerfile

## **5.2. Estándares Python**

* Seguir **PEP 8**.  
* Uso obligatorio de **Type Hints** en todas las funciones.  
  def classify\_image(image\_bytes: bytes) \-\> ClassificationResult:  
* Manejo de errores con excepciones custom HTTP de FastAPI.

# **6\. Frontend: Next.js 14 (TypeScript)**

## **6.1. Principio: Separación de Lógica y UI**

Para evitar componentes gigantes ("Spaghetti Code"), separaremos estrictamente la vista de la lógica usando **Custom Hooks**.

* **Componente (.tsx):** Solo debe contener JSX y lógica de renderizado visual.  
* **Hook (.ts):** Contiene useState, useEffect, llamadas a API (React Query) y manejadores de eventos.

## **6.2. Estructura de Carpetas (App Router)**

src/  
├── app/                         \# Rutas (Pages)  
│   ├── (auth)/                  \# Route groups  
│   │   ├── login/page.tsx  
│   │   └── register/page.tsx  
│   ├── dashboard/page.tsx  
│   └── layout.tsx  
│  
├── components/                  \# UI Reutilizable  
│   ├── ui/                      \# Átomos (Button, Input) \- Shadcn/ui  
│   ├── features/                \# Organismos específicos  
│   │   ├── species/  
│   │   │   ├── SpeciesCard.tsx  
│   │   │   └── SpeciesForm.tsx  
│   │   └── marketplace/  
│   └── common/                  \# Navbar, Footer  
│  
├── hooks/                       \# Custom Hooks (Lógica)  
│   ├── useAuth.ts  
│   ├── features/  
│   │   └── useSpeciesSearch.ts  \# Lógica de búsqueda  
│   └── useDebounce.ts  
│  
├── lib/                         \# Utilidades y Configuración  
│   ├── axios.ts                 \# Instancia configurada de Axios  
│   ├── utils.ts                 \# Helpers (format dates, currency)  
│   └── validators/              \# Esquemas Zod  
│  
├── services/                    \# Llamadas a API  
│   ├── api.ts  
│   └── speciesService.ts  
│  
└── types/                       \# Definiciones TypeScript  
    └── species.d.ts

## **6.3. Ejemplo de Separación (Hook Pattern)**

**Archivo: hooks/features/useSpeciesForm.ts**

// Lógica de negocio, estados y validación  
export const useSpeciesForm \= () \=\> {  
  const \[isLoading, setIsLoading\] \= useState(false);  
  const { data: taxonomy } \= useQuery(\['taxonomy'\], getTaxonomy);

  const handleSubmit \= async (data: SpeciesDTO) \=\> {  
     // Logic to call API  
  };

  return { isLoading, taxonomy, handleSubmit };  
};

**Archivo: components/features/species/SpeciesForm.tsx**

// Solo UI  
import { useSpeciesForm } from '@/hooks/features/useSpeciesForm';

export const SpeciesForm \= () \=\> {  
  const { isLoading, handleSubmit } \= useSpeciesForm(); // Inyección de lógica

  return (  
    \<form onSubmit={handleSubmit}\>  
       \<Button loading={isLoading}\>Save Species\</Button\>  
    \</form\>  
  );  
};

# **7\. Base de Datos y Migraciones**

## **7.1. Convenciones de Nombres**

* **Tablas:** Plural\_Snake\_Case o PascalCase (dependiendo si es Postgres o SQL Server, se recomienda consistencia. Para este proyecto usaremos **snake\_case** en Postgres y **PascalCase** en SQL Server para respetar las convenciones nativas de cada motor, mapeadas correctamente en el ORM).  
* **Columnas:**  
  * Postgres: snake\_case (scientific\_name).  
  * SQL Server: snake\_case o PascalCase (Mapeado en Entity Framework). *Decisión: Usar nombres de propiedades C\# en el código, dejar que EF Core maneje el nombre en DB*.  
* **Keys:**  
  * PK: id (UUID).  
  * FK: entity\_name\_id (ej. species\_id).

## **7.2. Migraciones**

* Prohibido modificar la BD manualmente en producción.  
* **Entity Framework Core:** Usar migraciones (dotnet ef migrations add Name).  
* **Seeders:** Deben ser idempotentes (verificar si existe antes de insertar).

# **8\. Variables de Entorno y Seguridad**

## **8.1. Manejo de Secretos**

* **NUNCA** subir archivos .env al repositorio.  
* Usar .env.example para listar las variables requeridas sin valores reales.

## **8.2. Naming Standard**

Uso de UPPER\_SNAKE\_CASE.

\# .env.example  
\# Database  
DB\_CONNECTION\_STRING\_SQL=Server=...  
DB\_CONNECTION\_STRING\_PG=Host=...

\# Auth  
JWT\_SECRET=super\_secret\_key\_min\_32\_chars  
JWT\_EXPIRATION\_MINUTES=60

\# External APIs  
OPENAI\_API\_KEY=sk-...  
STRIPE\_PUBLIC\_KEY=pk\_test...

# **9\. Testing & QA**

Para que un PR sea aceptado, debe cumplir:

1. **Backend:** Coverage \> 70%. Pruebas unitarias para *Domain* y *Application*. Pruebas de integración para *Infrastructure*.  
2. **Frontend:** Pruebas de componentes críticos y flujos principales (E2E con Cypress/Playwright).  
3. **Linting:** Cero warnings en eslint y compilación limpia.

# **10\. Legal & Compliance en Código (Importante)**

Debido a la naturaleza del proyecto (Biodiversidad Caldas), se deben seguir estas reglas estrictas en el código:

1. **Sensitive Data Flag:** Al consultar la tabla Species, siempre verificar el flag is\_sensitive. Si es true, **NUNCA** devolver la latitud/longitud exacta al frontend público, solo el municipio.  
2. **ABS Check:** En el flujo de creación de Product, es obligatorio validar la existencia de un AbsPermit válido para la base\_species\_id si el producto es derivado.

