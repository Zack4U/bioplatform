# **PROYECTO 3: PLATAFORMA DE BIODIVERSIDAD Y BIOCOMERCIO CON IA GENERATIVA**

## **1\. Objetivo General**

Desarrollar una plataforma digital integral que facilite la identificación, catalogación y aprovechamiento sostenible de la biodiversidad de Caldas, conectando investigadores, emprendedores, comunidades locales y entidades gubernamentales mediante un sistema de reconocimiento automático de especies con visión por computadora, RAG con base de conocimiento botánico/zoológico, y generación de oportunidades de biocomercio alineadas con el Convenio de Diversidad Biológica y la normativa colombiana (Decreto 3016 de 2013).

## **2\. Objetivos Específicos**

* Implementar un sistema de identificación automática de especies mediante visión por computadora y deep learning que permita a usuarios subir fotografías de flora y fauna de Caldas, obteniendo clasificación taxonómica, información ecológica, usos tradicionales y potencial económico, con precisión superior al 85% para 300+ especies registradas.  
* Crear un marketplace de biocomercio que conecte productores de ingredientes naturales, artesanías y ecoturismo con compradores nacionales e internacionales, integrando trazabilidad de origen, certificaciones de sostenibilidad, y sistema de pagos, cumpliendo con protocolos de acceso a recursos genéticos (ABS).  
* Desarrollar un asistente de IA generativa que guíe a emprendedores en la creación de planes de negocio de biocomercio, generando análisis de mercado, estrategias de comercialización, formulación de productos naturales, y propuestas de proyectos de bioprospección con base en la biodiversidad local.

## **3\. Alcance del Proyecto**

### **In-Scope**

* \[ \] Catálogo digital de biodiversidad de Caldas (flora, fauna, hongos)  
* \[ \] Sistema de identificación de especies con CNN  
* \[ \] Registro de usuarios (Investigador, Emprendedor, Comunidad, Comprador)  
* \[ \] Marketplace de productos de biocomercio  
* \[ \] Gestión de permisos de acceso a recursos genéticos  
* \[ \] Trazabilidad de productos desde origen  
* \[ \] Sistema de certificaciones de sostenibilidad  
* \[ \] Pasarela de pagos integrada (PSE, tarjetas)  
* \[ \] RAG con base de conocimiento de 1000+ especies  
* \[ \] Chatbot de asesoría en biocomercio  
* \[ \] IA generativa para planes de negocio  
* \[ \] Mapas de distribución de especies  
* \[ \] Foros comunitarios y networking  
* \[ \] Dashboard de analíticas para emprendedores  
* \[ \] Aplicación móvil para identificación en campo

### **Out-of-Scope**

* Gestión logística de envíos  
* Certificaciones fitosanitarias (se registran, no se emiten)  
* Análisis de laboratorio de muestras  
* Gestión financiera contable completa  
* Integración con bancos de germoplasma

## **4\. Actores Intervinientes**

* **Investigadores:** Registran especies, validan identificaciones.  
* **Emprendedores:** Crean productos, venden en marketplace.  
* **Comunidades locales:** Comparten conocimiento tradicional, producen.  
* **Compradores:** Buscan productos sostenibles.  
* **Autoridades ambientales:** Verifican permisos y sostenibilidad.  
* **Administrador:** Gestiona usuarios, modera contenido.

## **5\. Entregables Completos**

### **Fase 1: Análisis y Diseño (Semanas 1-2)**

* \[ \] Documento de Visión del ecosistema de biocomercio  
* \[ \] Documento de Arquitectura con microservicios  
* \[ \] Modelo ER de especies, productos, transacciones  
* \[ \] Wireframes de marketplace y app móvil  
* \[ \] Product Backlog priorizado  
* \[ \] Análisis de normativa de acceso a recursos genéticos

### **Fase 2: Infraestructura (Semanas 3-4)**

* \[ \] Backend .NET 10: Clean Architecture  
* \[ \] Base de datos PostgreSQL (especies) y SQL Server (transacciones)  
* \[ \] Frontend Next.js: arquitectura de componentes  
* \[ \] Configuración Docker multi-contenedor  
* \[ \] Repositorio Git con CI/CD  
* \[ \] Integración con pasarela de pagos (sandbox)

### **Fase 3: Catálogo de Biodiversidad (Semanas 5-7)**

* \[ \] Backend: CRUD de especies con taxonomía completa  
* \[ \] Frontend: catálogo con búsqueda avanzada  
* \[ \] Sistema de carga masiva de especies (CSV)  
* \[ \] Mapas de distribución con Leaflet  
* \[ \] Galería de imágenes con zoom  
* \[ \] Fichas técnicas de especies  
* \[ \] Gestión de usuarios y roles

### **Fase 4: Visión por Computadora (Semanas 8-10)**

* \[ \] Dataset de 10,000+ imágenes de 300 especies  
* \[ \] Modelo CNN (ResNet50 o EfficientNet) entrenado  
* \[ \] API de clasificación con FastAPI  
* \[ \] Integración en app web y móvil  
* \[ \] Sistema de validación por investigadores  
* \[ \] Dashboard de métricas del modelo (accuracy, confusion matrix)  
* \[ \] Fine-tuning con nuevas imágenes validadas

