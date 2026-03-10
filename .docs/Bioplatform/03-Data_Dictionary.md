# Diccionario de Datos y Arquitectura de Persistencia

## Proyecto: Plataforma de Biodiversidad y Biocomercio (Caldas)

Este documento detalla la estructura física de datos, tipos, restricciones y la distribución entre los motores de base de datos, alineado con los principios de Clean Architecture y la normativa legal vigente (Decreto 3016, Protocolo de Nagoya, Decisión 391).

---

# **1. Estrategia de Distribución de Bases de Datos**

Siguiendo los requerimientos del proyecto, se separa la persistencia en dos contextos principales para optimizar el rendimiento y la integridad:

| Base de Datos                 | Motor          | Contextos (Dominios)                                                                                      | Justificación Técnica                                                                                                                                      |
| :---------------------------- | :------------- | :-------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BioCommerce_Transactional** | **SQL Server** | Identity (IAM), Marketplace, Transacciones, Legal (Permisos ABS), Certificaciones                         | Alta integridad referencial, soporte robusto para transacciones financieras (ACID strict), compatibilidad con sistemas empresariales tradicionales.        |
| **BioCommerce_Scientific**    | **PostgreSQL** | Taxonomía, Especies, Geolocalización (PostGIS), Computer Vision (MLOps), GenAI (RAG/Chat, Business Plans) | Soporte nativo para JSONB (metadatos AI), PostGIS (mapas de distribución), manejo eficiente de grandes volúmenes de texto científico y logs de inferencia. |

**Nota de Arquitectura:** La comunicación entre dominios de SQL Server y PostgreSQL se realiza a través de **UUIDs** (Logical Foreign Keys). No existe integridad referencial física entre motores; la integridad se garantiza en la Capa de Aplicación (Use Cases).

---

# **2. Base de Datos: BioCommerce_Transactional (SQL Server)**

## **Contexto: Identity & Access Management (IAM)**

### **Tabla: Users**

_Gestión de usuarios y credenciales. Soporte para 2FA (TOTP)._

| Campo             | Tipo de Dato (SQL) | Restricciones        | Descripción                                     | Ejemplo                  |
| :---------------- | :----------------- | :------------------- | :---------------------------------------------- | :----------------------- |
| id                | UNIQUEIDENTIFIER   | PK, Not Null         | Identificador único global del usuario.         | a0eebc99-9c0b...         |
| email             | NVARCHAR(255)      | UK, Not Null         | Correo electrónico (Username).                  | researcher@caldas.gov.co |
| password_hash     | NVARCHAR(MAX)      | Not Null             | Hash de contraseña (Argon2id o BCrypt).         | $2a$12$R9h/cO...         |
| full_name         | NVARCHAR(150)      | Not Null             | Nombre legal completo.                          | Maria Rodriguez          |
| phone_number      | NVARCHAR(20)       | Nullable             | Teléfono para contacto o SMS 2FA.               | +573001234567            |
| is_verified       | BIT                | Default 0            | Indica si el email/teléfono ha sido confirmado. | 1 (True)                 |
| two_factor_secret | NVARCHAR(100)      | Nullable             | Semilla secreta para TOTP (Google Auth).        | JBSWY3DPEHPK3...         |
| last_login        | DATETIME2          | Nullable             | Último inicio de sesión exitoso.                | 2025-02-20 14:30:00      |
| is_active         | BIT                | Default 1            | Soft delete.                                    | 1                        |
| created_at        | DATETIME2          | Default GETUTCDATE() | Fecha de registro.                              | 2025-01-15 10:00:00      |

### **Tabla: Roles**

_Roles del sistema. Soporta RBAC con 6 roles base._

| Campo       | Tipo de Dato  | Restricciones | Descripción                                                                            | Ejemplo                                |
| :---------- | :------------ | :------------ | :------------------------------------------------------------------------------------- | :------------------------------------- |
| id          | INT           | PK, Identity  | ID numérico del rol.                                                                   | 1                                      |
| name        | NVARCHAR(50)  | UK, Not Null  | Nombre del rol. Valores: Admin, Researcher, Entrepreneur, Community, Buyer, Authority. | Researcher                             |
| description | NVARCHAR(200) | Nullable      | Descripción funcional del rol.                                                         | Can validate species and upload images |

