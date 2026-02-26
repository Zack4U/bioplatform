# Diccionario de Datos y Arquitectura de Persistencia

## Proyecto: Plataforma de Biodiversidad y Biocomercio (Caldas)

Este documento detalla la estructura física de datos, tipos, restricciones y la distribución entre los motores de base de datos, alineado con los principios de Clean Architecture y la normativa legal vigente (Decreto 3016, Protocolo de Nagoya, Decisión 391).

---

# **1. Estrategia de Distribución de Bases de Datos**

Siguiendo los requerimientos del proyecto, se separa la persistencia en dos contextos principales para optimizar el rendimiento y la integridad:

| Base de Datos | Motor | Contextos (Dominios) | Justificación Técnica |
| :---- | :---- | :---- | :---- |
| **BioCommerce\_Transactional** | **SQL Server** | Identity (IAM), Marketplace, Transacciones, Legal (Permisos ABS), Certificaciones | Alta integridad referencial, soporte robusto para transacciones financieras (ACID strict), compatibilidad con sistemas empresariales tradicionales. |
| **BioCommerce\_Scientific** | **PostgreSQL** | Taxonomía, Especies, Geolocalización (PostGIS), Computer Vision (MLOps), GenAI (RAG/Chat, Business Plans) | Soporte nativo para JSONB (metadatos AI), PostGIS (mapas de distribución), manejo eficiente de grandes volúmenes de texto científico y logs de inferencia. |

**Nota de Arquitectura:** La comunicación entre dominios de SQL Server y PostgreSQL se realiza a través de **UUIDs** (Logical Foreign Keys). No existe integridad referencial física entre motores; la integridad se garantiza en la Capa de Aplicación (Use Cases).

---

# **2. Base de Datos: BioCommerce\_Transactional (SQL Server)**

## **Contexto: Identity & Access Management (IAM)**

### **Tabla: Users**

*Gestión de usuarios y credenciales. Soporte para 2FA (TOTP).*

| Campo | Tipo de Dato (SQL) | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK, Not Null | Identificador único global del usuario. | a0eebc99-9c0b... |
| email | NVARCHAR(255) | UK, Not Null | Correo electrónico (Username). | researcher@caldas.gov.co |
| password\_hash | NVARCHAR(MAX) | Not Null | Hash de contraseña (Argon2id o BCrypt). | $2a$12$R9h/cO... |
| full\_name | NVARCHAR(150) | Not Null | Nombre legal completo. | Maria Rodriguez |
| phone\_number | NVARCHAR(20) | Nullable | Teléfono para contacto o SMS 2FA. | +573001234567 |
| is\_verified | BIT | Default 0 | Indica si el email/teléfono ha sido confirmado. | 1 (True) |
| two\_factor\_secret | NVARCHAR(100) | Nullable | Semilla secreta para TOTP (Google Auth). | JBSWY3DPEHPK3... |
| last\_login | DATETIME2 | Nullable | Último inicio de sesión exitoso. | 2025-02-20 14:30:00 |
| is\_active | BIT | Default 1 | Soft delete. | 1 |
| created\_at | DATETIME2 | Default GETUTCDATE() | Fecha de registro. | 2025-01-15 10:00:00 |

### **Tabla: Roles**

*Roles del sistema. Soporta RBAC con 6 roles base.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | INT | PK, Identity | ID numérico del rol. | 1 |
| name | NVARCHAR(50) | UK, Not Null | Nombre del rol. Valores: Admin, Researcher, Entrepreneur, Community, Buyer, Authority. | Researcher |
| description | NVARCHAR(200) | Nullable | Descripción funcional del rol. | Can validate species and upload images |

### **Tabla: UserRoles**

*Tabla de unión muchos-a-muchos entre Users y Roles. Un usuario puede tener múltiples roles.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| user\_id | UNIQUEIDENTIFIER | PK (compuesta), FK (Users) | ID del usuario. | a0eebc99-9c0b... |
| role\_id | INT | PK (compuesta), FK (Roles) | ID del rol asignado. | 2 |

---

## **Contexto: Marketplace & Legal (Biocomercio)**

### **Tabla: ProductCategories**

*Categorías de productos del marketplace.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | INT | PK, Identity | ID numérico de la categoría. | 1 |
| name | NVARCHAR(100) | UK, Not Null | Nombre de la categoría. Ej: Artesanía, Ingrediente Natural, Ecoturismo. | Ingrediente Natural |

### **Tabla: Products**

