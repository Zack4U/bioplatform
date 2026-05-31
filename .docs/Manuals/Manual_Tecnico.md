---
title: "Manual Técnico"
description: "Arquitectura, instalación y estándares de desarrollo de BioPlatform Caldas"
icon: "code"
---

# Manual Técnico - BioPlatform Caldas
## 1. Introducción

Este manual técnico proporciona información detallada para la instalación, configuración, mantenimiento y desarrollo de la plataforma BioPlatform Caldas. Está dirigido a administradores de sistemas, desarrolladores y personal de operaciones encargado de mantener y evolucionar la plataforma.

## 2. Arquitectura del Sistema

### 2.1 Visión General

BioPlatform Caldas sigue una arquitectura basada en microservicios con separación clara de responsabilidades:

- **Backend (.NET 8)**: API principal con Clean Architecture y CQRS
- **Servicio de IA (Python/FastAPI)**: Microservicio para visión por computadora y RAG
- **Frontend Web (Next.js 14)**: Interfaz de usuario principal y panel de administración
- **Frontend Mobile (React Native/Expo)**: Aplicación para identificación en campo
- **Infraestructura**: Bases de datos, caché, mensajería y orquestación con Docker

### 2.2 Distribución de Bases de Datos

La plataforma utiliza dos bases de datos principales para optimizar rendimiento y cumplimiento normativo:

1. **BioCommerce_Transactional (SQL Server)**: 
   - **DbContext:** `BioDbContext` (Contexto principal para datos operativos).
   - Gestión de identidad y acceso (IAM)
   - Marketplace y transacciones financieras
   - Gestión de permisos ABS y aspectos legales
   - Direcciones, favoritos y notificaciones

2. **BioCommerce_Scientific (PostgreSQL)**:
   - **DbContext:** `ScientificDbContext` (Es crucial usar este contexto exclusivamente en los repositorios del dominio científico/biodiversidad para evitar errores de arquitectura y *mismatch* en pruebas).
   - Taxonomía y información de especies
   - Geolocalización con PostGIS
   - Computer vision y MLOps
   - RAG/Chat y generación de planes de negocio

La comunicación entre dominios se realiza mediante UUIDs como claves foráneas lógicas, garantizando integridad en la capa de aplicación.

## 3. Requisitos del Sistema

### 3.1 Requisitos de Hardware Mínimos (Desarrollo)
- CPU: 4 núcleos
- RAM: 8 GB
- Almacenamiento: 20 GB SSD
- Conexión a internet para descarga de dependencias

### 3.2 Requisitos de Hardware Recomendados (Producción)
- CPU: 8 núcleos
- RAM: 16 GB
- Almacenamiento: 50 GB SSD
- Banda ancha dedicada para servicios

### 3.3 Software Requerido
- Docker Desktop 4.x+
- .NET 8 SDK
- Node.js 18+ LTS
- Python 3.11+
- Git 2.x+
- npm/yarn 9+

### 3.4 Puertos Utilizados
| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Frontend Web | 3000 | Interfaz de usuario Next.js |
| Backend API | 5070 | API .NET Core con Swagger |
| AI Service | 8000 | Microservicio Python FastAPI |
| ChromaDB | 8001 | Base de datos vectorial |
| PostgreSQL | 5433 | Base de datos científica |
| SQL Server | 1433 | Base de datos transaccional |
| Redis | 6379 | Caché y colas de trabajos |
| MongoDB | 27017 | Almacenamiento de documentos no estructurados |
| pgAdmin | 5050 | Interfaz web para PostgreSQL |
| Adminer | 8090 | Interfaz web para múltiples BD |
| Seq | 5341 | Sistema de logs estructurados |
| Expo (Mobile) | 19000 | Servidor de desarrollo para React Native |

## 4. Instalación y Configuración

### 4.1 Preparación del Entorno

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/tu-organizacion/bioplatform.git
   cd bioplatform
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con credenciales específicas:
   # - Cadenas de conexión a bases de datos
   # - API keys (OpenAI, Stripe, etc.)
   # - Secretos de seguridad
   ```

3. **Verificar dependencias**:
   ```bash
   # Verificar versiones
   docker --version
   dotnet --version
   node --version
   python --version
   ```

### 4.2 Levantar la Infraestructura

#### Opción 1: Uso del script automatizado (recomendado)
```bash
# Levantar todos los servicios
bash run.sh