### **Tabla: UserRoles**

_Tabla de unión muchos-a-muchos entre Users y Roles. Un usuario puede tener múltiples roles._

| Campo   | Tipo de Dato     | Restricciones              | Descripción          | Ejemplo          |
| :------ | :--------------- | :------------------------- | :------------------- | :--------------- |
| user_id | UNIQUEIDENTIFIER | PK (compuesta), FK (Users) | ID del usuario.      | a0eebc99-9c0b... |
| role_id | INT              | PK (compuesta), FK (Roles) | ID del rol asignado. | 2                |

---

## **Contexto: Marketplace & Legal (Biocomercio)**

### **Tabla: ProductCategories**

_Categorías de productos del marketplace._

| Campo | Tipo de Dato  | Restricciones | Descripción                                                             | Ejemplo             |
| :---- | :------------ | :------------ | :---------------------------------------------------------------------- | :------------------ |
| id    | INT           | PK, Identity  | ID numérico de la categoría.                                            | 1                   |
| name  | NVARCHAR(100) | UK, Not Null  | Nombre de la categoría. Ej: Artesanía, Ingrediente Natural, Ecoturismo. | Ingrediente Natural |

### **Tabla: Products**

_Productos derivados de la biodiversidad, listados en el marketplace._

| Campo           | Tipo de Dato     | Restricciones                    | Descripción                                                                                      | Ejemplo                                          |
| :-------------- | :--------------- | :------------------------------- | :----------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| id              | UNIQUEIDENTIFIER | PK                               | ID del producto.                                                                                 | b123...                                          |
| slug            | NVARCHAR(200)    | UK, Not Null                     | Slug URL-friendly para rutas SEO del producto.                                                   | crema-de-orquidea                                |
| entrepreneur_id | UNIQUEIDENTIFIER | FK (Users), Not Null             | Usuario vendedor.                                                                                | a0ee...                                          |
| base_species_id | UNIQUEIDENTIFIER | Index, Not Null                  | **Logical FK** a PostgreSQL (Species). Especie base del producto. Crítico para trazabilidad ABS. | c456...                                          |
| category_id     | INT              | FK (ProductCategories), Nullable | Categoría del producto.                                                                          | 1                                                |
| name            | NVARCHAR(100)    | Not Null                         | Nombre comercial.                                                                                | Crema de Orquídea                                |
| description     | NVARCHAR(MAX)    | Not Null                         | Descripción de marketing.                                                                        | Hidratante natural...                            |
| price           | DECIMAL(18,2)    | Not Null                         | Precio unitario en COP.                                                                          | 45000.00                                         |
| stock_quantity  | INT              | Not Null                         | Inventario disponible.                                                                           | 50                                               |
| sku             | NVARCHAR(50)     | UK                               | Código de referencia único (SKU).                                                                | CRE-ORQ-001                                      |
| is_active       | BIT              | Default 1                        | Indica si el producto está visible en el marketplace.                                            | 1                                                |
| thumbnail_url   | NVARCHAR(255)    | Nullable                         | URL de imagen miniatura para listados del marketplace.                                           | https://cdn.example.com/products/b123/thumb.webp |
| created_at      | DATETIME2        | Default GETUTCDATE()             | Fecha de creación.                                                                               | 2025-01-20 08:00:00                              |

### **Tabla: AbsPermits** _(Critical Compliance)_

_Permisos de Acceso a Recursos Genéticos. Cumplimiento Decisión 391 / Protocolo de Nagoya._