*Productos derivados de la biodiversidad, listados en el marketplace.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID del producto. | b123... |
| slug | NVARCHAR(200) | UK, Not Null | Slug URL-friendly para rutas SEO del producto. | crema-de-orquidea |
| entrepreneur\_id | UNIQUEIDENTIFIER | FK (Users), Not Null | Usuario vendedor. | a0ee... |
| base\_species\_id | UNIQUEIDENTIFIER | Index, Not Null | **Logical FK** a PostgreSQL (Species). Especie base del producto. Crítico para trazabilidad ABS. | c456... |
| category\_id | INT | FK (ProductCategories), Nullable | Categoría del producto. | 1 |
| name | NVARCHAR(100) | Not Null | Nombre comercial. | Crema de Orquídea |
| description | NVARCHAR(MAX) | Not Null | Descripción de marketing. | Hidratante natural... |
| price | DECIMAL(18,2) | Not Null | Precio unitario en COP. | 45000.00 |
| stock\_quantity | INT | Not Null | Inventario disponible. | 50 |
| sku | NVARCHAR(50) | UK | Código de referencia único (SKU). | CRE-ORQ-001 |
| is\_active | BIT | Default 1 | Indica si el producto está visible en el marketplace. | 1 |
| thumbnail\_url | NVARCHAR(255) | Nullable | URL de imagen miniatura para listados del marketplace. | https://cdn.example.com/products/b123/thumb.webp |
| created\_at | DATETIME2 | Default GETUTCDATE() | Fecha de creación. | 2025-01-20 08:00:00 |

### **Tabla: AbsPermits** *(Critical Compliance)*

*Permisos de Acceso a Recursos Genéticos. Cumplimiento Decisión 391 / Protocolo de Nagoya.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID del permiso. | d789... |
| entrepreneur\_id | UNIQUEIDENTIFIER | FK (Users), Not Null | Titular del permiso. | a0ee... |
| species\_id | UNIQUEIDENTIFIER | Not Null | **Logical FK** a PostgreSQL (Species). Especie autorizada. | c456... |
| resolution\_number | NVARCHAR(100) | UK, Not Null | Número de resolución (ANLA/CAR/MinAmbiente). | Res-1348-2024 |
| emission\_date | DATE | Not Null | Fecha de emisión del permiso. | 2024-01-15 |
| expiration\_date | DATE | Not Null | Fecha de vencimiento. | 2029-01-15 |
| granting\_authority | NVARCHAR(100) | Not Null | Entidad que otorga el permiso. | Corpocaldas |
| status | NVARCHAR(20) | Not Null | Estado legal: 'Active', 'Expired', 'Suspended'. | Active |
| legal\_framework | NVARCHAR(100) | Nullable | Marco normativo aplicable. | Decreto 3016, Decisión 391 |

### **Tabla: SustainabilityCerts**

*Catálogo de certificaciones de sostenibilidad disponibles.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID de la certificación. | cert1... |
| name | NVARCHAR(100) | UK, Not Null | Nombre de la certificación. | Negocios Verdes |
| issuer | NVARCHAR(150) | Not Null | Entidad emisora. | MinAmbiente |
| logo\_url | NVARCHAR(255) | Nullable | URL del logo de la certificación. | https://cdn.../nv-logo.png |

### **Tabla: ProductCerts**

*Tabla de unión: certificaciones otorgadas a productos específicos.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| product\_id | UNIQUEIDENTIFIER | PK (compuesta), FK (Products) | Producto certificado. | b123... |
| cert\_id | UNIQUEIDENTIFIER | PK (compuesta), FK (SustainabilityCerts) | Certificación aplicada. | cert1... |
| valid\_until | DATE | Nullable | Fecha de vencimiento de la certificación para este producto. | 2026-12-31 |
| verification\_code | NVARCHAR(100) | Nullable | Código verificable de la certificación. | NV-2025-00421 |

### **Tabla: TraceabilityBatches**

*Lotes de trazabilidad de origen para productos. Cumple requisito de trazabilidad desde origen.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID del lote. | batch1... |
| product\_id | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto trazado. | b123... |
| batch\_code | NVARCHAR(50) | UK, Not Null | Código único del lote. | LOT-2025-001 |
| harvest\_date | DATE | Not Null | Fecha de cosecha/recolección. | 2025-03-10 |
| origin\_location | NVARCHAR(200) | Not Null | Ubicación de origen (municipio, vereda). | Vereda La Esperanza, Manizales |
| processing\_details | NVARCHAR(MAX) | Nullable | Descripción del procesamiento. | Secado al sol, 5 días... |
| blockchain\_hash | NVARCHAR(100) | Nullable | Hash de integridad en blockchain (opcional). | 0x4a3b... |

