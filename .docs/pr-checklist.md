---
description: Guía global de validación pre-PR para todos los proyectos del monorepo BioCommerce Caldas
---

# ✅ Guía de Validación Pre-PR — BioCommerce Caldas

> Ejecuta los checks correspondientes al proyecto que modificaste **antes** de crear tu Pull Request.
> El CI de GitHub Actions ejecuta exactamente estas mismas validaciones.

---

## 🐍 Bio.Backend.AI (Python / FastAPI)

**Directorio:** `src/Bio.Backend.AI`
**CI Workflow:** `.github/workflows/ai-service.yaml`

```bash
cd src/Bio.Backend.AI

# 1. Activar venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# 2. Lint con flake8 — errores críticos (syntax errors, nombres indefinidos)
// turbo
flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics

# 3. Lint con flake8 — todas las reglas (complejidad ≤10, líneas ≤127)
// turbo
flake8 . --count --max-complexity=10 --max-line-length=127 --statistics

# 4. Type Check con mypy (warning-only por ahora)
// turbo
mypy app/ --ignore-missing-imports --disallow-untyped-defs || true

# 5. Tests con cobertura (mínimo 60%)
pytest tests/ --cov=app --cov-report=term-missing --cov-fail-under=60
```

### Reglas clave

| Regla                       | Valor                                    |
| --------------------------- | ---------------------------------------- |
| Max complejidad ciclomática | **10**                                   |
| Max longitud de línea       | **127 caracteres**                       |
| Cobertura mínima tests      | **60%**                                  |
| Type hints                  | Obligatorias (`--disallow-untyped-defs`) |
| Estilo                      | PEP 8, `snake_case`                      |

---

## ⚙️ Bio.Backend.Core (.NET 8 / C#)

**Directorio:** `src/Bio.Backend.Core`
**CI Workflow:** `.github/workflows/backend-core.yaml`

```bash
cd src/Bio.Backend.Core

# 1. Restaurar dependencias
// turbo
dotnet restore Bio.Backend.Core.sln

# 2. Verificar formato del código (falla si hay cambios pendientes)
// turbo
dotnet format Bio.Backend.Core.sln --verify-no-changes --verbosity diagnostic

# 3. Build en Release con warnings como errores
// turbo
dotnet build Bio.Backend.Core.sln --no-restore -c Release -warnaserror

# 4. Tests con cobertura (mínimo 70%)
dotnet test Bio.Backend.Core.sln --no-build -c Release --verbosity normal --collect:"XPlat Code Coverage"
```

### Reglas clave

| Regla                  | Valor                                         |
| ---------------------- | --------------------------------------------- |
| Formato código         | `dotnet format` (cero diferencias)            |
| Warnings en build      | **Tratados como errores** (`-warnaserror`)    |
| Cobertura mínima tests | **70%**                                       |
| Framework tests        | xUnit + Moq                                   |
| Naming                 | `PascalCase` clases/métodos, `ISomeInterface` |

---

## 🌐 Bio.Frontend.Web (Next.js 14 / TypeScript)

**Directorio:** `src/Bio.Frontend.Web`
**CI Workflow:** `.github/workflows/web-app.yaml`

```bash
cd src/Bio.Frontend.Web

# 1. Instalar dependencias (si es necesario)
// turbo
npm ci

# 2. ESLint — política de cero warnings
// turbo
npx eslint . --max-warnings=0

# 3. Type Check con TypeScript
// turbo
npx tsc --noEmit

# 4. Build de producción (verifica que compila sin errores)
npm run build
```

### Reglas clave

| Regla                      | Valor                                |
| -------------------------- | ------------------------------------ |
| ESLint warnings permitidas | **0** (cero tolerancia)              |
| TypeScript                 | `--noEmit` strict check              |
| Build producción           | Debe completar sin errores           |
| Lenguaje                   | TypeScript obligatorio               |
| Naming                     | `camelCase` para variables/funciones |

---

## 🐳 Docker & Infraestructura

**Archivos:** `docker-compose.yml`, `docker-compose.override.yml`, `docker-compose.prod.yml`, `docker/`, `**/Dockerfile`
**CI Workflow:** `.github/workflows/docker-compose.yaml`

```bash
# 1. Validar sintaxis docker-compose principal
// turbo
docker compose -f docker-compose.yml config --quiet

# 2. Validar override (dev)
// turbo
docker compose -f docker-compose.yml -f docker-compose.override.yml config --quiet

# 3. Validar producción
// turbo
docker compose -f docker-compose.yml -f docker-compose.prod.yml config --quiet

# 4. Lint de Dockerfiles con Hadolint (ignorar DL3008, DL3013)
# Instalar: https://github.com/hadolint/hadolint
// turbo
hadolint docker/**/Dockerfile --ignore DL3008 --ignore DL3013
```

### Reglas clave

| Regla              | Valor                                  |
| ------------------ | -------------------------------------- |
| Validación compose | Las 3 variantes deben ser válidas      |
| Hadolint ignores   | `DL3008` (apt pin), `DL3013` (pip pin) |
| Dockerfiles        | Multi-stage recomendado                |

---

## 📝 Reglas Globales (todos los proyectos)

### Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope>): <descripción>
```

- **Tipos:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- **Ejemplo:** `feat(auth): add jwt refresh token rotation`

### Branches

| Branch                 | Propósito                        |
| ---------------------- | -------------------------------- |
| `main`                 | Producción (protegida)           |
| `develop`              | Integración (branch por defecto) |
| `feature/BIO-XXX-desc` | Nuevas features                  |
| `fix/BIO-XXX-desc`     | Bug fixes                        |

### Naming por Lenguaje

| Lenguaje            | Convención   |
| ------------------- | ------------ |
| C#                  | `PascalCase` |
| Python / PostgreSQL | `snake_case` |
| TypeScript / JSON   | `camelCase`  |

### Fechas

- **Backend/DB:** Siempre en **UTC**
- **Frontend:** Formatear a hora local solo en el UI

### Seguridad

- ❌ **NUNCA** hardcodear API keys, passwords o secrets en código
- ✅ Usar variables de entorno (`.env`) para toda información sensible
- ✅ Verificar que `.env` está en `.gitignore`

---

## 🚀 Checklist Rápido Pre-PR

Antes de abrir tu PR, verifica:

- [ ] Los comandos de lint/format de tu proyecto pasan sin errores
- [ ] Los tests pasan y la cobertura supera el umbral mínimo
- [ ] El build del proyecto compila sin errores ni warnings
- [ ] Los commits siguen Conventional Commits
- [ ] El branch sigue el formato `feature/BIO-XXX-desc` o `fix/BIO-XXX-desc`
- [ ] No hay secrets, keys ni passwords hardcodeados
- [ ] Si modificaste Docker: las 3 variantes de compose son válidas
- [ ] Si es un endpoint nuevo: incluye DTOs, validación y tests