| Campo              | Tipo de Dato     | Restricciones        | Descripción                                                | Ejemplo                    |
| :----------------- | :--------------- | :------------------- | :--------------------------------------------------------- | :------------------------- |
| id                 | UNIQUEIDENTIFIER | PK                   | ID del permiso.                                            | d789...                    |
| entrepreneur_id    | UNIQUEIDENTIFIER | FK (Users), Not Null | Titular del permiso.                                       | a0ee...                    |
| species_id         | UNIQUEIDENTIFIER | Not Null             | **Logical FK** a PostgreSQL (Species). Especie autorizada. | c456...                    |
| resolution_number  | NVARCHAR(100)    | UK, Not Null         | Número de resolución (ANLA/CAR/MinAmbiente).               | Res-1348-2024              |
| emission_date      | DATE             | Not Null             | Fecha de emisión del permiso.                              | 2024-01-15                 |
| expiration_date    | DATE             | Not Null             | Fecha de vencimiento.                                      | 2029-01-15                 |
| granting_authority | NVARCHAR(100)    | Not Null             | Entidad que otorga el permiso.                             | Corpocaldas                |
| status             | NVARCHAR(20)     | Not Null             | Estado legal: 'Active', 'Expired', 'Suspended'.            | Active                     |
| legal_framework    | NVARCHAR(100)    | Nullable             | Marco normativo aplicable.                                 | Decreto 3016, Decisión 391 |

### **Tabla: SustainabilityCerts**

_Catálogo de certificaciones de sostenibilidad disponibles._

| Campo    | Tipo de Dato     | Restricciones | Descripción                       | Ejemplo                    |
| :------- | :--------------- | :------------ | :-------------------------------- | :------------------------- |
| id       | UNIQUEIDENTIFIER | PK            | ID de la certificación.           | cert1...                   |
| name     | NVARCHAR(100)    | UK, Not Null  | Nombre de la certificación.       | Negocios Verdes            |
| issuer   | NVARCHAR(150)    | Not Null      | Entidad emisora.                  | MinAmbiente                |
| logo_url | NVARCHAR(255)    | Nullable      | URL del logo de la certificación. | https://cdn.../nv-logo.png |

### **Tabla: ProductCerts**

_Tabla de unión: certificaciones otorgadas a productos específicos._

| Campo             | Tipo de Dato     | Restricciones                            | Descripción                                                  | Ejemplo       |
| :---------------- | :--------------- | :--------------------------------------- | :----------------------------------------------------------- | :------------ |
| product_id        | UNIQUEIDENTIFIER | PK (compuesta), FK (Products)            | Producto certificado.                                        | b123...       |
| cert_id           | UNIQUEIDENTIFIER | PK (compuesta), FK (SustainabilityCerts) | Certificación aplicada.                                      | cert1...      |
| valid_until       | DATE             | Nullable                                 | Fecha de vencimiento de la certificación para este producto. | 2026-12-31    |
| verification_code | NVARCHAR(100)    | Nullable                                 | Código verificable de la certificación.                      | NV-2025-00421 |

### **Tabla: TraceabilityBatches**

_Lotes de trazabilidad de origen para productos. Cumple requisito de trazabilidad desde origen._

| Campo              | Tipo de Dato     | Restricciones           | Descripción                                  | Ejemplo                        |
| :----------------- | :--------------- | :---------------------- | :------------------------------------------- | :----------------------------- |
| id                 | UNIQUEIDENTIFIER | PK                      | ID del lote.                                 | batch1...                      |
| product_id         | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto trazado.                            | b123...                        |
| batch_code         | NVARCHAR(50)     | UK, Not Null            | Código único del lote.                       | LOT-2025-001                   |
| harvest_date       | DATE             | Not Null                | Fecha de cosecha/recolección.                | 2025-03-10                     |
| origin_location    | NVARCHAR(200)    | Not Null                | Ubicación de origen (municipio, vereda).     | Vereda La Esperanza, Manizales |
| processing_details | NVARCHAR(MAX)    | Nullable                | Descripción del procesamiento.               | Secado al sol, 5 días...       |
| blockchain_hash    | NVARCHAR(100)    | Nullable                | Hash de integridad en blockchain (opcional). | 0x4a3b...                      |

---

## **Contexto: Transactions & Sales**

### **Tabla: Orders**

_Cabecera de transacciones de compra._