---

## **Contexto: Transactions & Sales**

### **Tabla: Orders**

*Cabecera de transacciones de compra.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID de la orden. | e999... |
| buyer\_id | UNIQUEIDENTIFIER | FK (Users), Not Null | Usuario comprador. | f111... |
| total\_amount | DECIMAL(18,2) | Not Null | Total pagado en COP. | 90000.00 |
| status | NVARCHAR(20) | Not Null | Estado del pedido: 'Pending', 'Paid', 'Shipped', 'Cancelled'. | Paid |
| payment\_method | NVARCHAR(50) | Not Null | Pasarela usada. | Stripe, PSE |
| transaction\_ref | NVARCHAR(100) | Nullable | ID de transacción de la pasarela (Stripe payment intent ID). | pi\_1De... |
| created\_at | DATETIME2 | Default GETUTCDATE() | Fecha de creación de la orden. | 2025-02-20 14:00:00 |

### **Tabla: OrderItems**

*Líneas de detalle de cada orden. Una orden contiene uno o más ítems.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID del ítem. | item1... |
| order\_id | UNIQUEIDENTIFIER | FK (Orders), Not Null | Orden padre. | e999... |
| product\_id | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto comprado. | b123... |
| quantity | INT | Not Null, Check > 0 | Cantidad comprada. | 2 |
| unit\_price | DECIMAL(18,2) | Not Null | Precio unitario al momento de la compra (snapshot). | 45000.00 |

### **Tabla: Reviews**

*Calificaciones y reseñas de productos por compradores.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID de la reseña. | rev1... |
| product\_id | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto reseñado. | b123... |
| user\_id | UNIQUEIDENTIFIER | FK (Users), Not Null | Usuario que escribe la reseña. | f111... |
| rating | INT | Not Null, Check 1-5 | Calificación numérica (1 a 5 estrellas). | 4 |
| comment | NVARCHAR(MAX) | Nullable | Comentario textual del comprador. | Excelente calidad... |
| created\_at | DATETIME2 | Default GETUTCDATE() | Fecha de la reseña. | 2025-03-01 09:00:00 |

---

# **3. Base de Datos: BioCommerce\_Scientific (PostgreSQL)**

## **Contexto: Biodiversity Catalog (Core Científico)**

### **Tabla: Taxonomies**

*Clasificación biológica jerárquica completa (hasta Género).*

| Campo | Tipo de Dato (Postgres) | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | SERIAL | PK | ID numérico interno. | 101 |
| kingdom | VARCHAR(50) | Not Null | Reino. | Plantae |
| phylum | VARCHAR(50) | Nullable | Filo/División. | Tracheophyta |
| class\_name | VARCHAR(50) | Nullable | Clase taxonómica. | Magnoliopsida |
| order\_name | VARCHAR(50) | Nullable | Orden taxonómico. | Asparagales |
| family | VARCHAR(50) | Index, Not Null | Familia (clave para búsquedas). | Orchidaceae |
| genus | VARCHAR(50) | Not Null | Género. | Cattleya |

### **Tabla: Species**

*Entidad central del catálogo de biodiversidad.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK, Default gen\_random\_uuid() | Identificador único de especie. | c456... |
| taxonomy\_id | INT | FK (Taxonomies), Not Null | Relación taxonómica. | 101 |
| slug | VARCHAR(200) | UK, Not Null | Slug URL-friendly generado del nombre común o científico. Para rutas SEO. | cattleya-trianae |
| scientific\_name | VARCHAR(150) | UK, Not Null | Nombre científico único (binominal). | Cattleya trianae |
| common\_name | VARCHAR(150) | Nullable | Nombre vernáculo en la región. | Flor de Mayo |
| description | TEXT | Nullable | Descripción morfológica. | Epífita con pseudobulbos... |
| ecological\_info | TEXT | Nullable | Datos de hábitat y ecología (source para RAG). | Bosque de niebla entre 1800-2500m... |
| traditional\_uses | TEXT | Nullable | Usos etnobotánicos y conocimiento ancestral. Importante para biocomercio y resguardos. | Ornamental, ceremonial |
| economic\_potential | VARCHAR(200) | Nullable | Potencial de aprovechamiento económico sostenible. | Alto potencial ornamental y cosmético |
| conservation\_status | VARCHAR(30) | Nullable | Estado de conservación (IUCN / Libros Rojos de Colombia). | Vulnerable (VU) |
| is\_sensitive | BOOLEAN | Default False | Si es True, se enmascara la ubicación exacta. (Protección especies amenazadas). | true |
| thumbnail\_url | VARCHAR(255) | Nullable | URL de imagen miniatura para listados y cards. Se genera al subir la primera imagen validada. | https://cdn.example.com/species/c456/thumb.webp |
| created\_at | TIMESTAMPTZ | Default NOW() | Fecha de creación del registro. | 2025-01-10 08:00:00+00 |
| updated\_at | TIMESTAMPTZ | Nullable | Última actualización del registro. | 2025-02-15 12:00:00+00 |

