# **Plan de Desarrollo Detallado: BioCommerce Caldas**

## 

# **SECCIÓN 1: BACKEND CORE, INFRAESTRUCTURA E IA** 

## **Arquitectura Base y Modelado de Datos**

* **\[X\] Arquitectura inicial del Backend Core:**  
  * **Descripción:** Inicialización de la solución .NET 8 separando proyectos en Domain, Application, Infrastructure y API. Configuración del contenedor de inyección de dependencias y pipeline de MediatR para comandos y consultas.  
  * **Tecnologías obligatorias:** .NET Core 8, MediatR, FluentValidation.  
  * **Dependencias:** Ninguna.  
* **\[X\] Modelado Relacional (SQL Server) y Taxonómico (PostgreSQL):**  
  * **Descripción:** Implementación de DbContext separados. Creación de migraciones Code-First. SQL Server alojará Users, Orders y Products. PostgreSQL alojará Species, Taxonomy y GeographicDistributions (usando PostGIS).  
  * **Tecnologías obligatorias:** Entity Framework Core 8, Npgsql.EntityFrameworkCore.PostgreSQL.  
  * **Dependencias:** Arquitectura inicial del Backend Core.

## **DevOps, Contenedores y Autenticación Base**

* **\[X\] Orquestación con Docker Compose:**  
  * **Descripción:** Creación del docker-compose.yml maestro que despliegue instancias aisladas de SQL Server, PostgreSQL, Redis, MongoDB y el API Gateway (Nginx) con redes privadas.  
  * **Tecnologías obligatorias:** Docker, Docker Compose, Nginx.  
  * **Dependencias:** Ninguna.  
* **\[ \] CI/CD Pipeline Base:**  
  * **Descripción:** Configuración de GitHub Actions para disparar la compilación (dotnet build) y pruebas (dotnet test) en cada Pull Request hacia develop.  
  * **Tecnologías obligatorias:** GitHub Actions, YAML.

## **Seguridad, Roles y JWT**

* **\[ \] Endpoints de Identity y Generación JWT:**  
  * **Descripción:** Desarrollo de los comandos LoginCommand y RegisterCommand. Configuración de firma HMACSHA256 para emisión de Access Tokens (15 min) y Refresh Tokens (7 días).  
  * **Tecnologías obligatorias:** ASP.NET Core Identity, JWT Bearer.  
* **\[ \] RBAC y Middleware TOTP (2FA):**  
  * **Descripción:** Implementación de políticas de autorización basadas en claims para los 6 roles. Configuración del validador TOTP para obligar el doble factor en roles críticos (Investigador, Autoridad).  
  * **Tecnologías obligatorias:** .NET 8 Authorization Policies.  
  * **Dependencias:** Endpoints de Identity.

## **Catálogo Científico y APIs Base**

* **\[ \] CRUD de Especies y Taxonomía (API):**  
  * **Descripción:** Endpoints REST genéricos para catalogación. Incluye validación del flag is\_sensitive en el GetSpeciesQuery para enmascarar coordenadas en el DTO de respuesta si aplica.  
  * **Tecnologías obligatorias:** MediatR, Dapper (lecturas rápidas), EF Core (escrituras).  
* **\[ \] Job de Carga Masiva CSV:**  
  * **Descripción:** Creación de un proceso en segundo plano que reciba un archivo CSV con metadatos biológicos, lo parsee y lo inserte por lotes (Bulk Insert) en PostgreSQL.  
  * **Tecnologías obligatorias:** Hangfire, Redis, CsvHelper.  
  * **Dependencias:** CRUD de Especies.

## **IA (Computer Vision \- CNN) \- Entrenamiento**

* **\[ \] Recolección y Limpieza de Dataset (Flora/Fauna):**  
  * **Descripción:** Scripting para consumir la API de iNaturalist o Kaggle, descargando 10,000+ imágenes de 300 especies de Caldas. Limpieza de imágenes corruptas y redimensionamiento masivo a 224x224 píxeles.  
  * **Tecnologías obligatorias:** Python 3.11, OpenCV, Pandas.  
