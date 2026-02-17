# Arquitectura de Software

## 

# **1\. Visión Arquitectónica General**

El sistema se ha diseñado bajo un enfoque de Microservicios Híbridos Orquestados, separando estrictamente el núcleo transaccional (alta integridad, lógica de negocio compleja) del núcleo científico/computacional (IA, procesamiento de imágenes).  
Esta separación permite escalar los recursos de IA (GPU/CPU intensivos) independientemente de la lógica de negocio del Marketplace (I/O intensivo), garantizando estabilidad y rendimiento. Todo el ecosistema se encuentra contenerizado y gestionado tras un API Gateway unificado.

# **2\. Diagramas de Arquitectura**

## **2.1. Arquitectura de Contenedores (Nivel Alto)**

Este diagrama ilustra la topología de despliegue y los límites de red entre servicios.  
[Bioplatform Architecture.png](https://drive.google.com/file/d/1-V_ZfIujDvURAPuxN-l0e8lnWcH3oace/view?usp=drive_link)

## **2.2. Diagrama de Interacción de Componentes (Flujo RAG)**

Detalle de cómo interactúan en el flujo crítico de Identificación de Especie y Consulta al Asistente (RAG).  
[Bioplatform Sequence.png](https://drive.google.com/file/d/1mpFnRckIIdgfQRJh_hYuivpmlrMQ2c1r/view?usp=drive_link)

# **3\. Patrón Arquitectónico**

## **3.1. Clean Architecture (Core .NET)**

El backend principal sigue estrictamente Clean Architecture para garantizar la independencia de frameworks, UI y bases de datos.

* Domain Layer: Núcleo del sistema. Contiene Entidades (Enterprise Business Rules) y Excepciones de dominio. Sin dependencias externas.  
* Application Layer: Contiene la lógica de aplicación (Use Cases). Implementa el patrón CQRS (Command Query Responsibility Segregation) utilizando MediatR. Define interfaces que la infraestructura debe implementar.  
* Infrastructure Layer: Implementa las interfaces definidas en Application. Aquí residen Entity Framework Core, los clientes de Stripe, Azure Storage y la implementación de repositorios.  
* Presentation Layer (API): Controladores "delgados" (Thin Controllers) que solo reciben peticiones HTTP y despachan comandos/queries al mediador.

## **3.2. Layered Architecture (Servicio IA)**

El microservicio de Python utiliza una arquitectura en capas simplificada (Router \-\> Service \-\> Data), priorizando la eficiencia en el manejo de tensores y llamadas a APIs de LLM.

# **4\. Stack Tecnológico (Versiones)**

| Capa | Tecnología | Versión | Propósito |
| :---- | :---- | :---- | :---- |
| Backend Core | .NET (C\#) | 8.0 (LTS) | API REST Transaccional, Auth, Negocio. |
| Framework App | ASP.NET Core | 8.0 | Web API, Dependency Injection. |
| Backend AI | Python | 3.11 | Inferencia de Modelos, RAG, Procesamiento de datos. |
| Framework AI | FastAPI | 0.109+ | API de alto rendimiento para ML. |
| Frontend Web | Next.js | 14 (App Router) | SSR, SSG, Interfaz de usuario. |
| Frontend Móvil | React Native | 0.73+ (Expo) | Aplicación móvil multiplataforma. |
| BD Transaccional | SQL Server | 2022 Developer | Integridad referencial estricta (Pedidos, Usuarios). |
| BD Científica | PostgreSQL | 16 (+PostGIS) | Datos biológicos, JSONB, Geoespacial. |
| Vector DB | ChromaDB | Latest | Almacenamiento de embeddings para RAG. |
| Caché | Redis | 7.2 | Caché distribuido y Colas de tareas. |
| Logs | MongoDB | 7.0 | Almacenamiento de logs estructurados (Serilog sink). |
| Proxy | Nginx | 1.25 | Reverse Proxy, SSL, Compression. |
| CI/CD | GitHub Actions | \- | Automatización de Build y Test. |
| Contenedores | Docker | 24+ | Orquestación (Docker Compose). |

# **5\. Flujo de Datos**

## **5.1. Flujo Transaccional (Ej: Crear Producto)**

1. Request: Cliente envía JSON a POST /products.  
2. API Layer: ProductsController recibe el request.  
3. Application Layer:  
   * Se crea un CreateProductCommand.  
   * Validation Pipeline: FluentValidation verifica reglas (precio \> 0, campos requeridos).  
   * Handler: CreateProductCommandHandler procesa la lógica.  
   * Integrity Check: Verifica vía UUID si la especie base existe (aunque esté en Postgres).  
   * Compliance Check: Verifica en tabla AbsPermits si el usuario tiene permiso para esa especie.  
4. Domain Layer: Se instancia la entidad Product, aplicando reglas de negocio invariantes.  
5. Infrastructure Layer: ProductRepository guarda los cambios usando EF Core (DbContext).  
6. Persistence: Se hace commit en SQL Server.

# **5.2. Flujo de Lectura (Queries)**

Para consultas de alto rendimiento (e.g., Catálogo), se utiliza una proyección directa (sin pasar por todo el dominio) o se consulta la caché de Redis si los datos son frecuentemente accedidos.

# **6\. Seguridad**

## **6.1. Autenticación y Autorización**

* Estándar: OAuth2 / OpenID Connect simplificado.  
* Tokens: Implementación de JWT (JSON Web Tokens) con firma asimétrica o simétrica (HMACSHA256).  
* Ciclo de Vida: Access Token (15 min) \+ Refresh Token (7 días, rotativo).  
* 2FA (Factor Doble): Obligatorio para roles críticos (Investigador, Admin). Implementación vía TOTP (Time-based One-Time Password) compatible con Google Authenticator.  
* RBAC: Control de acceso basado en roles (Roles: Researcher, Entrepreneur, Community, Buyer, Authority, Admin).

## **6.2. Protección de Datos**

* En Tránsito: Todo el tráfico HTTP es forzado a TLS 1.2/1.3 vía Nginx (SSL Termination).  
* En Reposo: \* Passwords hasheados con Argon2id.  
  * Datos sensibles de especies (ubicación exacta de especies amenazadas) se ofuscan dinámicamente según el rol del usuario (IsSensitive flag).  
* Compliance: Validación de permisos de acceso a recursos genéticos (ABS) antes de permitir transacciones comerciales.

# **7\. Integraciones Externas**

* OpenAI API (GPT-4 / Embeddings): Motor de inteligencia para la generación de planes de negocio y chat.  
* Stripe / Pasarela Local (PSE): Procesamiento de pagos. Se utiliza el patrón Adapter para desacoplar la lógica de pagos de la implementación específica del proveedor.  
* Map Tiles Provider (OSM / Mapbox): Proveedor de mapas base para Leaflet.  
* Cloud Storage (Simulado o Real): Almacenamiento de imágenes. La BD solo guarda URLs, nunca BLOBs.

# **8\. Operatividad y Observabilidad**

## **8.1. Manejo de Errores**

* Global Exception Handling: Middleware en .NET que captura excepciones no controladas y devuelve respuestas estandarizadas RFC 7807 (Problem Details).  
* Domain Exceptions: Errores controlados de negocio (e.g., InsufficientStockException) se mapean a códigos HTTP 400/422.

## **8.2. Logging y Auditoría**

* Librería: Serilog.  
* Destino: Los logs se escriben en MongoDB para permitir consultas complejas sin afectar el rendimiento transaccional.  
* Trazabilidad: Se incluye un CorrelationId en todas las peticiones que viajan entre microservicios (del Gateway \-\> .NET \-\> Python) para rastrear transacciones distribuidas.

## **8.3. Estrategia de Escalabilidad**

* Horizontal: Los servicios (.NET y Python) son stateless, permitiendo levantar múltiples réplicas detrás del balanceador de carga (Nginx).  
* Asincronismo: Tareas pesadas (generación de PDFs, envío de emails masivos, procesamiento batch de imágenes) se delegan a Hangfire (Backed by Redis) para no bloquear el hilo principal de la API.

