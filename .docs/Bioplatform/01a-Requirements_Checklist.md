# Checklist Unificado — Plataforma de Biodiversidad y Biocomercio con IA Generativa

---

## Alcance (In-Scope)

- [ ] Catálogo digital de biodiversidad de Caldas (flora, fauna, hongos)
- [ ] Sistema de identificación de especies con CNN
- [ ] Registro de usuarios (Investigador, Emprendedor, Comunidad, Comprador)
- [ ] Marketplace de productos de biocomercio
- [ ] Gestión de permisos de acceso a recursos genéticos
- [ ] Trazabilidad de productos desde origen
- [ ] Sistema de certificaciones de sostenibilidad
- [ ] Pasarela de pagos integrada (PSE, tarjetas)
- [ ] RAG con base de conocimiento de 1000+ especies
- [ ] Chatbot de asesoría en biocomercio
- [ ] IA generativa para planes de negocio
- [ ] Mapas de distribución de especies
- [ ] Foros comunitarios y networking
- [ ] Dashboard de analíticas para emprendedores
- [ ] Aplicación móvil para identificación en campo

---

## Documentación

- [x] Documento de Visión del ecosistema de biocomercio
- [x] Documento de Arquitectura de microservicios
- [x] Modelo ER completo (especies, productos, transacciones)
- [x] Wireframes de marketplace y app móvil
- [x] Product Backlog priorizado
- [x] Análisis de normativa de acceso a recursos genéticos
- [ ] Manual de Usuario completo (50+ páginas)
- [ ] Manual de Instalación y Configuración
- [ ] Manual de Mantenimiento de modelos IA
- [x] Guía de API Swagger/OpenAPI
- [ ] Video demostración y presentación final

---

## Arquitectura e Infraestructura

- [x] Backend .NET 8: Clean Architecture
- [x] Base de datos PostgreSQL (especies) y SQL Server (transacciones)
- [x] Frontend Next.js: arquitectura de componentes
- [x] Configuración Docker multi-contenedor
- [x] Repositorio Git con CI/CD
- [ ] Integración con pasarela de pagos (sandbox)
- [x] Investigación de biodiversidad de Caldas
- [x] Diseño de taxonomía y catálogo
- [x] Configuración de entorno

---

## Backend

- [x] Clean Architecture implementada
- [x] CQRS con MediatR
- [x] Sistema de autenticación JWT + 2FA
- [x] Gestión de usuarios y roles (6+ roles)
- [x] CRUD de especies con taxonomía completa
- [ ] CRUD y gestión de productos y ventas
- [ ] Integración con pasarela de pagos
- [x] API de clasificación de especies
- [x] Pruebas unitarias >70%

---

## Frontend Web

- [x] Catálogo de biodiversidad con búsqueda avanzada
- [x] Mapas de distribución (Leaflet)
- [x] Galería de imágenes con zoom
- [x] Fichas técnicas completas de especies
- [/] Marketplace con catálogo de productos, filtros, carrito y checkout
- [/] Dashboard de vendedores con analíticas
- [ ] Chatbot integrado
- [ ] Generador de planes de negocio
- [ ] Sistema de calificaciones y reseñas
- [x] Carga masiva de datos
- [x] Responsive design
- [ ] Pruebas E2E

---

## Frontend Móvil

- [x] App React Native funcional para identificación de especies
- [x] Cámara integrada para captura de imágenes
- [ ] Clasificación offline con base de datos local
- [/] GPS para georreferenciación
- [x] Sincronización con backend

---

## Base de Datos

- [x] PostgreSQL configurado (especies)
- [x] SQL Server configurado (transacciones)
- [x] Migraciones versionadas
- [x] Seeders con 300+ especies
- [x] Índices optimizados
- [ ] Backup automatizado

---

## Inteligencia Artificial

- [x] Dataset de 10,000+ imágenes de 300+ especies recolectado
- [x] Modelo CNN (ResNet50 o EfficientNet) entrenado (accuracy >85%)
- [x] API de clasificación con FastAPI desplegada
- [x] Integración en app web y móvil
- [ ] Sistema de validación por investigadores
- [x] Dashboard de métricas del modelo (accuracy, confusion matrix)
- [x] Métricas del modelo documentadas
- [ ] Fine-tuning con nuevas imágenes validadas
- [x] Testing de precisión
- [/] RAG con base de conocimiento de 1000+ especies funcional
- [ ] Chatbot con LangChain para asesoría operativo
- [ ] Generador de planes de negocio con GPT-4
- [ ] Análisis de mercado automático
- [ ] Recomendaciones de productos basadas en biodiversidad local

---

## Marketplace

- [/] Catálogo de productos funcional
- [/] Carrito de compras
- [ ] Integración con PSE/Stripe
- [ ] Sistema de calificaciones y reseñas
- [ ] Dashboard de analíticas
- [ ] Trazabilidad de productos
- [ ] Trazabilidad de productos con blockchain (opcional)
- [ ] Certificaciones de sostenibilidad
- [ ] Sistema de permisos de acceso a recursos

---

## Seguridad

- [x] HTTPS configurado
- [x] JWT + refresh tokens
- [x] 2FA con TOTP
- [ ] PCI DSS compliance (pagos)
- [x] Protección XSS, CSRF, SQL Injection
- [x] Gestión segura de secretos
- [x] Logging de transacciones

---

## DevOps

- [x] Docker Compose multi-contenedor
- [ ] Compatible Windows Server 2025
- [ ] Compatible Linux
- [x] CI/CD con GitHub Actions
- [ ] Nginx configurado
- [ ] SSL/TLS

---

## Testing

- [ ] Pruebas unitarias backend (>70%)
- [ ] Pruebas de integración
- [ ] Pruebas del modelo IA (validación)
- [ ] Pruebas de pasarela de pagos (sandbox)
- [ ] Pruebas E2E frontend
- [ ] Pruebas de usabilidad móvil

---

## Productos Resultantes

- [ ] Plataforma Web Completa: Catálogo + Marketplace
- [ ] Modelo de Clasificación: CNN para 300+ especies
- [ ] App Móvil: Identificación en campo con offline
- [ ] Chatbot de Biocomercio: RAG con 1000+ especies
- [ ] Generador de Planes de Negocio: IA generativa
- [ ] API REST: Documentada para integraciones
- [ ] Sistema Dockerizado: Multi-contenedor
- [ ] 6 Manuales: Usuario, instalación, mantenimiento, API, IA, marketplace

---

## Presentación Final

- [ ] Video demostración (15 minutos)
- [ ] Presentación PowerPoint (30 slides)
- [ ] Demo en vivo funcional
- [ ] Repositorio Git completo
- [ ] Sistema desplegado online