| Campo           | Tipo de Dato     | Restricciones        | Descripción                                                   | Ejemplo             |
| :-------------- | :--------------- | :------------------- | :------------------------------------------------------------ | :------------------ |
| id              | UNIQUEIDENTIFIER | PK                   | ID de la orden.                                               | e999...             |
| buyer_id        | UNIQUEIDENTIFIER | FK (Users), Not Null | Usuario comprador.                                            | f111...             |
| total_amount    | DECIMAL(18,2)    | Not Null             | Total pagado en COP.                                          | 90000.00            |
| status          | NVARCHAR(20)     | Not Null             | Estado del pedido: 'Pending', 'Paid', 'Shipped', 'Cancelled'. | Paid                |
| payment_method  | NVARCHAR(50)     | Not Null             | Pasarela usada.                                               | Stripe, PSE         |
| transaction_ref | NVARCHAR(100)    | Nullable             | ID de transacción de la pasarela (Stripe payment intent ID).  | pi_1De...           |
| created_at      | DATETIME2        | Default GETUTCDATE() | Fecha de creación de la orden.                                | 2025-02-20 14:00:00 |

### **Tabla: OrderItems**

_Líneas de detalle de cada orden. Una orden contiene uno o más ítems._

| Campo      | Tipo de Dato     | Restricciones           | Descripción                                         | Ejemplo  |
| :--------- | :--------------- | :---------------------- | :-------------------------------------------------- | :------- |
| id         | UNIQUEIDENTIFIER | PK                      | ID del ítem.                                        | item1... |
| order_id   | UNIQUEIDENTIFIER | FK (Orders), Not Null   | Orden padre.                                        | e999...  |
| product_id | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto comprado.                                  | b123...  |
| quantity   | INT              | Not Null, Check > 0     | Cantidad comprada.                                  | 2        |
| unit_price | DECIMAL(18,2)    | Not Null                | Precio unitario al momento de la compra (snapshot). | 45000.00 |

### **Tabla: Reviews**

_Calificaciones y reseñas de productos por compradores._

| Campo      | Tipo de Dato     | Restricciones           | Descripción                              | Ejemplo              |
| :--------- | :--------------- | :---------------------- | :--------------------------------------- | :------------------- |
| id         | UNIQUEIDENTIFIER | PK                      | ID de la reseña.                         | rev1...              |
| product_id | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto reseñado.                       | b123...              |
| user_id    | UNIQUEIDENTIFIER | FK (Users), Not Null    | Usuario que escribe la reseña.           | f111...              |
| rating     | INT              | Not Null, Check 1-5     | Calificación numérica (1 a 5 estrellas). | 4                    |
| comment    | NVARCHAR(MAX)    | Nullable                | Comentario textual del comprador.        | Excelente calidad... |
| created_at | DATETIME2        | Default GETUTCDATE()    | Fecha de la reseña.                      | 2025-03-01 09:00:00  |

---

# **3. Base de Datos: BioCommerce_Scientific (PostgreSQL)**

## **Contexto: Biodiversity Catalog (Core Científico)**

### **Tabla: Taxonomies**

_Clasificación biológica jerárquica completa (hasta Género)._

| Campo      | Tipo de Dato (Postgres) | Restricciones   | Descripción                     | Ejemplo       |
| :--------- | :---------------------- | :-------------- | :------------------------------ | :------------ |
| id         | SERIAL                  | PK              | ID numérico interno.            | 101           |
| kingdom    | VARCHAR(50)             | Not Null        | Reino.                          | Plantae       |
| phylum     | VARCHAR(50)             | Nullable        | Filo/División.                  | Tracheophyta  |
| class_name | VARCHAR(50)             | Nullable        | Clase taxonómica.               | Magnoliopsida |
| order_name | VARCHAR(50)             | Nullable        | Orden taxonómico.               | Asparagales   |
| family     | VARCHAR(50)             | Index, Not Null | Familia (clave para búsquedas). | Orchidaceae   |
| genus      | VARCHAR(50)             | Not Null        | Género.                         | Cattleya      |

### **Tabla: Species**

_Entidad central del catálogo de biodiversidad._

