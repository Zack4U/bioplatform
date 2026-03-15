# 🚀 Guía de Desarrollo Local - BioCommerce Caldas

## Estrategia Actual (Feb 2026)

**Docker solo levanta la infraestructura.** Los servicios (Backend, AI, Frontend) corren localmente en tu máquina.

```
┌─────────────────────────────────────────────────────────────┐
│ Docker (Infraestructura)                                      │
├─────────────────────────────────────────────────────────────┤
│ ✅ SQL Server (1433)       ✅ PostgreSQL (5433)             │
│ ✅ Redis (6379)            ✅ ChromaDB (8001)               │
│ ✅ MongoDB (27017)         ✅ pgAdmin (5050)                 │
│ ✅ Adminer (8090)          ✅ Seq (5341)                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Local (Desarrollo)                                            │
├─────────────────────────────────────────────────────────────┤
│ 🖥️  Backend .NET (5070)    🐍 AI Service (8000)             │
│ ⚛️  Frontend Web (3000)     📱 Frontend Mobile (Expo)        │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Guía Rápida (Script Automático)

Si solo quieres **iniciar todo de una vez**, ejecuta:

```bash
# Desde la raíz del proyecto
bash run.sh

# O especifica servicios individuales:
bash run.sh docker        # Solo Docker (infraestructura)
bash run.sh core          # Solo Backend .NET
bash run.sh ai            # Solo AI Service
bash run.sh web           # Solo Frontend Web
bash run.sh core ai web   # Backend + AI + Frontend Web
bash run.sh all           # TODO
```

**Resultado esperado:**

- ✅ Docker levanta en terminal dedicada
- ✅ Backend corre en `http://localhost:5070` (con Swagger)
- ✅ AI Service en `http://localhost:8000` (con Docs)
- ✅ Frontend Web en `http://localhost:3000`
- ✅ pgAdmin en `http://localhost:5050` (BD UI)

> ⚠️ **IMPORTANTE:** El script **SOLO levanta servios**, no configura nada.
>
> - Primero debes copiar `.env.example` → `.env`
> - Luego editar `.env` con tus API keys y credenciales
> - Ver sección "1. Configuración Inicial" más abajo

> **Nota:** El script abre servicios en **ventanas/terminales independientes**. En Windows usa **Git Bash**, no CMD.

---

## 1. Configuración Inicial (Detallado)

> 🔐 **Nota sobre Contraseñas:** En entornos locales de desarrollo, las contraseñas base para bases de datos (SQL Server, Postgres) definidas en infraestructura suelen ser `DevPassword123!` o `postgres123`. Verifica que coincidan con tu archivo `.env` antes de correr migraciones.

### 1.1 Variables de Entorno

```bash
# En la raíz del proyecto
cp .env.example .env

# Edita .env con tus valores (especialmente API keys)
```

### 1.2 Levanta la Infraestructura

```bash
# Desde la raíz del proyecto
docker-compose up -d --build

# Verifica que todo está healthy
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Detener servicios
docker-compose down

# Detener servicios y eliminar volúmenes
docker-compose down -v
```

**Esperado:**

```
STATUS              NAMES
healthy             bioplatform-sqlserver
healthy             bioplatform-postgres
healthy             bioplatform-redis
created             bioplatform-chromadb
created             bioplatform-adminer
created             bioplatform-pgadmin
created             bioplatform-seq
```

---

## 2. Ejecutar Servicios Locales

### 2.1 Backend .NET (Clone Architecture)

```bash
# Terminal 1 - Backend
cd src/Bio.Backend.Core

# Instala dependencias (primera vez)
dotnet restore

# Ejecuta en watch mode (recompila automáticamente)
dotnet watch run --project Bio.API/Bio.API.csproj

# Esperado: http://localhost:5070
# Swagger: http://localhost:5070/swagger
```

**Requisitos:**

- .NET 8 SDK instalado
- **Conexiones a BD:** La API lee **solo desde el archivo `.env`** en la raíz del proyecto (`E:\Proyecto Integrador\bioplatform\.env`), para no duplicar credenciales en otros archivos.
  - **PostgreSQL (especies, taxonomía):** variables `DB_PG_HOST`, `DB_PG_PORT`, `DB_PG_DATABASE`, `DB_PG_USER`, `DB_PG_PASSWORD` (la contraseña solo va en `.env`).
  - **SQL Server (usuarios, roles):** variable `DB_CONNECTION_STRING_SQL` o las equivalentes `DB_SQL_*`.
  - Al arrancar, la API carga `.env` automáticamente desde la raíz del repo; debe coincidir con la misma conexión que usas en DBeaver.

---

### 2.2 AI Service (FastAPI + Python)

