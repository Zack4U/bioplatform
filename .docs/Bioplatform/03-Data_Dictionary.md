# Diccionario de Datos y Arquitectura de Persistencia

## Proyecto: Plataforma de Biodiversidad y Biocomercio (Caldas)

Este documento detalla la estructura física de datos, tipos, restricciones y la distribución entre los motores de base de datos, alineado con los principios de Clean Architecture y la normativa legal vigente (Decreto 3016, Protocolo de Nagoya).

# **1\. Estrategia de Distribución de Bases de Datos**

Siguiendo los requerimientos del proyecto, se separa la persistencia en dos contextos principales para optimizar el rendimiento y la integridad:

| Base de Datos | Motor | Contextos (Dominios) | Justificación Técnica |
| :---- | :---- | :---- | :---- |
| **BioCommerce\_Transactional** | **SQL Server** | Identity, Marketplace, Transacciones, Legal (Permisos) | Alta integridad referencial, soporte robusto para transacciones financieras (ACID strict), compatibilidad con sistemas empresariales tradicionales. |
| **BioCommerce\_Scientific** | **PostgreSQL** | Taxonomía, Especies, Geolocalización, AI Metadata, RAG Content | Soporte nativo para JSONB (metadatos AI), PostGIS (mapas de distribución) y manejo eficiente de grandes volúmenes de texto científico. |
| **BioCommerce\_Logs** | **MongoDB** | Logs de Auditoría, Historial de Chat (RAG) | (Opcional según PDF, pero recomendado) Escritura rápida, esquema flexible para conversaciones de IA no estructuradas. |

**Nota de Arquitectura:** La comunicación entre dominios de SQL Server y PostgreSQL se realiza a través de **UUIDs** (Logical Foreign Keys). No existe integridad referencial física entre motores; la integridad se garantiza en la Capa de Aplicación (Use Cases).

# **2\. Base de Datos: BioCommerce\_Transactional (SQL Server)**

## **Contexto: Identity & Access Management (IAM)**

### **Tabla: Users**

*Gestión de usuarios y credenciales. Soporte para 2FA.*

| Campo | Tipo de Dato (SQL) | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK, Not Null | Identificador único global del usuario. | a0eebc99-9c0b... |
| email | NVARCHAR(255) | UK, Not Null | Correo electrónico (Username). | researcher@caldas.gov.co |
| password\_hash | NVARCHAR(MAX) | Not Null | Hash de contraseña (Argon2id o BCrypt). | $2a$12$R9h/cO... |
| full\_name | NVARCHAR(150) | Not Null | Nombre legal completo. | Maria Rodriguez |
| phone\_number | NVARCHAR(20) | Nullable | Teléfono para contacto o SMS 2FA. | \+573001234567 |
| is\_verified | BIT | Default 0 | Indica si el email/teléfono ha sido confirmado. | 1 (True) |
| two\_factor\_secret | NVARCHAR(100) | Nullable | Semilla secreta para TOTP (Google Auth). Requisito Sprint 1\. | JBSWY3DPEHPK3... |
| is\_active | BIT | Default 1 | Soft delete. | 1 |
| created\_at | DATETIME2 | Default GETUTCDATE() | Fecha de registro. | 2023-10-27 10:00:00 |

### 

### **Tabla: Roles**

*Roles del sistema (Investigador, Emprendedor, etc.).*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | INT | PK, Identity | ID numérico del rol. | 1 |
| name | NVARCHAR(50) | UK, Not Null | Nombre del rol (En Inglés). | Researcher |
| description | NVARCHAR(200) | Nullable | Descripción funcional. | Can validate species |

### 

## **Contexto: Marketplace & Legal (Biocomercio)**

### **Tabla: Products**