### **Tabla: GeographicDistributions** *(GIS)*

*Ubicación geoespacial de avistamientos/distribución de especies. Requiere extensión PostGIS.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK, Default gen\_random\_uuid() | ID del registro de distribución. | d555... |
| species\_id | UUID | FK (Species), Not Null | Especie avistada/registrada. | c456... |
| latitude | FLOAT | Not Null | Latitud del punto de observación. | 5.0689 |
| longitude | FLOAT | Not Null | Longitud del punto de observación. | -75.5174 |
| altitude | FLOAT | Nullable | Metros sobre el nivel del mar. | 2150 |
| municipality | VARCHAR(100) | Not Null, Index | Municipio de Caldas. | Manizales |
| ecosystem\_type | VARCHAR(100) | Nullable | Tipo de ecosistema en el punto de observación. | Bosque de niebla |
| location\_point | GEOGRAPHY(Point, 4326) | Index (GIST) | Punto PostGIS calculado a partir de lat/lon. Para queries espaciales. | SRID=4326;POINT(-75.5174 5.0689) |

---

## **Contexto: Computer Vision & AI (MLOps)**

### **Tabla: SpeciesImages**

*Dataset de imágenes para entrenamiento, validación y galería del catálogo.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK, Default gen\_random\_uuid() | ID de la imagen. | img1... |
| species\_id | UUID | FK (Species), Not Null | Especie etiquetada (Ground Truth). | c456... |
| uploader\_user\_id | UUID | Index, Not Null | **Logical FK** a SQL Server (Users). Quién subió la foto. | a0ee... |
| image\_url | VARCHAR(255) | Not Null | URL en Object Storage (S3/Azure Blob). | https://bucket.../img.jpg |
| metadata | JSONB | Nullable | Metadatos EXIF (cámara, fecha, ISO, resolución). | {"iso": 100, "model": "Pixel 7"} |
| license\_type | VARCHAR(50) | Default 'CC-BY' | Licencia de uso de la imagen. | CC-BY-NC |
| is\_validated\_by\_expert | BOOLEAN | Default False | Indica si un investigador validó la etiqueta de especie. Crucial para fine-tuning. | false |
| used\_for\_training | BOOLEAN | Default False | Indica si la imagen fue incluida en el dataset de entrenamiento del modelo CNN. | true |

### **Tabla: PredictionLogs**

*Registro de inferencias del modelo CNN para monitoreo y feedback loop.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK, Default gen\_random\_uuid() | ID del log de predicción. | log1... |
| user\_id | UUID | Index, Not Null | **Logical FK** a SQL Server (Users). Quién solicitó la predicción. | a0ee... |
| image\_input\_url | VARCHAR(255) | Not Null | URL de la imagen analizada. | https://.../temp.jpg |
| raw\_prediction\_result | JSONB | Not Null | Salida cruda del modelo (Top-K probabilidades). | [{"class": "Cattleya trianae", "prob": 0.92}] |
| confidence\_score | DECIMAL(5,4) | Not Null | Confianza de la predicción principal (0.0000 a 1.0000). | 0.9250 |
| predicted\_species\_id | UUID | FK (Species), Nullable | Especie predicha con mayor confianza. | c456... |
| feedback\_correct | BOOLEAN | Nullable | Feedback del usuario/experto: ¿Acertó el modelo? Para reentrenamiento. | true |
| timestamp | TIMESTAMPTZ | Default NOW() | Momento de la inferencia. | 2025-02-20 14:35:00+00 |

### **Tabla: AiModelVersions**