* **\[ \] Fine-Tuning de CNN (ResNet50):**  
  * **Descripción:** Congelación de capas base de ResNet50 y entrenamiento de las últimas capas densas con nuestro dataset local. Guardado de los pesos finales en formato .h5 o .pt. Generación de matriz de confusión.  
  * **Tecnologías obligatorias:** TensorFlow / PyTorch.  
  * **Herramientas sugeridas:** Google Colab Pro / AWS GPU.  
  * **Dependencias:** Recolección de Dataset.

## **IA (Computer Vision \- CNN) \- Despliegue**

* **\[ \] Microservicio FastAPI de Inferencia:**  
  * **Descripción:** Creación del endpoint POST /api/ai/classify. Debe recibir una imagen en multipart/form-data, pre-procesarla, ejecutar el modelo y devolver el Top-3 de predicciones con el class\_id y % confidence.  
  * **Tecnologías obligatorias:** Python 3.11, FastAPI, Uvicorn, Pydantic.  
* **\[ \] Integración Gateway e IAC:**  
  * **Descripción:** Adición del microservicio de Python al docker-compose.yml. Configuración de reglas en Nginx para enrutar llamadas y configuración del Backend Core para registrar la "Auditoría de Inferencia" en MongoDB.  
  * **Dependencias:** Microservicio FastAPI de Inferencia.

## **Marketplace Core y Normativa ABS**

* **\[ \] CRUD de Permisos ABS (Decisión 391):**  
  * **Descripción:** Endpoints para que los Emprendedores suban resoluciones (almacenando URL en BD) y la Autoridad Ambiental las valide y cambie su status a "Active".  
  * **Tecnologías obligatorias:** .NET 8, CQRS.  
* **\[ \] CRUD de Productos de Biocomercio:**  
  * **Descripción:** Endpoints para gestión de productos. **Regla estricta:** El CreateProductCommandHandler debe consultar en base de datos si el usuario tiene un Permiso ABS activo para la base\_species\_id; si no, retorna error 403 Forbidden.  
  * **Dependencias:** CRUD de Permisos ABS, API de Especies.

## **Transacciones y Pagos (Stripe)**

* **\[ \] Integración Stripe Checkout Session:**  
  * **Descripción:** Implementación del patrón Adapter (IPaymentGateway). Creación del comando que toma el OrderId, calcula el total en centavos y se comunica con la API de Stripe para generar la URL segura de pago.  
  * **Tecnologías obligatorias:** .NET 8, Stripe.net SDK.  
* **\[ \] Webhook de Confirmación de Pago:**  
  * **Descripción:** Endpoint seguro (POST /webhook) que recibe eventos asíncronos de Stripe, valida la firma criptográfica (Stripe-Signature) y actualiza el Order.Status a Paid en SQL Server.  
  * **Dependencias:** Integración Stripe Checkout.

## **IA (Generativa \- RAG) \- Base de Conocimiento**

* **\[ \] Vectorización de Normativas y Biología:**  
  * **Descripción:** Scripts de Python para extraer texto de PDFs (Decreto 3016, Protocolo de Nagoya) y descripciones biológicas de PostgreSQL. Fragmentar (Chunking) el texto, pasarlo por el modelo de embeddings de OpenAI y almacenarlo en ChromaDB.  
  * **Tecnologías obligatorias:** LangChain, ChromaDB, OpenAI API (Embeddings text-embedding-3-small).  
* **\[ \] Endpoint RAG Botánico/Comercial (/consult):**  
  * **Descripción:** API REST en FastAPI que recibe un prompt de usuario, convierte el texto a vector, busca los 5 chunks más relevantes en ChromaDB, construye un *System Prompt* robusto y solicita la respuesta a GPT-4 o algun modelo LLM.  
  * **Tecnologías obligatorias:** FastAPI, LangChain.  
  * **Dependencias:** Vectorización de Normativas.