# Levantar servicios específicos
bash run.sh docker        # Solo infraestructura
bash run.sh core          # Solo Backend .NET
bash run.sh ai            # Solo AI Service
bash run.sh web           # Solo Frontend Web
bash run.sh mobile        # Solo Frontend Mobile
bash run.sh core ai web   # Combinación específica
```

#### Opción 2: Docker Compose manual
```bash
# Construir y levantar infraestructura
docker-compose up -d --build

# Verificar estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

### 4.3 Configuración Inicial Posterior al Levantamiento

1. **Ejecutar migraciones de base de datos**:
   - Las migraciones se ejecutan automáticamente al iniciar los servicios
   - Verificar que las bases de datos estén en estado healthy

2. **Crear usuario administrador inicial**:
   - Acceder a la interfaz de Swagger en: http://localhost:5070/swagger
   
   ![Interfaz General de Swagger](../images/swagger.jpeg)
   
   - Utilizar el endpoint de creación de usuario inicial (`/api/auth/register` u homologado).
   - O ejecutar script de seeding si está disponible

3. **Configurar el frontend**:
   - El frontend web debería estar disponible en http://localhost:3000
   - Verificar conexión con el backend en http://localhost:5070

## 5. Mantenimiento del Sistema

### 5.1 Monitoreo y Salud del Sistema

#### Verificar estado de servicios:
```bash
# Estado de contenedores Docker
docker-compose ps

# Logs en tiempo real
docker-compose logs -f [servicio]

# Estadísticas de recursos
docker-compose stats
```