*Productos derivados de la biodiversidad.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID del producto. | b123... |
| entrepreneur\_id | UNIQUEIDENTIFIER | FK (Users) | Usuario vendedor. | a0ee... |
| base\_species\_id | UNIQUEIDENTIFIER | Index, Not Null | **Logical FK** a Postgres. Especie base del producto. | c456... (UUID de la Orquídea) |
| name | NVARCHAR(100) | Not Null | Nombre comercial. | Crema de Orquídea |
| description | NVARCHAR(MAX) | Not Null | Descripción de marketing. | Hidratante natural... |
| price | DECIMAL(18,2) | Not Null | Precio en COP. | 45000.00 |
| stock\_quantity | INT | Not Null | Inventario disponible. | 50 |
| sku | NVARCHAR(50) | UK | Código de referencia único. | CRE-ORQ-001 |

#### 

### **Tabla: AbsPermits (Critical Compliance)**

*Permisos de Acceso a Recursos Genéticos. Cumplimiento Decisión 391/Nagoya.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID del permiso. | d789... |
| entrepreneur\_id | UNIQUEIDENTIFIER | FK (Users) | Titular del permiso. | a0ee... |
| species\_id | UNIQUEIDENTIFIER | Not Null | **Logical FK** a Postgres. Especie autorizada. | c456... |
| resolution\_number | NVARCHAR(100) | UK, Not Null | Número de resolución (ANLA/CAR/MinAmbiente). | Res-1348-2024 |
| emission\_date | DATE | Not Null | Fecha de emisión. | 2024-01-15 |
| expiration\_date | DATE | Not Null | Fecha de vencimiento. | 2029-01-15 |
| granting\_authority | NVARCHAR(100) | Not Null | Entidad que otorga. | Corpocaldas |
| status | NVARCHAR(20) | Not Null | Estado legal ('Active', 'Suspended'). | Active |

#### 

### **Tabla: Orders**

*Cabecera de transacciones de compra.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UNIQUEIDENTIFIER | PK | ID de la orden. | e999... |
| buyer\_id | UNIQUEIDENTIFIER | FK (Users) | Usuario comprador. | f111... |
| total\_amount | DECIMAL(18,2) | Not Null | Total pagado. | 90000.00 |
| status | NVARCHAR(20) | Not Null | Estado del pedido. | Paid |
| payment\_method | NVARCHAR(50) | Not Null | Pasarela usada. | Stripe\_CreditCard |
| transaction\_ref | NVARCHAR(100) | Nullable | ID de transacción de la pasarela (Stripe ID). | pi\_1De... |
| created\_at | DATETIME2 | Not Null | Fecha de creación. | 2024-02-20 14:00:00 |

## 

# **3\. Base de Datos: BioCommerce\_Scientific (PostgreSQL)**

## 

## **Contexto: Biodiversity Catalog (Core Científico)**

#### 

### **Tabla: Taxonomies**

*Clasificación biológica jerárquica.*

| Campo | Tipo de Dato (Postgres) | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | SERIAL | PK | ID numérico interno. | 101 |
| kingdom | VARCHAR(50) | Not Null | Reino. | Plantae |
| phylum | VARCHAR(50) | Nullable | Filo/División. | Tracheophyta |
| family | VARCHAR(50) | Index | Familia (Clave para búsquedas). | Orchidaceae |
| genus | VARCHAR(50) | Not Null | Género. | Cattleya |

#### 

### **Tabla: Species**

*Entidad central del catálogo.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK, Default gen\_random\_uuid() | Identificador único de especie. | c456... |
| taxonomy\_id | INT | FK (Taxonomies) | Relación taxonómica. | 101 |
| scientific\_name | VARCHAR(150) | UK, Not Null | Nombre científico único. | Cattleya trianae |
| common\_name | VARCHAR(150) | Nullable | Nombre vernáculo en la región. | Flor de Mayo |
| description | TEXT | Nullable | Descripción morfológica. | Epífita con pseudobulbos... |
| ecological\_info | TEXT | Nullable | Datos de hábitat (RAG source). | Bosque de niebla... |
| traditional\_uses | TEXT | Nullable | Usos etnobotánicos (Importante para biocomercio). | Ornamental, ceremonial |
| is\_sensitive | BOOLEAN | Default False | Si es True, se oculta ubicación exacta (Protección especies amenazadas). | true |