| Campo               | Tipo de Dato | Restricciones                 | Descripción                                                                                                                     | Ejemplo                                          |
| :------------------ | :----------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------- |
| id                  | UUID         | PK, Default gen_random_uuid() | Identificador único de especie.                                                                                                 | c456...                                          |
| taxonomy_id         | INT          | FK (Taxonomies), Not Null     | Relación taxonómica.                                                                                                            | 101                                              |
| slug                | VARCHAR(200) | UK, Not Null                  | Slug URL-friendly generado del nombre común o científico. Para rutas SEO.                                                       | cattleya-trianae                                 |
| scientific_name     | VARCHAR(150) | UK, Not Null                  | Nombre científico único (binominal).                                                                                            | Cattleya trianae                                 |
| common_name         | VARCHAR(150) | Nullable                      | Nombre vernáculo en la región.                                                                                                  | Flor de Mayo                                     |
| description         | TEXT         | Nullable                      | Descripción morfológica.                                                                                                        | Epífita con pseudobulbos...                      |
| ecological_info     | TEXT         | Nullable                      | Datos de hábitat y ecología (source para RAG).                                                                                  | Bosque de niebla entre 1800-2500m...             |
| altitude_range      | VARCHAR(50)  | Nullable                      | Rango altitudinal típico en msnm. Generado por LLM o registros SIB.                                                             | 1500-2800 msnm                                   |
| traditional_uses    | JSONB        | Nullable                      | Usos etnobotánicos y conocimiento ancestral. Almacena JSON estructurado (ver esquema abajo).                                    | `[{"part":"Hojas","uses":["Medicina"],...}]`     |
| economic_potential  | JSONB        | Nullable                      | Potencial de aprovechamiento económico sostenible. Almacena JSON estructurado (ver esquema abajo).                              | `[{"sector":"Ecoturismo","products":[...],...}]` |
| conservation_status | VARCHAR(30)  | Nullable                      | Estado de conservación (IUCN / Libros Rojos de Colombia).                                                                       | VU                                               |
| legal_status        | BOOLEAN      | Default False                 | Indica si la especie requiere permisos legales especiales (CITES, entidades gubernamentales) para su recolección o explotación. | true                                             |
| is_sensitive        | BOOLEAN      | Default False                 | Si es True, se enmascara la ubicación exacta. (Protección especies amenazadas).                                                 | true                                             |
| thumbnail_url       | VARCHAR(255) | Nullable                      | URL de imagen miniatura para listados y cards. Se genera al subir la primera imagen validada.                                   | https://cdn.example.com/species/c456/thumb.webp  |
| created_at          | TIMESTAMPTZ  | Default NOW()                 | Fecha de creación del registro.                                                                                                 | 2025-01-10 08:00:00+00                           |
| updated_at          | TIMESTAMPTZ  | Nullable                      | Última actualización del registro.                                                                                              | 2025-02-15 12:00:00+00                           |

#### **Esquema JSONB: traditional_uses**

```json
[
    {
        "part": "Hojas",
        "uses": ["Medicina tradicional", "Infusiones"],
        "description": "Se utiliza en infusiones para tratar afecciones respiratorias.",
        "community": "Comunidades campesinas de Caldas"
    }
]
```

#### **Esquema JSONB: economic_potential**

```json
[
    {
        "sector": "Ecoturismo",
        "products": ["Avistamiento de aves", "Fotografía de naturaleza"],
        "description": "Especie emblemática para el turismo ornitológico.",
        "market_value": "Alto|Medio|Bajo|Desconocido",
        "sustainability_level": "Alto|Medio|Bajo"
    }
]
```

### **Tabla: GeographicDistributions** _(GIS)_

_Ubicación geoespacial de avistamientos/distribución de especies. Requiere extensión PostGIS._