*Versionado de modelos de IA desplegados. Soporte para MLOps y rollback.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | SERIAL | PK | ID numérico del modelo. | 1 |
| model\_name | VARCHAR(100) | Not Null | Arquitectura del modelo. | ResNet50 |
| version | VARCHAR(20) | UK, Not Null | Versión semántica del modelo. | v1.0.0 |
| accuracy\_metric | DECIMAL(5,4) | Not Null | Métrica de accuracy en el dataset de validación. | 0.8750 |
| deployed\_at | TIMESTAMPTZ | Not Null | Fecha de despliegue en producción. | 2025-03-01 00:00:00+00 |
| is\_active | BOOLEAN | Default False | Indica si es la versión activa sirviendo predicciones. | true |

---

## **Contexto: GenAI & Business Assistant (PostgreSQL)**

### **Tabla: BusinessPlans**

*Planes de negocio generados por el asistente de IA (GPT-4).*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK, Default gen\_random\_uuid() | ID del plan. | plan1... |
| entrepreneur\_id | UUID | Index, Not Null | **Logical FK** a SQL Server (Users). Emprendedor solicitante. | a0ee... |
| project\_title | VARCHAR(200) | Not Null | Título del proyecto de biocomercio. | Exportación de Vainilla Orgánica |
| generated\_content | TEXT | Not Null | Contenido completo en Markdown generado por GPT-4. | # Plan de Negocio... |
| market\_analysis\_data | JSONB | Nullable | Datos estructurados para gráficos del Dashboard. | {"cagr": "5%", "competitors": [...]} |
| created\_at | TIMESTAMPTZ | Default NOW() | Fecha de generación del plan. | 2025-02-25 10:00:00+00 |

### **Tabla: ChatSessions**

*Sesiones de conversación con el chatbot RAG de asesoría en biocomercio.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK, Default gen\_random\_uuid() | ID de la sesión. | sess1... |
| user\_id | UUID | Index, Not Null | **Logical FK** a SQL Server (Users). Usuario que inicia el chat. | a0ee... |
| started\_at | TIMESTAMPTZ | Default NOW() | Inicio de la sesión. | 2025-02-20 09:00:00+00 |
| context\_topic | VARCHAR(100) | Nullable | Tema de contexto para el RAG. | Biocommerce, Taxonomy, Conservation |

### **Tabla: ChatMessages**

*Mensajes individuales dentro de una sesión de chat. Historial del chatbot.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK, Default gen\_random\_uuid() | ID del mensaje. | msg1... |
| session\_id | UUID | FK (ChatSessions), Not Null | Sesión padre. | sess1... |
| role | VARCHAR(20) | Not Null | Rol del emisor: 'user' o 'assistant'. | user |
| content | TEXT | Not Null | Contenido del mensaje. | ¿Qué permisos necesito para comercializar orquídeas? |
| created\_at | TIMESTAMPTZ | Default NOW() | Timestamp del mensaje. | 2025-02-20 09:01:00+00 |

---

# **4. Notas de Implementación**

1. **Manejo de Fechas:** Todas las fechas (`created_at`, `updated_at`, `timestamp`) deben guardarse en **UTC**. La conversión a hora local (Colombia GMT-5) se realiza exclusivamente en el Frontend.
2. **Imágenes:** Las bases de datos **NO** almacenan archivos binarios (BLOBs). Solo se almacenan **URLs** apuntando a un servicio de almacenamiento externo (Azure Blob Storage o AWS S3).
3. **Auditoría:** Las tablas críticas (Species, Products, Orders) deben incluir columnas `created_at` y `updated_at` (Timestamp) para cumplir con requisitos de trazabilidad.
4. **Geospatial:** La tabla `GeographicDistributions` requiere la extensión PostGIS habilitada en PostgreSQL (`CREATE EXTENSION postgis;`). El campo `location_point` se computa a partir de `latitude`/`longitude`.
5. **Logical Foreign Keys:** Los campos que referencian entidades en el otro motor de base de datos (marcados como **Logical FK**) no tienen restricción física de FK. La validación de existencia se ejecuta en la Capa de Aplicación (Commands/Queries con MediatR).
6. **Sensitive Data (Bio-Safety):** Cuando `Species.is_sensitive = True`, la API debe enmascarar las coordenadas exactas de `GeographicDistributions` y retornar únicamente el centro del municipio. Nunca exponer ubicación exacta de especies amenazadas.
7. **ABS Compliance (Nagoya):** Un `Product` no puede crearse sin un `AbsPermit` activo y vigente para el `base_species_id` correspondiente. Esta regla se valida en el `CreateProductCommand` (Application Layer).
8. **MLOps:** La tabla `AiModelVersions` permite rollback de modelos. Solo una versión puede tener `is_active = True` en cualquier momento dado.