## **IA (Generativa) \- Modelos de Negocio**

* **\[ \] Generador de Planes de Negocio:**  
  * **Descripción:** Endpoint POST /api/ai/generate-plan. Usa un "Chain" complejo de LangChain. Recibe especie y capital estimado; busca información de mercado estructurada, y le pide a GPT-4 o algun LLM que devuelva un string en Markdown con Estructura de Costos, Análisis DOFA y Propuesta de Valor.  
  * **Tecnologías obligatorias:** OpenAI GPT-4 o algun LLM, Pydantic Output Parsers.  
  * **Dependencias:** RAG Botánico (Semana 9).

## **Analíticas y Trazabilidad**

* **\[ \] Consultas de Trazabilidad y Dashboard:**  
  * **Descripción:** Creación de Dapper Queries ultrarrápidas para agregar datos de ventas por vendedor, stock actual y métricas de especies más consultadas. Endpoint que devuelve un árbol cronológico de un lote de producto.  
  * **Tecnologías obligatorias:** .NET 8, Dapper.  
  * **Dependencias:** Transacciones (Semana 8).

## **Estabilización Backend y Testing**

* **\[ \] Pruebas Unitarias y Mocking (\>70%):**  
  * **Descripción:** Desarrollo de tests unitarios enfocados en la capa Application. Simulación de llamadas a DB (Mock\<IRepository\>) y APIs de terceros (Mock\<IPaymentGateway\>) para validar flujos de éxito y excepciones de dominio.  
  * **Tecnologías obligatorias:** xUnit, Moq, FluentAssertions.  
* **\[ \] Ajustes Finales y Documentación Swagger:**  
  * **Descripción:** Revisión de vulnerabilidades (SQLi, Auth), decoración de todos los endpoints con XML Comments y validación de generación de OpenAPI JSON.

# **SECCIÓN 2: FRONTEND WEB Y MÓVIL**

## **Arquitectura Base y Setup**

* **\[X\] Setup del Monorepositorio Web:**  
  * **Descripción:** Inicialización de Next.js con el App Router. Configuración de variables de entorno y temas CSS.  
  * **Tecnologías obligatorias:** Next.js 14, Tailwind CSS.  
* **\[X\] Setup de Librerías Core Web:**  
  * **Descripción:** Integración y configuración inicial de Zustand (estado global) y TanStack Query (manejo de caché y data fetching). Instalación de componentes base de Shadcn/ui (Button, Input, Dialog).  
  * **Tecnologías obligatorias:** Zustand, React Query, Shadcn/ui.  
* **\[X\] Inicialización de App Móvil:**  
  * **Descripción:** Creación del proyecto React Native mediante Expo. Configuración del enrutamiento base (Tabs, Stacks).  
  * **Tecnologías obligatorias:** React Native, Expo, React Navigation.

## **Arquitectura de Estado y Diseño Layout**

* **\[ \] Layouts y Navegación Web:**  
  * **Descripción:** Desarrollo de la Navbar responsiva (Desktop/Mobile menu), Sidebar para el Dashboard y Footer estático. Implementación de protección de rutas a nivel de middleware en Next.js.  
  * **Tecnologías obligatorias:** Next.js Middleware, Lucide React (iconos).  
* **\[ \] Capa de Servicios API Web/Móvil:**  
  * **Descripción:** Creación de interceptores de Axios centralizados para inyectar automáticamente el header Authorization: Bearer {token} en todas las peticiones y manejar renovaciones de token (401 Retry).  
  * **Tecnologías obligatorias:** Axios.

## **Pantallas de Autenticación**

* **\[ \] Pantallas Login/Registro Web:**  
  * **Descripción:** Desarrollo de formularios con doble pestaña para inicio de sesión y registro. Integración de validación de campos en cliente (ej. email válido, contraseña fuerte).  
  * **Tecnologías obligatorias:** React Hook Form, Zod.  
  * **Dependencias:** Capa de Servicios (Semana 2).  