```bash
# Terminal 2 - AI Service
cd src/Bio.Backend.AI

# Crea venv (primera vez)
python -m venv venv

# Activa venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Instala dependencias
pip install -r requirements.txt

# Ejecuta con reload automático
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Esperado: http://localhost:8000
# Docs: http://localhost:8000/docs
```

**Requisitos:**

- Python 3.11+
- Variables: `DATABASE_URL`, `OPENAI_API_KEY`, etc.

---

### 2.3 Frontend Web (Next.js 14)

```bash
# Terminal 3 - Frontend Web
cd src/Bio.Frontend.Web

# Instala dependencias (primera vez)
npm install

# Ejecuta en dev mode
npm run dev

# Esperado: http://localhost:3000
```

**Requisitos:**

- Node 20+
- Variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_AI_API_URL`

---

### 2.4 Frontend Mobile (React Native Expo)

```bash
# Terminal 4 - Frontend Mobile
cd src/Bio.Frontend.Mobile

# Instala dependencias (primera vez)
npm install

# Inicia Expo
npx expo start

# Opciones en el CLI:
# - Presiona `i` para abrir iOS simulator
# - Presiona `a` para abrir Android emulator
# - Presiona `w` para web preview (http://localhost:19000)
# - Presiona `c` para limpiar cache
# - Presiona `r` para recargar
```

**Conexión a Backend desde Mobile:**

En `src/Bio.Frontend.Mobile/src/config/api.ts` (o similar):

```typescript
const API_URL = __DEV__
    ? "http://YOUR_LOCAL_IP:5070/api" // Cambia YOUR_LOCAL_IP por tu IP
    : "https://api.bioplatform.com/api";

const AI_API_URL = __DEV__
    ? "http://YOUR_LOCAL_IP:8000/api"
    : "https://ai.bioplatform.com/api";
```

**Requisitos:**

- Node 20+
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (macOS) o Android Emulator
- Misma red Wi-Fi si accedes desde dispositivo físico

## 3. Herramientas de Gestión (Docker)

| Herramienta | URL                   | Propósito                         |
| ----------- | --------------------- | --------------------------------- |
| **pgAdmin** | http://localhost:5050 | Gestionar PostgreSQL              |
| **Adminer** | http://localhost:8090 | Gestionar SQL Server + PostgreSQL |
| **Seq**     | http://localhost:5341 | Ver logs centralizados            |

- Credenciales: En las variables de entorno (.env)

### 3.1 Probar CRUD Especies y Taxonomía (Swagger / Postman)

Los endpoints de **Species** y **Taxonomy** están disponibles sin autenticación para pruebas. Puedes usar Swagger o Postman.

**Pasos rápidos:**

1. **PostgreSQL en marcha** (Docker o tu instancia; misma conexión que en DBeaver).
2. **Conexión en el Backend:** En el `.env` de la raíz del proyecto (`DB_PG_HOST`, `DB_PG_PORT`, `DB_PG_DATABASE`, `DB_PG_USER`, `DB_PG_PASSWORD`). La API carga ese `.env` al iniciar y no usa credenciales en `appsettings`.
3. **Migraciones Scientific (solo si la BD no tiene ya las tablas del script):**
   ```bash
   cd src/Bio.Backend.Core
   dotnet ef database update --context ScientificDbContext -p Bio.Infrastructure -s Bio.API
   ```
4. **Levantar la API:**
   ```bash
   cd src/Bio.Backend.Core
   dotnet watch run --project Bio.API/Bio.API.csproj
   ```
5. **Abrir Swagger:** [http://localhost:5070/swagger](http://localhost:5070/swagger).

**Orden sugerido en Swagger:**

- **Taxonomy:** `POST /api/Taxonomy` (crear una taxonomía) → `GET /api/Taxonomy` (listar) → `GET /api/Taxonomy/{id}` (detalle) → `PUT` / `DELETE` si quieres.
- **Species:** `POST /api/Species` (crear especie; opcionalmente con `taxonomyId` de la taxonomía creada) → `GET /api/Species` → `GET /api/Species/{id}` o `GET /api/Species/slug/{slug}` → `PUT` / `DELETE`.

**Ejemplo body para POST /api/Taxonomy:**

```json
{
  "kingdom": "Plantae",
  "phylum": "Magnoliophyta",
  "className": "Magnoliopsida",
  "orderName": "Fagales",
  "family": "Fagaceae",
  "genus": "Quercus"
}
```

**Ejemplo body para POST /api/Species:**

```json
{
  "taxonomyId": 1,
  "slug": "quercus-humboldtii",
  "scientificName": "Quercus humboldtii",
  "commonName": "Roble",
  "description": "Árbol nativo de los Andes.",
  "conservationStatus": "Vulnerable",
  "isSensitive": false
}
```

**Postman:** Misma base URL `http://localhost:5070`. Colección sugerida:

| Método | Ruta | Uso |
|--------|------|-----|
| GET | `/api/Taxonomy` | Listar taxonomías |
| GET | `/api/Taxonomy/{id}` | Obtener por id (entero) |
| POST | `/api/Taxonomy` | Crear taxonomía (body JSON) |
| PUT | `/api/Taxonomy/{id}` | Actualizar taxonomía |
| DELETE | `/api/Taxonomy/{id}` | Eliminar taxonomía |
| GET | `/api/Species` | Listar especies (`?skip=0&take=10` opcional) |
| GET | `/api/Species/{id}` | Por id (GUID) |
| GET | `/api/Species/slug/{slug}` | Por slug |
| POST | `/api/Species` | Crear especie (body JSON) |
| PUT | `/api/Species/{id}` | Actualizar especie |
| DELETE | `/api/Species/{id}` | Eliminar especie |

---

## 4. Workflow de Desarrollo Típico

```bash
# 1. Abre 5 Terminales (o 4 si no usas mobile)

# Terminal 1: Infraestructura
$ docker-compose up -d

# Terminal 2: Backend
$ cd src/Bio.Backend.Core
$ dotnet watch run --project src/Bio.API/Bio.API.csproj

# Terminal 3: AI Service
$ cd src/Bio.Backend.AI
$ source venv/bin/activate && uvicorn app.main:app --reload

# Terminal 4: Frontend Web
$ cd src/Bio.Frontend.Web
$ npm run dev

# Terminal 5: Frontend Mobile (OPCIONAL)
$ cd src/Bio.Frontend.Mobile
$ npx expo start

# 2. Accede a:
# - Frontend Web: http://localhost:3000
# - Backend API: http://localhost:5070
# - AI Service: http://localhost:8000
# - Mobile App: Abre iOS/Android emulator o escanea QR en tu teléfono
# - Base de Datos: pgAdmin http://localhost:5050
```

### Nota sobre Mobile Development

El frontend Mobile **siempre corre localmente** (nunca en Docker) porque:

- Expo requiere metro bundler activo para hot reload
- La app conecta al backend via HTTP (no requiere Docker)
- Los cambios se ven instantáneamente en emulador/físico

---

## 5. Base de Datos

### 5.1 Conexión desde Local

**PostgreSQL (Scientific/AI):**

```text
Host: localhost
Port: 5433
User: postgres
Password: DevPassword123! (del .env)
Database: BioCommerce_Scientific
```

**SQL Server (Transactional):**

```text
Server: localhost,1433
User: sa
Password: DevPassword123! (del .env)
Database: BioCommerce_Transactional
```

### 5.2 Migraciones

**EF Core (.NET):**

Recuerda que la plataforma usa **dos contextos** separados (Clean Architecture). Debes aplicar migraciones a ambos:

```bash
cd src/Bio.Backend.Core

# 1. Instalar la herramienta EF Core (si no la tienes):
dotnet tool install --global dotnet-ef

# 2. Aplicar BD Transaccional (SQL Server):
dotnet ef database update --context BioDbContext -p Bio.Infrastructure -s Bio.API

# 3. Aplicar BD Científica (PostgreSQL):
dotnet ef database update --context ScientificDbContext -p Bio.Infrastructure -s Bio.API

# Opciones de creación de migraciones:
# dotnet ef migrations add <Name> --context BioDbContext -p Bio.Infrastructure -s Bio.API
```

### 5.3 Reset de Base de Datos

```bash
# Eliminar volúmenes (borra datos)
docker-compose down -v

# Recrear infraestructura
docker-compose up -d --build
```

---

## 6. Parar Desarrollo

```bash
# Detener infraestructura
docker-compose down

# Opcional: Eliminar datos
docker-compose down -v

# Cierra las terminales locales (Ctrl+C)
```

---

## 7. Troubleshooting

### "Cannot connect to localhost:5433"

```bash
# Verifica que Docker está corriendo
docker-compose ps

# Reinicia PostgreSQL
docker-compose restart postgres
```

### "Port 5070 already in use"

```bash
# Busca qué está usando el puerto
lsof -i :5070  # macOS/Linux
netstat -ano | findstr :5070  # Windows

# O usa otro puerto
dotnet watch run --project src/Bio.API/Bio.API.csproj -- --urls=http://+:5080
```

### "Module not found" en Python

```bash
# Asegúrate de tener el venv activado
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Reinstala dependencias
pip install -r requirements.txt
```

---

## 8. Documentación Adicional

- [Clean Architecture Backend](./.github/ARCHITECTURE.md)
- [AI Service Setup](./src/Bio.Backend.AI/README.md)
- [Frontend Development](./src/Bio.Frontend.Web/README.md)
- [Mobile App](./src/Bio.Frontend.Mobile/README.md)