#### Puntos de verificación clave:
- **Bases de datos**: Verificar conexiones y performance
- **Redis**: Monitorizar uso de memoria y latencia
- **Servicios de IA**: Verificar disponibilidad de modelos
- **Logs**: Revisar Seq (http://localhost:5341) para errores y warnings

### 5.2 Copias de Seguridad y Recuperación

#### Estrategia de respaldos:
1. **Bases de datos SQL Server**:
   ```bash
   # Ejecutar dentro del contenedor
   docker exec bioplatform-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "your_password" -Q "BACKUP DATABASE [BioCommerce_Transactional] TO DISK = '/var/opt/mssql/data/backup.bak'"
   ```

2. **Bases de datos PostgreSQL**:
   ```bash
   # Usar pg_dump
   docker exec bioplatform-postgres pg_dump -U postgres -d BioCommerce_Scientific > backup.sql
   ```

3. **Volúmenes de datos persistentes**:
   - Los volúmenes Docker se respaldan copiando los directorios montados
   - ChromaDB y otros almacenes de vectores requieren respaldo especializado

#### Procedimiento de recuperación:
1. Detener servicios afectados
2. Restaurar desde backups
3. Verificar integridad de datos
4. Reiniciar servicios
5. Validar funcionamiento

### 5.3 Actualizaciones y Parches

#### Actualización de dependencias:
```bash
# Backend .NET
cd src/Bio.Backend.Core
dotnet list package --outdated
dotnet add package [package-name] --version [version]

# Frontend
cd src/Bio.Frontend.Web
npm outdated
npm update [package-name]

# AI Service
cd src/Bio.Backend.AI
pip list --outdated
pip install --upgrade [package-name]
```

#### Actualización de imágenes Docker:
```bash
# Reconstruir imágenes con cambios
docker-compose build [servicio]

# O actualizar desde registry si aplica
docker-compose pull [servicio]
docker-compose up -d [servicio]
```

### 5.4 Gestión de Logs

El sistema utiliza Seq para agregación y visualización de logs:

- Acceso: http://localhost:5341
- Los servicios envían logs estructurados mediante Serilog (.NET) y structlog (Python)
- Configurar retención y alertas según necesidades operativas
- Consultar logs por servicio, nivel de severidad y rangos de tiempo

## 6. Desarrollo y Personalización

### 6.1 Estándares de Codificación

#### Backend (.NET):
- Clean Architecture con separación clara de capas
- Uso de CQRS con MediatR
- Repository Pattern y Unit of Work
- FluentValidation para validación de entradas
- AutoMapper/Mapperly para mapeo de objetos
- Pruebas unitarias con xObjetivo mínimo 70% de cobertura

#### Frontend (Next.js):
- TypeScript obligatorio
- Estado global con Zustand o Redux
- Server state con React Query
- UI con Shadcn/ui o Material-UI
- Formularios con React Hook Form + Zod
- Accesibilidad WCAG 2.1 AA y diseño responsive

#### IA y Datos:
- Modelos predictivos entrenados y evaluados con métricas documentadas
- Integración con LLMs mediante LangChain o similar
- RAG con embeddings y base vectorial (ChromaDB)
- MLOps con MLflow o DVC para versionado de modelos

### 6.2 Flujo de Trabajo de Desarrollo

#### Herramientas de Desarrollo Asistido por IA:
- **Stitch MCP**: Utilizamos el servidor Stitch MCP para la interacción automatizada y generación de componentes de la interfaz de usuario. Al crear o modificar pantallas (especialmente para el frontend), asegúrate de tener configurado el servidor (`mcp_config.json`) para sincronizar el diseño del proyecto de manera eficiente.

#### Git Workflow:
- Rama `main`: Código de producción estable
- Rama `develop`: Integración para el sprint actual
- Ramas de feature: `feature/BIO-XXX-descripcion`
- Ramas de bugfix: `bugfix/BIO-XXX-descripcion`
- Ramas de hotfix: `hotfix/descripcion` para parches urgentes

#### Convención de Commits:
```
<type>(<scope>): <description>

feat: nueva funcionalidad
fix: corrección de error
docs: cambios en documentación
style: formato sin impacto funcional
refactor: mejora de estructura sin cambio funcional
test: añadido o corrección de pruebas
chore: tareas de build, dependencias, etc.
```

#### Pull Request Process:
1. Auto-revisión antes de abrir PR
2. Pasar checks de CI (tests, linting, build)
3. Máximo 400 líneas cambiadas (excluyendo generados)
4. Al menos 1 aprobación de compañero correspondiente
5. Usar plantilla estándar de PR con descripción, tickets relacionados, cambios y pruebas

### 6.3 Pruebas y Calidad de Código

#### Tipos de pruebas:
- **Unitarias**: Pruebas de métodos y funciones aisladas (xUnit, Jest)
- **Integración**: Pruebas de interacción entre componentes
- **E2E**: Pruebas de usuario completo con Playwright o Cypress
- **Performance**: Pruebas de carga y estrés
- **Security**: Escaneo de vulnerabilidades y pruebas de penetración

#### Herramientas de calidad:
- **Linting**: ESLint (JS/TS), dotnet format (.NET), flake8 (Python)
- **Formatting**: Prettier, dotnet format, black
- **Coverage**: Reporte de cobertura de pruebas
- **Security**: Dependabot, CodeQL, OWASP ZAP

### 6.4 Depuración y Troubleshooting

#### Backend (.NET):
- Swagger UI para probar endpoints interactivamente: http://localhost:5070/swagger
  
  ![Detalle de Endpoint en Swagger](../images/swaggerexpandido.jpeg)
  
- **Pruebas de rutas protegidas:** Para utilizar endpoints que requieren autenticación, primero usa la ruta correspondiente para obtener tu token JWT, cópialo, y utiliza el botón "Authorize" en la parte superior derecha de Swagger para inyectar el token Bearer en tus peticiones.
- Logs detallados en consola y Seq
- Puntos de interrupción con Visual Studio/VS Code y .NET debugger
- Diagnosticador de Entity Framework para consultas SQL

#### Frontend:
- React DevTools para inspección de componentes
- Redux DevTools para seguimiento de estado
- Consola del navegador para errores de JavaScript
- Network tab para monitoreo de requests API

#### AI Service:
- Documentación automática en: http://localhost:8000/docs
- Logs de procesamiento de imágenes y consultas RAG
- Métricas de inferencia y latencia
- Visualización de embeddings y búsquedas vectoriales

#### Problemas Comunes:
1. **Fallos de conexión a BD**: Verificar cadenas en .env y estado de contenedores
2. **Puertos en uso**: Cambiar puertos en docker-compose.yml o liberar puertos conflictivos
3. **Memoria insuficiente**: Ajustar límites en Docker o aumentar recursos del host
4. **Problemas de CORS**: Verificar configuración en backend y frontend
5. **Fallos de autenticación**: Verificar secretos JWT y configuración de 2FA

## 7. Escalabilidad y Optimización

### 7.1 Estrategias de Escalado

#### Escalado Horizontal:
- Replicar instancias de servicios stateless (API, frontend)
- Usar load balancer (NGINX en docker/) para distribución de carga
- Escalar Redis con clustering para sesiones y colas
- Escalar bases de datos con replicas de lectura

#### Escalado Vertical:
- Aumentar recursos de contenedores en docker-compose.yml
- Optimizar configuraciones de bases de datos para carga específica
- Ajustar pools de conexiones y timeouts

### 7.2 Optimización de Rendimiento

#### Backend:
- Implementar caching estratégico con Redis
- Optimizar consultas Entity Framework con AsNoTracking y projections
- Usar pagination y filtrado eficiente en APIs grandes
- Implementar circuit breaker para servicios externos

#### Frontend:
- Code splitting y lazy loading de rutas
- Optimización de imágenes y assets
- Memoización de componentes costosos
- Uso eficiente de React Query para cache y actualización de datos

#### IA/ML:
- Batching de inferencias para mejorar throughput
- Cuantización de modelos para reducir tamaño y latencia
- Cache de embeddings frecuentemente usados
- Optimización de prompts para reducir tokens y costo

### 7.3 Monitoreo de Performance

- Métricas de respuesta de APIs en Seq
- Monitoreo de uso de CPU, memoria y disco en contenedores
- Trazabilidad distribuida con OpenTelemetry (si implementado)
- Alertas proactivas basadas en umbrales de rendimiento
- Reportes periódicos de utilización y tendencias

## 8. Seguridad

### 8.1 Autenticación y Autorización

- JWT con refresh tokens para autenticación stateless
- RBAC (Control de Acceso basado en Roles) con roles predefinidos:
  * Administrador
  * Investigador
  * Emprendedor
  * Comunidad
  * Comprador
- 2FA opcional usando TOTP (Google Authenticator, Authy, etc.)
- Políticas de contraseñas fuertes y rotación periódica
- Sesiones con expiración y renovación automática

### 8.2 Protección de Datos

- Encriptación AES-256 para datos sensibles en reposo
- TLS 1.3 para todas las comunicaciones en tránsito
- Hashing seguro de contraseñas con PBKDF2 o bcrypt
- Máscara automática de datos sensibles en logs y respuestas
- Cumplimiento con normas de protección de datos colombianas

### 8.3 Defensa contra Ataques

- Rate limiting por IP y usuario para prevenir abusos
- Sanitización rigurosa de entradas para prevenir XSS y SQLi
- Headers de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.)
- Protección contra CSRF en formularios y APIs
- Escaneo regular de dependencias vulnerables
- Pruebas de penetración programadas