### **Fase 5: Marketplace (Semanas 11-12)**

* \[ \] Backend: gestión de productos y ventas  
* \[ \] Frontend: catálogo de productos con filtros  
* \[ \] Carrito de compras y checkout  
* \[ \] Integración con pasarela de pagos  
* \[ \] Sistema de calificaciones y reseñas  
* \[ \] Dashboard de vendedores con analíticas  
* \[ \] Trazabilidad de productos con blockchain (opcional)

### **Fase 6: IA Generativa y RAG (Semanas 13-14)**

* \[ \] RAG con base de conocimiento de 1000+ especies  
* \[ \] Chatbot con LangChain para asesoría  
* \[ \] Generador de planes de negocio con GPT-4  
* \[ \] Análisis de mercado automático  
* \[ \] Recomendaciones de productos basadas en biodiversidad local  
* \[ \] Integración en plataforma web

### **Fase 7: Aplicación Móvil y Testing (Semanas 15-16)**

* \[ \] App React Native para identificación de especies  
* \[ \] Funcionalidad offline con base de datos local  
* \[ \] Cámara integrada para captura de imágenes  
* \[ \] GPS para georreferenciación  
* \[ \] Pruebas unitarias backend (\>70%)  
* \[ \] Pruebas de integración  
* \[ \] Manual de Usuario completo  
* \[ \] Manual de Instalación y Configuración  
* \[ \] Video demostración y presentación final

## **6\. Plan de Ejecución (16 semanas)**

### **Sprint 0 (Semanas 1-2): Fundamentos**

* \[ \] Investigación de biodiversidad de Caldas  
* \[ \] Diseño de taxonomía y catálogo  
* \[ \] Arquitectura de microservicios  
* \[ \] Configuración de entorno

### **Sprint 1 (Semanas 3-4): Autenticación y Base**

* \[ \] Sistema de autenticación JWT \+ 2FA  
* \[ \] Gestión de usuarios y roles  
* \[ \] Backend: CRUD de especies  
* \[ \] Frontend: catálogo básico

### **Sprint 2 (Semanas 5-6): Catálogo Avanzado**

* \[ \] Búsqueda avanzada de especies  
* \[ \] Mapas de distribución  
* \[ \] Fichas técnicas completas  
* \[ \] Carga masiva de datos

### **Sprint 3 (Semanas 7-8): Visión por Computadora**

* \[ \] Recolección de dataset de imágenes  
* \[ \] Entrenamiento de modelo CNN  
* \[ \] API de clasificación  
* \[ \] Testing de precisión

### **Sprint 4 (Semanas 9-10): Marketplace Core**

* \[ \] CRUD de productos  
* \[ \] Carrito de compras  
* \[ \] Integración con pasarela de pagos  
* \[ \] Dashboard de vendedores

### **Sprint 5 (Semanas 11-12): Trazabilidad y Certificaciones**

* \[ \] Sistema de permisos de acceso a recursos  
* \[ \] Trazabilidad de productos  
* \[ \] Certificaciones de sostenibilidad  
* \[ \] Calificaciones y reseñas

### **Sprint 6 (Semanas 13-14): IA Generativa**

* \[ \] RAG con base de conocimiento  
* \[ \] Chatbot de asesoría  
* \[ \] Generador de planes de negocio  
* \[ \] Análisis de mercado automático

### **Sprint 7 (Semanas 15-16): Móvil y Despliegue**

* \[ \] Desarrollo de app React Native  
* \[ \] Identificación offline  
* \[ \] Testing completo  
* \[ \] Documentación y presentación

## **7\. Stack Tecnológico**

**Backend**

* .NET 10 con Clean Architecture  
* MediatR para CQRS  
* Entity Framework Core  
* FastAPI (Python) para microservicio de IA  
* JWT \+ TOTP para seguridad  
* Serilog  
* Hangfire para jobs

**Frontend Web**

* Next.js 14 con TypeScript  
* Shadcn/ui y Tailwind CSS  
* React Query y Zustand  
* Leaflet para mapas  
* React Image Gallery  
* Stripe/PSE SDK para pagos

**Frontend Móvil**

* React Native con TypeScript  
* Expo  
* React Native Vision Camera  
* AsyncStorage para offline  
* React Navigation

**Base de Datos**

* PostgreSQL para catálogo de especies  
* SQL Server para transacciones  
* MongoDB para logs (opcional)  
* Redis para caché

**IA y ML**

* Python 3.11 con FastAPI  
* TensorFlow/PyTorch para CNN  
* ResNet50 o EfficientNet  
* LangChain para RAG  
* OpenAI API para generación de planes  
* ChromaDB para embeddings  
* OpenCV para procesamiento de imágenes

**DevOps**

* Docker y Docker Compose  
* GitHub Actions  
* Nginx  
* Let's Encrypt

## **8\. Documentación Base**

**Normativas:**

* Decreto 3016 de 2013 (Reglamentación Sistema General de Regalías)  
* Decisión 391 de 1996 (Régimen Común sobre Acceso a Recursos Genéticos)  
* Protocolo de Nagoya sobre ABS  
* Resolución 1348 de 2014 (Permisos de recolección)