| Campo          | Tipo de Dato           | Restricciones                 | Descripción                                                           | Ejemplo                          |
| :------------- | :--------------------- | :---------------------------- | :-------------------------------------------------------------------- | :------------------------------- |
| id             | UUID                   | PK, Default gen_random_uuid() | ID del registro de distribución.                                      | d555...                          |
| species_id     | UUID                   | FK (Species), Not Null        | Especie avistada/registrada.                                          | c456...                          |
| latitude       | FLOAT                  | Not Null                      | Latitud del punto de observación.                                     | 5.0689                           |
| longitude      | FLOAT                  | Not Null                      | Longitud del punto de observación.                                    | -75.5174                         |
| altitude       | FLOAT                  | Nullable                      | Metros sobre el nivel del mar.                                        | 2150                             |
| municipality   | VARCHAR(100)           | Not Null, Index               | Municipio de Caldas.                                                  | Manizales                        |
| ecosystem_type | VARCHAR(100)           | Nullable                      | Tipo de ecosistema en el punto de observación.                        | Bosque de niebla                 |
| location_point | GEOGRAPHY(Point, 4326) | Index (GIST)                  | Punto PostGIS calculado a partir de lat/lon. Para queries espaciales. | SRID=4326;POINT(-75.5174 5.0689) |

---

## **Contexto: Computer Vision & AI (MLOps)**

### **Tabla: SpeciesImages**

_Dataset de imágenes para entrenamiento, validación y galería del catálogo._

| Campo                  | Tipo de Dato | Restricciones                 | Descripción                                                                        | Ejemplo                          |
| :--------------------- | :----------- | :---------------------------- | :--------------------------------------------------------------------------------- | :------------------------------- |
| id                     | UUID         | PK, Default gen_random_uuid() | ID de la imagen.                                                                   | img1...                          |
| species_id             | UUID         | FK (Species), Not Null        | Especie etiquetada (Ground Truth).                                                 | c456...                          |
| uploader_user_id       | UUID         | Index, Not Null               | **Logical FK** a SQL Server (Users). Quién subió la foto.                          | a0ee...                          |
| image_url              | VARCHAR(255) | Not Null                      | URL en Object Storage (S3/Azure Blob).                                             | https://bucket.../img.jpg        |
| metadata               | JSONB        | Nullable                      | Metadatos EXIF (cámara, fecha, ISO, resolución).                                   | {"iso": 100, "model": "Pixel 7"} |
| license_type           | VARCHAR(50)  | Default 'CC-BY'               | Licencia de uso de la imagen.                                                      | CC-BY-NC                         |
| is_validated_by_expert | BOOLEAN      | Default False                 | Indica si un investigador validó la etiqueta de especie. Crucial para fine-tuning. | false                            |
| used_for_training      | BOOLEAN      | Default False                 | Indica si la imagen fue incluida en el dataset de entrenamiento del modelo CNN.    | true                             |

### **Tabla: PredictionLogs**

_Registro de inferencias del modelo CNN para monitoreo y feedback loop._

| Campo                 | Tipo de Dato | Restricciones                 | Descripción                                                            | Ejemplo                                       |
| :-------------------- | :----------- | :---------------------------- | :--------------------------------------------------------------------- | :-------------------------------------------- |
| id                    | UUID         | PK, Default gen_random_uuid() | ID del log de predicción.                                              | log1...                                       |
| user_id               | UUID         | Index, Not Null               | **Logical FK** a SQL Server (Users). Quién solicitó la predicción.     | a0ee...                                       |
| image_input_url       | VARCHAR(255) | Not Null                      | URL de la imagen analizada.                                            | https://.../temp.jpg                          |
| raw_prediction_result | JSONB        | Not Null                      | Salida cruda del modelo (Top-K probabilidades).                        | [{"class": "Cattleya trianae", "prob": 0.92}] |
| confidence_score      | DECIMAL(5,4) | Not Null                      | Confianza de la predicción principal (0.0000 a 1.0000).                | 0.9250                                        |
| predicted_species_id  | UUID         | FK (Species), Nullable        | Especie predicha con mayor confianza.                                  | c456...                                       |
| feedback_correct      | BOOLEAN      | Nullable                      | Feedback del usuario/experto: ¿Acertó el modelo? Para reentrenamiento. | true                                          |
| timestamp             | TIMESTAMPTZ  | Default NOW()                 | Momento de la inferencia.                                              | 2025-02-20 14:35:00+00                        |

### **Tabla: AiModelVersions**