### 8.4 Cumplimiento Normativo

- Adherencia al Decreto 3016 de 2013 (Recursos Genéticos)
- Cumplimiento con Decisión 391 de 1996 (Régimen Común sobre ABS)
- Implementación de requisitos del Protocolo de Nagoya
- Auditorías periódicas de cumplimiento legal
- Documentación de procesos de acceso y beneficio compartido

## 9. Solución de Problemas

### 9.1 Guía de Diagnóstico Rápido

#### Servicios no responden:
1. Verificar que Docker esté ejecutándose: `docker info`
2. Verificar estado de contenedores: `docker-compose ps`
3. Revisar logs de servicios específicos: `docker-compose logs [servicio]`
4. Verificar puertos expuestos y en uso: `netstat -ano | findstr :[puerto]`
5. Reiniciar servicios problemáticos: `docker-compose restart [servicio]`

#### Errores de base de datos:
1. Verificar que contenedores de BD estén healthy: `docker-compose ps`
2. Revisar logs de inicialización: `docker-compose logs [db-service]`
3. Verificar cadenas de conexión en .env
4. Probar conexión directa con herramientas cliente (psql, sqlcmd)
5. Verificar espacio en disco disponible

#### Problemas de rendimiento:
1. Monitorear uso de recursos: `docker-compose stats`
2. Identificar cuellos de botella en logs y métricas
3. Revisar consultas lentas en bases de datos
4. Verificar configuración de cachés y timeouts
5. Considerar escalado horizontal o vertical

### 9.2 Contacto y Soporte