* **\[ \] Interfaz de Verificación 2FA (Web/Móvil):**  
  * **Descripción:** Flujo de redirección tras login exitoso hacia pantalla de código PIN numérico de 6 dígitos. Conexión con el estado global de Zustand al autorizar.  
  * **Tecnologías obligatorias:** Shadcn InputOTP.

## **Catálogo y Biodiversidad Base**

* **\[ \] Vista de Catálogo (Web/Móvil):**  
  * **Descripción:** Diseño de la grilla de especies (Grid o FlatList). Implementación del paginado infinito (Infinite Scrolling) conectándose a las queries construidas por el backend.  
  * **Tecnologías obligatorias:** Next.js (Web), React Native FlatList (Móvil).  
* **\[ \] Filtros Avanzados (Web):**  
  * **Descripción:** Sidebar interactivo para filtrar la búsqueda de especies por Familia, Hábitat o estado de sensibilidad, actualizando la grilla en tiempo real sin recargar página.

## **Detalles Botánicos y Mapas**

* **\[ \] Ficha Técnica de Especie (Web/Móvil):**  
  * **Descripción:** Pantalla de detalle mostrando taxonomía, galería de fotos con zoom (React Image Gallery) y acordeones para descripción y ecología.  
  * **Tecnologías obligatorias:** Shadcn Accordion, Tabs.  
* **\[ \] Integración de Mapas GIS (Web):**  
  * **Descripción:** Incrustación de visor cartográfico en el detalle de especie que lee GeoJSON desde la API para pintar marcadores o áreas de distribución (respetando los ocultamientos por sensibilidad).  
  * **Tecnologías obligatorias:** React-Leaflet, Leaflet.

## **Visión por Computadora (Mobile Native)**

* **\[ \] Interfaz de Cámara Inteligente (Móvil):**  
  * **Descripción:** Pantalla *fullscreen* accediendo a la cámara nativa del teléfono. Diseño de un overlay tipo "scanner" para guiar al usuario en el encuadre de la hoja/animal.  
  * **Tecnologías obligatorias:** React Native Vision Camera.  
* **\[ \] Captura y Manejo de Imagen (Móvil):**  
  * **Descripción:** Lógica nativa para tomar la fotografía, comprimirla, pasarla a Base64/Multipart y mostrar interfaz de carga "Analizando..." bloqueando la UI.  
  * **Dependencias:** Interfaz de Cámara Inteligente.

## **Integración de IA Visual**

* **\[ \] Conexión Móvil con CNN (Móvil):**  
  * **Descripción:** Envío de la imagen capturada al microservicio Python (/api/ai/classify).  
  * **Dependencias:** Espera la API Python (Back W6).  
* **\[ \] Visualizador de Resultados (Móvil):**  
  * **Descripción:** Un *Bottom Sheet* que sube tras recibir respuesta de la CNN, mostrando un gráfico de medidor circular con la confianza de la predicción y el nombre de la especie hallada, con un botón hacia la Ficha Técnica.  
  * **Tecnologías obligatorias:** React Native Reanimated (animaciones).

## **Marketplace \- Tienda**

* **\[ \] UI Marketplace y Tarjetas de Producto (Web):**  
  * **Descripción:** Grilla principal de e-commerce listando los productos biológicos creados por los emprendedores. Incluye "Badges" visuales para certificaciones de sostenibilidad.  
  * **Tecnologías obligatorias:** Tailwind CSS.  
* **\[ \] Formulario de Permisos ABS (Web):**  
  * **Descripción:** Pantalla (solo rol Emprendedor) con formulario complejo para registrar datos del permiso, asociar la especie, y carga de archivos (PDF).

## **Checkout y Carrito de Compras**