**Recursos Técnicos:**

* [iNaturalist Dataset](https://www.inaturalist.org/)  
* [TensorFlow Image Classification](https://www.tensorflow.org/tutorials/images/classification)  
* [LangChain Documentation](https://python.langchain.com/)  
* [Stripe API Docs](https://stripe.com/docs/api)  
* [React Native Camera](https://react-native-vision-camera.com/)

**Investigación:**

* "Deep Learning for Plant Species Identification" (Ecological Informatics)  
* "Biodiversity Informatics and the Plant Conservation Baseline" (Trends in Plant Science)

## **9\. Productos Resultantes**

* \[ \] Plataforma Web Completa: Catálogo \+ Marketplace  
* \[ \] Modelo de Clasificación: CNN para 300+ especies  
* \[ \] App Móvil: Identificación en campo con offline  
* \[ \] Chatbot de Biocomercio: RAG con 1000+ especies  
* \[ \] Generador de Planes de Negocio: IA generativa  
* \[ \] API REST: Documentada para integraciones  
* \[ \] Sistema Dockerizado: Multi-contenedor  
* \[ \] 6 Manuales: Usuario, instalación, mantenimiento, API, IA, marketplace

## **10\. Lista de Chequeo de Entregables**

### **Documentación**

* \[ \] Documento de Visión completo  
* \[ \] Documento de Arquitectura de microservicios  
* \[ \] Modelo ER completo  
* \[ \] Manual de Usuario (50+ páginas)  
* \[ \] Manual de Instalación y Configuración  
* \[ \] Manual de Mantenimiento de modelos IA  
* \[ \] Guía de API Swagger/OpenAPI

### **Backend**

* \[ \] Clean Architecture implementada  
* \[ \] CQRS con MediatR  
* \[ \] JWT \+ 2FA funcional  
* \[ \] Gestión de roles (6+ roles)  
* \[ \] CRUD de especies y productos  
* \[ \] Integración con pasarela de pagos  
* \[ \] API de clasificación de especies  
* \[ \] Pruebas unitarias \>70%

### **Frontend Web**

* \[ \] Catálogo de biodiversidad con búsqueda  
* \[ \] Mapas de distribución (Leaflet)  
* \[ \] Marketplace con carrito y checkout  
* \[ \] Dashboard de vendedores  
* \[ \] Chatbot integrado  
* \[ \] Generador de planes de negocio  
* \[ \] Responsive design  
* \[ \] Pruebas E2E

### **Frontend Móvil**

* \[ \] App React Native funcional  
* \[ \] Cámara para captura de especies  
* \[ \] Clasificación offline  
* \[ \] GPS para georreferenciación  
* \[ \] Sincronización con backend

### **Base de Datos**

* \[ \] PostgreSQL configurado (especies)  
* \[ \] SQL Server configurado (transacciones)  
* \[ \] Migraciones versionadas  
* \[ \] Seeders con 300+ especies  
* \[ \] Índices optimizados  
* \[ \] Backup automatizado

### **Inteligencia Artificial**

* \[ \] Dataset de 10,000+ imágenes recolectado  
* \[ \] Modelo CNN entrenado (accuracy \>85%)  
* \[ \] FastAPI microservicio desplegado  
* \[ \] RAG con 1000+ especies funcional  
* \[ \] Chatbot con LangChain operativo  
* \[ \] Generador de planes de negocio con GPT-4  
* \[ \] Métricas del modelo documentadas

### **Marketplace**

* \[ \] Catálogo de productos funcional  
* \[ \] Carrito de compras  
* \[ \] Integración con PSE/Stripe  
* \[ \] Sistema de calificaciones  
* \[ \] Dashboard de analíticas  
* \[ \] Trazabilidad de productos  
* \[ \] Certificaciones de sostenibilidad

### **Seguridad**

* \[ \] HTTPS configurado  
* \[ \] JWT \+ refresh tokens  
* \[ \] 2FA con TOTP  
* \[ \] PCI DSS compliance (pagos)  
* \[ \] Protección XSS, CSRF, SQL Injection  
* \[ \] Gestión segura de secretos  
* \[ \] Logging de transacciones

### **DevOps**

* \[ \] Docker Compose multi-contenedor  
* \[ \] Compatible Windows Server 2025  
* \[ \] Compatible Linux  
* \[ \] CI/CD con GitHub Actions  
* \[ \] Nginx configurado  
* \[ \] SSL/TLS

### **Testing**

* \[ \] Pruebas unitarias backend (\>70%)  
* \[ \] Pruebas de integración  
* \[ \] Pruebas del modelo IA (validación)  
* \[ \] Pruebas de pasarela de pagos (sandbox)  
* \[ \] Pruebas E2E frontend  
* \[ \] Pruebas de usabilidad móvil

### **Presentación Final**

* \[ \] Video demostración (15 minutos)  
* \[ \] Presentación PowerPoint (30 slides)  
* \[ \] Demo en vivo funcional  
* \[ \] Repositorio Git completo  
* \[ \] Sistema desplegado online