Para problemas que no puedan resolverse con esta guía:

- **Equipo de Desarrollo Interno**: Canal designado en Teams/Slack
- **Documentación Adicional**: Revisar directorio .docs/ para especificaciones técnicas
- **Issue Tracker**: Reportar problemas en el sistema de gestión de incidencias
- **Especialistas por Área**:
  - Infraestructura/DevOps: Equipo de operaciones
  - Backend: Líderes de desarrollo .NET
  - Frontend: Líderes de desarrollo Web/Mobile
  - IA/ML: Equipo de ciencia de datos
  - Seguridad: Oficial de seguridad de la información

## 10. Apéndices

### 10.1 Comandos Útiles

#### Docker:
```bash
# Ver todos los contenedores
docker ps -a

# Ver imágenes
docker images

# Limpiar recursos no utilizados
docker system prune

# Ver volúmenes
docker volume ls

# Inspeccionar un contenedor
docker inspect [container-id]
```

#### Base de Datos:
```bash
# Acceder a SQL Server
docker exec -it bioplatform-sqlserver /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P "your_password"

# Acceder a PostgreSQL
docker exec -it bioplatform-postgres psql -U postgres -d BioCommerce_Scientific
```

#### Logs y Debugging:
```bash
# Seguir logs de un servicio específico
docker-compose logs -f [service]

# Mostrar últimos N líneas
docker-compose logs --tail=100 [service]

# Mostrar logs desde un tiempo específico
docker-compose logs --since=1h [service]
```

### 10.2 Configuración de Variables de Entorno (.env)

Variables críticas que deben configurarse en el archivo .env:

```
# Base de Datos SQL Server
SQL_SERVER_CONNECTION_STRING=Server=localhost,1433;Database=BioCommerce_Transactional;User=sa;Password=yourStrong(!)Password;TrustServerCertificate=True

# Base de Datos PostgreSQL
POSTGRES_CONNECTION_STRING=Host=localhost;Port=5433;Database=BioCommerce_Scientific;Username=postgres;Password=yourStrong(!)Password

# Redis
REDIS_CONNECTION_STRING=localhost:6379

# JWT Security
JWT_SECRET_KEY=your-super-secret-key-minimum-32-chars
JWT_ISSUER=BioPlatformCaldas
JWT_AUDIENCE=BioPlatformUsers

# AI Services
OPENAI_API_KEY=sk-your-openai-key-here
CHROMADB_HOST=localhost
CHROMADB_PORT=8001

# Pagos (ejemplo)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Email (para notificaciones)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
```

### 10.3 Estructura de Directorios

```
bioplatform/
├── .docs/                    # Documentación del proyecto
│   ├── Manuals/              # Manuales de usuario y técnico
│   ├── Bioplatform/          # Especificaciones funcionales y técnicas
│   │   ├── 01-Requirements.md
│   │   ├── 02-Guidelines.md
│   │   ├── 03-Data_Dictionary.md
│   │   ├── 05-Dev_Guidelines.md
│   │   └── Architecture.md
│   ├── Users Guides/         # Guías específicas de funcionalidades
│   │   └── Background_Jobs.md
│   ├── QUICKSTART.md         # Guía de inicio rápido
│   └── pr-checklist.md       # Checklist para pull requests
├── src/                      # Código fuente
│   ├── Bio.Backend.Core/     # API .NET 8 (Clean Architecture)
│   ├── Bio.Backend.AI/       # Microservicio Python (FastAPI)
│   ├── Bio.Frontend.Web/     # Next.js 14
│   └── Bio.Frontend.Mobile/  # React Native (Expo)
├── docker/                   # Configuración de infraestructura
│   ├── nginx/                # Reverse proxy y SSL
│   ├── postgres/             # Scripts inicialización PostgreSQL
│   └── sqlserver/            # Scripts inicialización SQL Server
├── docker-compose.yml        # Orquestación de servicios
├── docker-compose.override.yml # Configuración local de desarrollo
├── .env.example              # Plantilla de variables de entorno
├── run.sh                    # Script de ejecución de servicios
└── README.md                 # Vista general del proyecto
```

---
*Manual Técnico - Versión 1.0*
*Última actualización: Mayo 2026*
*Plataforma BioPlatform Caldas - Universidad de Caldas*