* **\[ \] Persistencia de Carrito (Web):**  
  * **Descripción:** Desarrollo del panel lateral deslizable (Sheet) para gestionar el carrito. El estado debe sobrevivir recargas (persistido en localStorage vía Zustand).  
  * **Tecnologías obligatorias:** Zustand Persist Middleware.  
* **\[ \] UI Stripe Checkout (Web):**  
  * **Descripción:** Pantalla resumen de la orden que invoca el endpoint de checkout del Backend. Manejo del *redirect* seguro de Stripe y diseño de las pantallas de éxito (/success) y cancelación (/cancel).  
  * **Tecnologías obligatorias:** Stripe.js.

## **IA Generativa \- Asistente RAG**

* **\[ \] Interfaz del Chatbot de Asesoría (Web):**  
  * **Descripción:** Diseño de ventana de chat inmersiva en la plataforma. Lógica para mantener el historial de la conversación, manejar estados de "Escribiendo..." y autoscroll al final del mensaje.  
  * **Dependencias:** Espera endpoint /consult (Back W9).  
* **\[ \] Renderizado de Planes de Negocio (Web):**  
  * **Descripción:** Vista tipo documento (estilo Notion) que toma el Markdown crudo generado por el modelo GPT-4 y lo parsea a HTML formateado con tablas, negritas y colores institucionales.  
  * **Tecnologías obligatorias:** React Markdown, Tailwind Typography.

## **Dashboards e Informes**

* **\[ \] Dashboard de Emprendedor (Web):**  
  * **Descripción:** Panel de control privado. Integración de librerías de gráficos para mostrar métricas como "Ventas del último mes" y "Productos más vistos".  
  * **Tecnologías obligatorias:** Recharts.  
* **\[ \] Gestión de Inventario (Web):**  
  * **Descripción:** Tabla interactiva (DataTable) con paginación, filtros y sorting para que el emprendedor edite precios, stock o de de baja productos.  
  * **Tecnologías obligatorias:** TanStack Table v8.

## **Móvil Offline y Sincronización**

* **\[ \] Configuración Base de Datos Local (Móvil):**  
  * **Descripción:** Implementación de persistencia física en el dispositivo móvil para descargar un diccionario taxonómico básico que pueda usarse sin internet.  
  * **Tecnologías obligatorias:** WatermelonDB o Expo SQLite.  
* **\[ \] Lógica Offline-First (Móvil):**  
  * **Descripción:** Hook que escucha cambios de red (NetInfo). Si el usuario toma una foto y guarda un registro "En el Campo" sin señal, se guarda en SQLite. Al detectar red de nuevo, se dispara la subida silenciosa a la API.  
  * **Tecnologías obligatorias:** React Native NetInfo.

## **End-to-End (E2E) Testing Frontend**

* **\[ \] Setup y Mapeo E2E (Web):**  
  * **Descripción:** Configuración del entorno de pruebas E2E. Creación de selectores data-testid en botones, inputs y flujos críticos (Marketplace, Login).  
  * **Tecnologías obligatorias:** Cypress o Playwright.  
* **\[ \] Pruebas Automatizadas de Flujo (Web):**  
  * **Descripción:** Escritura de scripts que abran el navegador *headless*, se registren como comprador, agreguen un producto y simulen el click en pagar. Verificación de redirecciones.

## **Accesibilidad, UI Polish y Entregables**

* **\[ \] Auditoría de Accesibilidad (WCAG 2.1 AA):**  
  * **Descripción:** Revisión del contraste de colores, navegación por tabulador, *focus rings* en todos los inputs, y soporte completo de *Aria-Labels* en íconos e imágenes biológicas.  
  * **Herramientas sugeridas:** Lighthouse, aXe.  
* **\[ \] Compilación para Producción:**  
  * **Descripción:** Optimización y minificación final. Generación del build estático/SSR para Next.js (npm run build). Generación de APK/AAB para Android y preparación de binarios de Expo para la app móvil.