_Versionado de modelos de IA desplegados. Soporte para MLOps y rollback._

| Campo           | Tipo de Dato | Restricciones | Descripción                                            | Ejemplo                |
| :-------------- | :----------- | :------------ | :----------------------------------------------------- | :--------------------- |
| id              | SERIAL       | PK            | ID numérico del modelo.                                | 1                      |
| model_name      | VARCHAR(100) | Not Null      | Arquitectura del modelo.                               | ResNet50               |
| version         | VARCHAR(20)  | UK, Not Null  | Versión semántica del modelo.                          | v1.0.0                 |
| accuracy_metric | DECIMAL(5,4) | Not Null      | Métrica de accuracy en el dataset de validación.       | 0.8750                 |
| deployed_at     | TIMESTAMPTZ  | Not Null      | Fecha de despliegue en producción.                     | 2025-03-01 00:00:00+00 |
| is_active       | BOOLEAN      | Default False | Indica si es la versión activa sirviendo predicciones. | true                   |

---

## **Contexto: GenAI & Business Assistant (PostgreSQL)**

### **Tabla: BusinessPlans**

_Planes de negocio generados por el asistente de IA (GPT-4)._

| Campo                | Tipo de Dato | Restricciones                 | Descripción                                                   | Ejemplo                              |
| :------------------- | :----------- | :---------------------------- | :------------------------------------------------------------ | :----------------------------------- |
| id                   | UUID         | PK, Default gen_random_uuid() | ID del plan.                                                  | plan1...                             |
| entrepreneur_id      | UUID         | Index, Not Null               | **Logical FK** a SQL Server (Users). Emprendedor solicitante. | a0ee...                              |
| project_title        | VARCHAR(200) | Not Null                      | Título del proyecto de biocomercio.                           | Exportación de Vainilla Orgánica     |
| generated_content    | TEXT         | Not Null                      | Contenido completo en Markdown generado por GPT-4.            | # Plan de Negocio...                 |
| market_analysis_data | JSONB        | Nullable                      | Datos estructurados para gráficos del Dashboard.              | {"cagr": "5%", "competitors": [...]} |
| created_at           | TIMESTAMPTZ  | Default NOW()                 | Fecha de generación del plan.                                 | 2025-02-25 10:00:00+00               |

### **Tabla: ChatSessions**

_Sesiones de conversación con el chatbot RAG de asesoría en biocomercio._

| Campo         | Tipo de Dato | Restricciones                 | Descripción                                                      | Ejemplo                             |
| :------------ | :----------- | :---------------------------- | :--------------------------------------------------------------- | :---------------------------------- |
| id            | UUID         | PK, Default gen_random_uuid() | ID de la sesión.                                                 | sess1...                            |
| user_id       | UUID         | Index, Not Null               | **Logical FK** a SQL Server (Users). Usuario que inicia el chat. | a0ee...                             |
| started_at    | TIMESTAMPTZ  | Default NOW()                 | Inicio de la sesión.                                             | 2025-02-20 09:00:00+00              |
| context_topic | VARCHAR(100) | Nullable                      | Tema de contexto para el RAG.                                    | Biocommerce, Taxonomy, Conservation |

### **Tabla: ChatMessages**

_Mensajes individuales dentro de una sesión de chat. Historial del chatbot._

| Campo      | Tipo de Dato | Restricciones                 | Descripción                           | Ejemplo                                              |
| :--------- | :----------- | :---------------------------- | :------------------------------------ | :--------------------------------------------------- |
| id         | UUID         | PK, Default gen_random_uuid() | ID del mensaje.                       | msg1...                                              |
| session_id | UUID         | FK (ChatSessions), Not Null   | Sesión padre.                         | sess1...                                             |
| role       | VARCHAR(20)  | Not Null                      | Rol del emisor: 'user' o 'assistant'. | user                                                 |
| content    | TEXT         | Not Null                      | Contenido del mensaje.                | ¿Qué permisos necesito para comercializar orquídeas? |
| created_at | TIMESTAMPTZ  | Default NOW()                 | Timestamp del mensaje.                | 2025-02-20 09:01:00+00                               |

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