#### 

### **Tabla: GeographicDistributions (GIS)**

*Ubicación geoespacial de avistamientos.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK | ID del registro. | d555... |
| species\_id | UUID | FK (Species) | Especie avistada. | c456... |
| municipality | VARCHAR(100) | Not Null | Municipio de Caldas. | Manizales |
| location\_point | GEOGRAPHY(Point, 4326\) | Index (GIST) | Coordenadas GPS exactas. | POINT(-75.5 5.0) |
| altitude | FLOAT | Nullable | Metros sobre el nivel del mar. | 2150 |

### 

## 

## **Contexto: Computer Vision & AI (MLOps)**

#### 

### **Tabla: SpeciesImages**

*Dataset de imágenes para entrenamiento y validación.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK | ID de la imagen. | img1... |
| species\_id | UUID | FK (Species) | Especie etiquetada (Ground Truth). | c456... |
| uploader\_user\_id | UUID | Index | **Logical FK** a SQL Server. Quién subió la foto. | a0ee... |
| image\_url | VARCHAR(255) | Not Null | URL en Object Storage (S3/Azure Blob). | https://bucket.../img.jpg |
| metadata | JSONB | Nullable | Metadatos EXIF (Cámara, Fecha, ISO). | {"iso": 100, "model": "Pixel 7"} |
| is\_validated\_by\_expert | BOOLEAN | Default False | **Crucial:** Define si sirve para Fine-tuning. | false |
| license\_type | VARCHAR(50) | Default 'CC-BY' | Licencia de uso de la imagen. | CC-BY-NC |

#### 

### **Tabla: PredictionLogs**

*Registro de inferencias para monitoreo del modelo.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK | ID del log. | log1... |
| image\_input\_url | VARCHAR(255) | Not Null | Imagen analizada. | https://.../temp.jpg |
| raw\_prediction\_result | JSONB | Not Null | Salida cruda del modelo (Top-K). | \[{"class": "Orchid", "prob": 0.92}\] |
| confidence\_score | DECIMAL(5,4) | Not Null | Confianza de la predicción principal (0-1). | 0.9250 |
| feedback\_correct | BOOLEAN | Nullable | Feedback del usuario: ¿Acertó el modelo? | true |

### 

### 

## **Contexto: GenAI & Business (PostgreSQL)**

#### 

### **Tabla: BusinessPlans**

*Planes generados por el asistente de IA.*

| Campo | Tipo de Dato | Restricciones | Descripción | Ejemplo |
| :---- | :---- | :---- | :---- | :---- |
| id | UUID | PK | ID del plan. | plan1... |
| entrepreneur\_id | UUID | Index | **Logical FK** a SQL Server. | a0ee... |
| project\_title | VARCHAR(200) | Not Null | Título del proyecto. | Exportación de Vainilla |
| generated\_content | TEXT | Not Null | Contenido completo en Markdown generado por GPT-4. | \# Plan de Negocio... |
| market\_analysis\_data | JSONB | Nullable | Datos estructurados para gráficos del Dashboard. | {"cagr": "5%", "competitors": \[...\]} |

## 

# **4\. Notas de Implementación**

1. **Manejo de Fechas:** Todas las fechas (created\_at, updated\_at) deben guardarse en **UTC**. La conversión a hora local (Colombia GMT-5) se realiza en el Frontend.  
2. **Imágenes:** Las bases de datos **NO** almacenan archivos binarios (BLOBs) de imágenes, solo las **URLs** apuntando a un servicio de almacenamiento (Azure Blob Storage o AWS S3).  
3. **Auditoría:** Todas las tablas críticas deben incluir columnas created\_by (UUID) y updated\_at (Timestamp) para cumplir con requisitos de trazabilidad.  
4. **Geospatial:** La tabla GeographicDistributions requiere la extensión PostGIS habilitada en PostgreSQL (CREATE EXTENSION postgis;).

