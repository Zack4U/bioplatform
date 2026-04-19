# Diccionario de Datos y Arquitectura de Persistencia

## Proyecto: Plataforma de Biodiversidad y Biocomercio (Caldas)

Este documento detalla la estructura fisica de datos, tipos, restricciones y la distribucion entre los motores de base de datos, alineado con los principios de Clean Architecture y la normativa legal vigente (Decreto 3016, Protocolo de Nagoya, Decision 391).

---

# **1. Estrategia de Distribucion de Bases de Datos**

Siguiendo los requerimientos del proyecto, se separa la persistencia en dos contextos principales para optimizar el rendimiento y la integridad:

| Base de Datos                 | Motor          | Contextos (Dominios)                                                                                      | Justificacion Tecnica                                                                                                                                      |
| :---------------------------- | :------------- | :-------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **BioCommerce_Transactional** | **SQL Server** | Identity (IAM), Marketplace, Transacciones, Legal (Permisos ABS), Direcciones, Favoritos, Notificaciones  | Alta integridad referencial, soporte robusto para transacciones financieras (ACID strict), compatibilidad con sistemas empresariales tradicionales.        |
| **BioCommerce_Scientific**    | **PostgreSQL** | Taxonomia, Especies, Geolocalizacion (PostGIS), Computer Vision (MLOps), GenAI (RAG/Chat, Business Plans) | Soporte nativo para JSONB (metadatos AI), PostGIS (mapas de distribucion), manejo eficiente de grandes volumenes de texto cientifico y logs de inferencia. |

**Nota de Arquitectura:** La comunicacion entre dominios de SQL Server y PostgreSQL se realiza a traves de **UUIDs** (Logical Foreign Keys). No existe integridad referencial fisica entre motores; la integridad se garantiza en la Capa de Aplicacion (Use Cases).

---

# **2. Base de Datos: BioCommerce_Transactional (SQL Server)**

## **Contexto: Identity & Access Management (IAM)**

### **Tabla: Users**

_Gestion de usuarios y credenciales. Soporte para 2FA (TOTP)._

| Campo              | Tipo de Dato (SQL) | Restricciones        | Descripcion                                     | Ejemplo                  |
| :----------------- | :----------------- | :------------------- | :---------------------------------------------- | :----------------------- |
| Id                 | UNIQUEIDENTIFIER   | PK, Not Null         | Identificador unico global del usuario.         | a0eebc99-9c0b...         |
| Email              | NVARCHAR(255)      | UK, Not Null         | Correo electronico (Username).                  | researcher@caldas.gov.co |
| PasswordHash       | NVARCHAR(500)      | Not Null             | Hash de contrasena (PBKDF2).                    | $2a$12$R9h/cO...         |
| Salt               | NVARCHAR(100)      | Not Null             | Semilla aleatoria unica usada para hashing.     | a3b4c5...                |
| FullName           | NVARCHAR(150)      | Not Null             | Nombre legal completo.                          | Maria Rodriguez          |
| PhoneNumber        | NVARCHAR(20)       | Nullable, UK (filtered) | Telefono para contacto o SMS 2FA.            | +573001234567            |
| IsVerified         | BIT                | Default 0            | Indica si el email/telefono ha sido confirmado. | 1 (True)                 |
| LastLogin          | DATETIME2          | Nullable             | Ultimo inicio de sesion exitoso.                | 2025-02-20 14:30:00      |
| IsActive           | BIT                | Default 1            | Soft delete.                                    | 1                        |
| CreatedAt          | DATETIME2          | Default GETUTCDATE() | Fecha de registro.                              | 2025-01-15 10:00:00      |
| UpdatedAt          | DATETIME2          | Nullable             | Ultima actualizacion del perfil.                | 2025-02-20 14:30:00      |
| TwoFactorEnabled   | BIT                | Default 0            | Indica si 2FA esta activo.                      | 1                        |
| TwoFactorSecret    | NVARCHAR(100)      | Nullable             | Semilla secreta para TOTP (Google Auth).        | JBSWY3DPEHPK3...         |

### **Tabla: Roles**

_Roles del sistema. Soporta RBAC con 6 roles base._

| Campo       | Tipo de Dato  | Restricciones | Descripcion                                                                            | Ejemplo                                |
| :---------- | :------------ | :------------ | :------------------------------------------------------------------------------------- | :------------------------------------- |
| Id          | UNIQUEIDENTIFIER | PK         | ID unico del rol.                                                                      | 11111111-1111-...                      |
| Name        | NVARCHAR(100) | UK, Not Null  | Nombre del rol. Valores: ADMIN, RESEARCHER, ENTREPRENEUR, COMMUNITY, BUYER, AUTHORITY. | RESEARCHER                             |
| Description | NVARCHAR(2000)| Nullable      | Descripcion funcional del rol.                                                         | Can validate species and upload images |
| CreatedAt   | DATETIME2     | Default       | Fecha de creacion.                                                                     | 2025-01-01 00:00:00                    |
| UpdatedAt   | DATETIME2     | Nullable      | Ultima actualizacion.                                                                  | 2025-02-20 14:30:00                    |

### **Tabla: UserRoles**

_Tabla de union muchos-a-muchos entre Users y Roles. Un usuario puede tener multiples roles._

| Campo      | Tipo de Dato     | Restricciones              | Descripcion          | Ejemplo          |
| :--------- | :--------------- | :------------------------- | :------------------- | :--------------- |
| UserId     | UNIQUEIDENTIFIER | PK (compuesta), FK (Users) | ID del usuario.      | a0eebc99-9c0b... |
| RoleId     | UNIQUEIDENTIFIER | PK (compuesta), FK (Roles) | ID del rol asignado. | 11111111-1111... |
| AssignedAt | DATETIME2        | Default                    | Fecha de asignacion. | 2025-01-15       |

### **Tabla: RefreshTokens**

_Tokens de refresco para renovar JWTs sin re-autenticacion._

| Campo           | Tipo de Dato     | Restricciones        | Descripcion                            | Ejemplo          |
| :-------------- | :--------------- | :------------------- | :------------------------------------- | :--------------- |
| Id              | UNIQUEIDENTIFIER | PK                   | ID del token.                          | tok1...          |
| UserId          | UNIQUEIDENTIFIER | FK (Users), Not Null | Usuario propietario.                   | a0ee...          |
| Token           | NVARCHAR(500)    | Not Null, Index      | Valor del token.                       | eyJhbGc...       |
| ExpiresAt       | DATETIME2        | Not Null             | Fecha de expiracion.                   | 2025-03-20       |
| CreatedAt       | DATETIME2        | Not Null             | Fecha de creacion.                     | 2025-02-20       |
| RevokedAt       | DATETIME2        | Nullable             | Fecha de revocacion.                   | null             |
| ReplacedByToken | NVARCHAR(MAX)    | Nullable             | Token que reemplazo a este.            | eyJhbGc...       |

---

## **Contexto: Marketplace**

### **Tabla: ProductCategories**

_Categorias de productos del marketplace._

| Campo | Tipo de Dato  | Restricciones | Descripcion                                                             | Ejemplo             |
| :---- | :------------ | :------------ | :---------------------------------------------------------------------- | :------------------ |
| Id    | INT           | PK, Identity  | ID numerico de la categoria.                                            | 1                   |
| Name  | NVARCHAR(450) | UK, Not Null  | Nombre de la categoria. Ej: Artesania, Ingrediente Natural, Ecoturismo. | Ingrediente Natural |

### **Tabla: Products**

_Productos derivados de la biodiversidad, listados en el marketplace._

| Campo           | Tipo de Dato     | Restricciones                    | Descripcion                                                                                      | Ejemplo                                          |
| :-------------- | :--------------- | :------------------------------- | :----------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| Id              | UNIQUEIDENTIFIER | PK                               | ID del producto.                                                                                 | b123...                                          |
| Slug            | NVARCHAR(450)    | UK, Not Null                     | Slug URL-friendly para rutas SEO del producto.                                                   | crema-de-orquidea                                |
| EntrepreneurId  | UNIQUEIDENTIFIER | FK (Users), Not Null, Index      | Usuario vendedor.                                                                                | a0ee...                                          |
| BaseSpeciesId   | UNIQUEIDENTIFIER | Index, Not Null                  | **Logical FK** a PostgreSQL (Species). Especie base del producto. Critico para trazabilidad ABS. | c456...                                          |
| CategoryId      | INT              | FK (ProductCategories), Nullable | Categoria del producto.                                                                          | 1                                                |
| Name            | NVARCHAR(MAX)    | Not Null                         | Nombre comercial.                                                                                | Crema de Orquidea                                |
| Description     | NVARCHAR(MAX)    | Not Null                         | Descripcion de marketing.                                                                        | Hidratante natural...                            |
| Price           | DECIMAL(18,2)    | Not Null                         | Precio unitario en COP.                                                                          | 45000.00                                         |
| StockQuantity   | INT              | Not Null                         | Inventario disponible.                                                                           | 50                                               |
| Sku             | NVARCHAR(MAX)    | Nullable                         | Codigo de referencia unico (SKU).                                                                | CRE-ORQ-001                                      |
| IsActive        | BIT              | Default 1                        | Indica si el producto esta visible en el marketplace.                                            | 1                                                |
| ThumbnailUrl    | NVARCHAR(MAX)    | Nullable                         | URL de imagen miniatura para listados del marketplace.                                           | https://cdn.example.com/products/b123/thumb.webp |
| CreatedAt       | DATETIME2        | Default GETUTCDATE()             | Fecha de creacion.                                                                               | 2025-01-20 08:00:00                              |
| UpdatedAt       | DATETIME2        | Nullable                         | Ultima actualizacion.                                                                            | 2025-02-20 14:30:00                              |

### **Tabla: ProductImages**

_Galeria de imagenes para productos del marketplace._

| Campo        | Tipo de Dato     | Restricciones           | Descripcion                         | Ejemplo                                          |
| :----------- | :--------------- | :---------------------- | :---------------------------------- | :----------------------------------------------- |
| Id           | UNIQUEIDENTIFIER | PK                      | ID de la imagen.                    | img1...                                          |
| ProductId    | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto al que pertenece.          | b123...                                          |
| ImageUrl     | NVARCHAR(500)    | Not Null                | URL de la imagen en almacenamiento. | https://cdn.../product-img.webp                  |
| AltText      | NVARCHAR(200)    | Nullable                | Texto alternativo para accesibilidad. | Crema de orquidea empaque frontal              |
| DisplayOrder | INT              | Default 0               | Orden de visualizacion en galeria.  | 0                                                |
| IsPrimary    | BIT              | Default 0               | Indica si es la imagen principal.   | 1                                                |
| CreatedAt    | DATETIME2        | Default GETUTCDATE()    | Fecha de carga.                     | 2025-01-20 08:00:00                              |

### **Tabla: ProductReviews**

_Calificaciones y resenas de productos por compradores._

| Campo      | Tipo de Dato     | Restricciones           | Descripcion                              | Ejemplo              |
| :--------- | :--------------- | :---------------------- | :--------------------------------------- | :------------------- |
| Id         | UNIQUEIDENTIFIER | PK                      | ID de la resena.                         | rev1...              |
| ProductId  | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto resenado.                       | b123...              |
| UserId     | UNIQUEIDENTIFIER | FK (Users), Not Null    | Usuario que escribe la resena.           | f111...              |
| Rating     | INT              | Not Null                | Calificacion numerica (1 a 5 estrellas). | 4                    |
| Title      | NVARCHAR(MAX)    | Nullable                | Titulo de la resena.                     | Excelente producto   |
| Comment    | NVARCHAR(MAX)    | Nullable                | Comentario textual del comprador.        | Excelente calidad... |
| CreatedAt  | DATETIME2        | Default GETUTCDATE()    | Fecha de la resena.                      | 2025-03-01 09:00:00  |

### **Tabla: Certifications** _(Unified)_

_Certificaciones unificadas para productos. Cubre certificaciones de sostenibilidad, organicas, calidad, y cumplimiento ABS. Documentos almacenados por URL._

| Campo              | Tipo de Dato     | Restricciones           | Descripcion                                                   | Ejemplo                    |
| :----------------- | :--------------- | :---------------------- | :------------------------------------------------------------ | :------------------------- |
| Id                 | UNIQUEIDENTIFIER | PK                      | ID de la certificacion.                                       | cert1...                   |
| ProductId          | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto certificado.                                         | b123...                    |
| Name               | NVARCHAR(150)    | Not Null                | Nombre de la certificacion.                                   | Negocios Verdes            |
| CertificationType  | NVARCHAR(50)     | Not Null, Index         | Tipo: Sustainability, Organic, Quality, FairTrade, ABS.       | Sustainability             |
| IssuingBody        | NVARCHAR(150)    | Not Null                | Entidad emisora.                                              | MinAmbiente                |
| CertificateNumber  | NVARCHAR(100)    | Nullable                | Numero de certificado.                                        | NV-2025-001                |
| IssuedAt           | DATETIME2        | Not Null                | Fecha de emision.                                             | 2025-01-15                 |
| ExpiresAt          | DATETIME2        | Nullable                | Fecha de vencimiento.                                         | 2026-12-31                 |
| Status             | NVARCHAR(20)     | Not Null, Default 'Active' | Estado: Active, Expired, Suspended, Revoked.               | Active                     |
| DocumentUrl        | NVARCHAR(500)    | Nullable                | URL del documento de certificacion.                           | https://cdn.../cert.pdf    |
| LogoUrl            | NVARCHAR(500)    | Nullable                | URL del logo de la certificacion.                             | https://cdn.../nv-logo.png |
| VerificationCode   | NVARCHAR(100)    | Nullable                | Codigo verificable de la certificacion.                       | NV-2025-00421              |
| CreatedAt          | DATETIME2        | Default GETUTCDATE()    | Fecha de registro.                                            | 2025-01-20 08:00:00        |
| UpdatedAt          | DATETIME2        | Nullable                | Ultima actualizacion.                                         | 2025-02-20 14:30:00        |

---

## **Contexto: Legal & Compliance**

### **Tabla: AbsPermits** _(Critical Compliance)_

_Permisos de Acceso a Recursos Geneticos. Cumplimiento Decision 391 / Protocolo de Nagoya._

| Campo              | Tipo de Dato     | Restricciones        | Descripcion                                                | Ejemplo                    |
| :----------------- | :--------------- | :------------------- | :--------------------------------------------------------- | :------------------------- |
| Id                 | UNIQUEIDENTIFIER | PK                   | ID del permiso.                                            | d789...                    |
| EntrepreneurId     | UNIQUEIDENTIFIER | FK (Users), Not Null | Titular del permiso.                                       | a0ee...                    |
| SpeciesId          | UNIQUEIDENTIFIER | Not Null, Index      | **Logical FK** a PostgreSQL (Species). Especie autorizada. | c456...                    |
| ResolutionNumber   | NVARCHAR(450)    | UK, Not Null         | Numero de resolucion (ANLA/CAR/MinAmbiente).               | Res-1348-2024              |
| EmissionDate       | DATETIME2        | Not Null             | Fecha de emision del permiso.                              | 2024-01-15                 |
| ExpirationDate     | DATETIME2        | Not Null             | Fecha de vencimiento.                                      | 2029-01-15                 |
| GrantingAuthority  | NVARCHAR(MAX)    | Not Null             | Entidad que otorga el permiso.                             | Corpocaldas                |
| Status             | NVARCHAR(MAX)    | Not Null             | Estado legal: 'Active', 'Expired', 'Suspended'.            | Active                     |
| LegalFramework     | NVARCHAR(MAX)    | Nullable             | Marco normativo aplicable.                                 | Decreto 3016, Decision 391 |

### **Tabla: TraceabilityBatches**

_Lotes de trazabilidad de origen para productos. Cumple requisito de trazabilidad desde origen._

| Campo              | Tipo de Dato     | Restricciones           | Descripcion                                  | Ejemplo                        |
| :----------------- | :--------------- | :---------------------- | :------------------------------------------- | :----------------------------- |
| Id                 | UNIQUEIDENTIFIER | PK                      | ID del lote.                                 | batch1...                      |
| ProductId          | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto trazado.                            | b123...                        |
| BatchCode          | NVARCHAR(450)    | UK, Not Null            | Codigo unico del lote.                       | LOT-2025-001                   |
| HarvestDate        | DATETIME2        | Not Null                | Fecha de cosecha/recoleccion.                | 2025-03-10                     |
| OriginLocation     | NVARCHAR(MAX)    | Not Null                | Ubicacion de origen (municipio, vereda).     | Vereda La Esperanza, Manizales |
| ProcessingDetails  | NVARCHAR(MAX)    | Nullable                | Descripcion del procesamiento.               | Secado al sol, 5 dias...       |
| BlockchainHash     | NVARCHAR(MAX)    | Nullable                | Hash de integridad en blockchain (opcional). | 0x4a3b...                      |

---

## **Contexto: Orders & Transactions**

### **Tabla: Orders**

_Cabecera de transacciones de compra._

| Campo              | Tipo de Dato     | Restricciones            | Descripcion                                                   | Ejemplo             |
| :----------------- | :--------------- | :----------------------- | :------------------------------------------------------------ | :------------------ |
| Id                 | UNIQUEIDENTIFIER | PK                       | ID de la orden.                                               | e999...             |
| OrderNumber        | NVARCHAR(450)    | UK, Not Null             | Referencia legible de la orden.                               | ORD-2025-001        |
| BuyerId            | UNIQUEIDENTIFIER | FK (Users), Not Null     | Usuario comprador.                                            | f111...             |
| ShippingAddressId  | UNIQUEIDENTIFIER | FK (Addresses), Nullable | Direccion de envio utilizada.                                 | addr1...            |
| BillingAddressId   | UNIQUEIDENTIFIER | FK (Addresses), Nullable | Direccion de facturacion.                                     | addr2...            |
| TotalAmount        | DECIMAL(18,2)    | Not Null                 | Total pagado en COP.                                          | 90000.00            |
| SubtotalAmount     | DECIMAL(18,2)    | Not Null                 | Subtotal antes de impuestos/descuentos.                       | 80000.00            |
| TaxAmount          | DECIMAL(18,2)    | Default 0                | Impuestos aplicados.                                          | 10000.00            |
| ShippingAmount     | DECIMAL(18,2)    | Default 0                | Costo de envio.                                               | 0.00                |
| DiscountAmount     | DECIMAL(18,2)    | Default 0                | Descuentos aplicados.                                         | 0.00                |
| Status             | NVARCHAR(450)    | Not Null, Index          | Estado del pedido: 'Pending', 'Paid', 'Shipped', 'Cancelled'. | Paid                |
| PaymentMethod      | NVARCHAR(MAX)    | Not Null                 | Pasarela usada.                                               | Stripe, PSE         |
| TransactionRef     | NVARCHAR(MAX)    | Nullable                 | ID de transaccion de la pasarela (Stripe payment intent ID).  | pi_1De...           |
| CreatedAt          | DATETIME2        | Default GETUTCDATE()     | Fecha de creacion de la orden.                                | 2025-02-20 14:00:00 |
| UpdatedAt          | DATETIME2        | Nullable                 | Ultima actualizacion.                                         | 2025-02-20 14:30:00 |

### **Tabla: OrderItems**

_Lineas de detalle de cada orden. Una orden contiene uno o mas items._

| Campo      | Tipo de Dato     | Restricciones           | Descripcion                                         | Ejemplo  |
| :--------- | :--------------- | :---------------------- | :-------------------------------------------------- | :------- |
| Id         | UNIQUEIDENTIFIER | PK                      | ID del item.                                        | item1... |
| OrderId    | UNIQUEIDENTIFIER | FK (Orders), Not Null   | Orden padre.                                        | e999...  |
| ProductId  | UNIQUEIDENTIFIER | FK (Products), Not Null | Producto comprado.                                  | b123...  |
| Quantity   | INT              | Not Null                | Cantidad comprada.                                  | 2        |
| UnitPrice  | DECIMAL(18,2)    | Not Null                | Precio unitario al momento de la compra (snapshot). | 45000.00 |
| TotalPrice | DECIMAL(18,2)    | Not Null                | Precio total (Quantity x UnitPrice).                | 90000.00 |

---

## **Contexto: User Features**

### **Tabla: Addresses**

_Direcciones fisicas de usuarios para envio y facturacion._

| Campo         | Tipo de Dato     | Restricciones           | Descripcion                          | Ejemplo                  |
| :------------ | :--------------- | :---------------------- | :----------------------------------- | :----------------------- |
| Id            | UNIQUEIDENTIFIER | PK                      | ID de la direccion.                  | addr1...                 |
| UserId        | UNIQUEIDENTIFIER | FK (Users), Not Null    | Usuario propietario.                 | a0ee...                  |
| AddressType   | NVARCHAR(20)     | Not Null                | Tipo: 'Shipping' o 'Billing'.        | Shipping                 |
| RecipientName | NVARCHAR(150)    | Not Null                | Nombre del destinatario.             | Maria Rodriguez          |
| StreetLine1   | NVARCHAR(200)    | Not Null                | Direccion linea 1.                   | Cra 23 # 65-12           |
| StreetLine2   | NVARCHAR(200)    | Nullable                | Direccion linea 2.                   | Apto 301                 |
| City          | NVARCHAR(100)    | Not Null                | Ciudad.                              | Manizales                |
| Department    | NVARCHAR(100)    | Not Null                | Departamento colombiano.             | Caldas                   |
| PostalCode    | NVARCHAR(20)     | Not Null                | Codigo postal.                       | 170001                   |
| Country       | NVARCHAR(10)     | Not Null, Default 'CO'  | Codigo ISO de pais.                  | CO                       |
| PhoneNumber   | NVARCHAR(20)     | Nullable                | Telefono de contacto.                | +573001234567            |
| IsDefault     | BIT              | Default 0               | Indica si es la direccion por defecto. | 1                      |
| CreatedAt     | DATETIME2        | Default GETUTCDATE()    | Fecha de creacion.                   | 2025-01-15 10:00:00      |
| UpdatedAt     | DATETIME2        | Nullable                | Ultima actualizacion.                | 2025-02-20 14:30:00      |

### **Tabla: Favorites**

_Favoritos/wishlist de usuarios. Soporta como objetivo Productos y Especies._

| Campo      | Tipo de Dato     | Restricciones                    | Descripcion                                         | Ejemplo          |
| :--------- | :--------------- | :------------------------------- | :-------------------------------------------------- | :--------------- |
| Id         | UNIQUEIDENTIFIER | PK                               | ID del favorito.                                    | fav1...          |
| UserId     | UNIQUEIDENTIFIER | FK (Users), Not Null             | Usuario.                                            | a0ee...          |
| TargetType | NVARCHAR(20)     | Not Null                         | Tipo: 'Product' o 'Species'.                        | Product          |
| TargetId   | UNIQUEIDENTIFIER | Not Null                         | ID del producto o especie (Logical FK si Species).  | b123...          |
| CreatedAt  | DATETIME2        | Default GETUTCDATE()             | Fecha de marcado.                                   | 2025-02-20       |

**Unique Index:** `(UserId, TargetType, TargetId)` — un usuario no puede duplicar un favorito.

### **Tabla: Notifications**

_Notificaciones in-app para actualizaciones de ordenes, resenas, permisos y alertas del sistema._

| Campo            | Tipo de Dato     | Restricciones           | Descripcion                                         | Ejemplo                  |
| :--------------- | :--------------- | :---------------------- | :-------------------------------------------------- | :----------------------- |
| Id               | UNIQUEIDENTIFIER | PK                      | ID de la notificacion.                              | notif1...                |
| UserId           | UNIQUEIDENTIFIER | FK (Users), Not Null    | Usuario destinatario.                               | a0ee...                  |
| Title            | NVARCHAR(200)    | Not Null                | Titulo de la notificacion.                          | Pedido enviado           |
| Message          | NVARCHAR(2000)   | Not Null                | Contenido del mensaje.                              | Tu pedido ORD-001 fue... |
| NotificationType | NVARCHAR(50)     | Not Null                | Tipo: OrderUpdate, ReviewReply, PermitExpiry, System. | OrderUpdate            |
| ReferenceType    | NVARCHAR(50)     | Nullable                | Tipo de entidad referenciada.                       | Order                    |
| ReferenceId      | UNIQUEIDENTIFIER | Nullable                | ID de la entidad referenciada.                      | e999...                  |
| IsRead           | BIT              | Default 0, Index        | Indica si fue leida.                                | 0                        |
| CreatedAt        | DATETIME2        | Default GETUTCDATE()    | Fecha de creacion.                                  | 2025-02-20 14:00:00      |
| ReadAt           | DATETIME2        | Nullable                | Fecha de lectura.                                   | 2025-02-20 14:05:00      |

---

# **3. Base de Datos: BioCommerce_Scientific (PostgreSQL)**

> **Convencion de nombres:** Todas las tablas y columnas en PostgreSQL usan **snake_case**.

## **Contexto: Biodiversity Catalog (Core Cientifico)**

### **Tabla: taxonomy**

_Clasificacion biologica jerarquica completa (hasta Genero)._

| Campo      | Tipo de Dato (Postgres) | Restricciones   | Descripcion                     | Ejemplo                |
| :--------- | :---------------------- | :-------------- | :------------------------------ | :--------------------- |
| id         | SERIAL                  | PK              | ID numerico interno.            | 101                    |
| kingdom    | VARCHAR(50)             | Nullable        | Reino.                          | Plantae                |
| phylum     | VARCHAR(50)             | Nullable        | Filo/Division.                  | Tracheophyta           |
| class_name | VARCHAR(50)             | Nullable        | Clase taxonomica.               | Magnoliopsida          |
| order_name | VARCHAR(50)             | Nullable        | Orden taxonomico.               | Asparagales            |
| family     | VARCHAR(50)             | Index, Nullable | Familia (clave para busquedas). | Orchidaceae            |
| genus      | VARCHAR(50)             | Nullable        | Genero.                         | Cattleya               |

### **Tabla: species**

_Entidad central del catalogo de biodiversidad._

| Campo               | Tipo de Dato | Restricciones                 | Descripcion                                                                                                                     | Ejemplo                                          |
| :------------------ | :----------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------- |
| id                  | UUID         | PK, Default gen_random_uuid() | Identificador unico de especie.                                                                                                 | c456...                                          |
| taxonomy_id         | INT          | FK (taxonomy), Nullable       | Relacion taxonomica.                                                                                                            | 101                                              |
| slug                | VARCHAR(150) | UK, Not Null                  | Slug URL-friendly generado del nombre comun o cientifico.                                                                       | cattleya-trianae                                 |
| thumbnail_url       | VARCHAR(500) | Nullable                      | URL de imagen miniatura.                                                                                                        | https://cdn.example.com/species/c456/thumb.webp  |
| scientific_name     | VARCHAR(255) | UK, Not Null                  | Nombre cientifico unico (binominal).                                                                                            | Cattleya trianae                                 |
| common_name         | VARCHAR(255) | Nullable                      | Nombre vernaculo en la region.                                                                                                  | Flor de Mayo                                     |
| description         | TEXT         | Nullable                      | Descripcion morfologica.                                                                                                        | Epifita con pseudobulbos...                      |
| ecological_info     | TEXT         | Nullable                      | Datos de habitat y ecologia.                                                                                                    | Bosque de niebla entre 1800-2500m...             |
| altitude_range      | VARCHAR(100) | Nullable                      | Rango altitudinal tipico en msnm.                                                                                               | 1500-2800 msnm                                   |
| traditional_uses    | JSONB        | Nullable                      | Usos etnobotanicos y conocimiento ancestral.                                                                                    | `[{"part":"Hojas","uses":["Medicina"],...}]`     |
| economic_potential  | JSONB        | Nullable                      | Potencial de aprovechamiento economico sostenible.                                                                              | `[{"sector":"Ecoturismo","products":[...],...}]` |
| conservation_status | VARCHAR(100) | Nullable                      | Estado de conservacion (IUCN / Libros Rojos de Colombia).                                                                       | VU                                               |
| legal_status        | BOOLEAN      | Default False                 | Indica si la especie requiere permisos legales especiales.                                                                      | true                                             |
| is_sensitive        | BOOLEAN      | Default False                 | Si es True, se enmascara la ubicacion exacta.                                                                                   | true                                             |
| created_at          | TIMESTAMPTZ  | Default NOW()                 | Fecha de creacion del registro.                                                                                                 | 2025-01-10 08:00:00+00                           |
| updated_at          | TIMESTAMPTZ  | Nullable                      | Ultima actualizacion del registro.                                                                                              | 2025-02-15 12:00:00+00                           |

### **Tabla: geographic_distribution**

_Distribucion geografica de especies con soporte PostGIS._

| Campo            | Tipo de Dato           | Restricciones                 | Descripcion                          | Ejemplo                          |
| :--------------- | :--------------------- | :---------------------------- | :----------------------------------- | :------------------------------- |
| id               | UUID                   | PK, Default gen_random_uuid() | ID del registro de distribucion.     | d555...                          |
| species_id       | UUID                   | FK (species), Not Null        | Especie avistada/registrada.         | c456...                          |
| latitude         | DOUBLE PRECISION       | Not Null                      | Latitud.                             | 5.0689                           |
| longitude        | DOUBLE PRECISION       | Not Null                      | Longitud.                            | -75.5174                         |
| altitude         | DOUBLE PRECISION       | Nullable                      | Metros sobre el nivel del mar.       | 2150                             |
| municipality     | VARCHAR(100)           | Nullable                      | Municipio de Caldas.                 | Manizales                        |
| ecosystem_type   | VARCHAR(100)           | Nullable                      | Tipo de ecosistema.                  | Bosque de Niebla                 |
| location_point   | GEOMETRY(Point, 4326)  | Nullable                      | Punto PostGIS para geolocalizacion.  | SRID=4326;POINT(-75.5174 5.0689) |

### **Tabla: species_images**

_Dataset de imagenes para entrenamiento, validacion y galeria del catalogo._

| Campo                  | Tipo de Dato | Restricciones                 | Descripcion                                                                        | Ejemplo                          |
| :--------------------- | :----------- | :---------------------------- | :--------------------------------------------------------------------------------- | :------------------------------- |
| id                     | UUID         | PK, Default gen_random_uuid() | ID de la imagen.                                                                   | img1...                          |
| species_id             | UUID         | FK (species), Not Null, Index | Especie etiquetada (Ground Truth).                                                 | c456...                          |
| uploader_user_id       | UUID         | Nullable                      | **Logical FK** a SQL Server (Users). Quien subio la foto.                          | a0ee...                          |
| image_url              | VARCHAR(500) | Not Null                      | URL en Object Storage.                                                             | https://bucket.../img.jpg        |
| thumbnail_url          | VARCHAR(500) | Nullable                      | URL de miniatura.                                                                  | https://bucket.../thumb.jpg      |
| metadata               | JSONB        | Nullable                      | Metadatos EXIF.                                                                    | {"iso": 100, "model": "Pixel 7"} |
| is_primary             | BOOLEAN      | Default False                 | Si es la imagen principal de la especie.                                           | false                            |
| is_validated_by_expert | BOOLEAN      | Default False, Index          | Indica si un investigador valido la etiqueta.                                      | false                            |
| validated_by_user_id   | UUID         | Nullable                      | **Logical FK** a SQL Server (Users). Investigador que valido.                      | b0ee...                          |
| validation_date        | TIMESTAMPTZ  | Nullable                      | Fecha de validacion.                                                               | 2025-02-20 14:35:00+00           |
| license_type           | VARCHAR(50)  | Default 'CC-BY'               | Licencia de uso de la imagen.                                                      | CC-BY-NC                         |
| created_at             | TIMESTAMPTZ  | Default NOW()                 | Fecha de carga.                                                                    | 2025-01-16 10:00:00+00           |

---

## **Contexto: Computer Vision & AI (MLOps)**

### **Tabla: prediction_logs**

_Registro de inferencias del modelo CNN para monitoreo y feedback loop._

| Campo                      | Tipo de Dato  | Restricciones                 | Descripcion                                                            | Ejemplo                                       |
| :------------------------- | :------------ | :---------------------------- | :--------------------------------------------------------------------- | :--------------------------------------------- |
| id                         | UUID          | PK, Default gen_random_uuid() | ID del log de prediccion.                                              | log1...                                       |
| user_id                    | UUID          | Index, Nullable               | **Logical FK** a SQL Server (Users). Quien solicito la prediccion.     | a0ee...                                       |
| image_input_url            | VARCHAR(500)  | Not Null                      | URL de la imagen analizada.                                            | https://.../temp.jpg                          |
| raw_prediction_result      | JSONB         | Not Null                      | Salida cruda del modelo (Top-K probabilidades).                        | [{"class": "Cattleya trianae", "prob": 0.92}] |
| top_prediction_species_id  | UUID          | Nullable                      | Especie predicha con mayor confianza.                                  | c456...                                       |
| confidence_score           | NUMERIC(5,4)  | Not Null                      | Confianza de la prediccion principal (0.0000 a 1.0000).                | 0.9250                                        |
| feedback_correct           | BOOLEAN       | Nullable                      | Feedback del usuario/experto: Acerto el modelo?                        | true                                          |
| feedback_actual_species_id | UUID          | Nullable                      | ID de especie real si el modelo fallo.                                 | d789...                                       |
| processing_time_ms         | INT           | Nullable                      | Tiempo de procesamiento en milisegundos.                               | 450                                           |
| model_version              | VARCHAR(50)   | Nullable                      | Version del modelo usada.                                              | v1.0.0                                        |
| created_at                 | TIMESTAMPTZ   | Default NOW()                 | Momento de la inferencia.                                              | 2025-02-20 14:35:00+00                        |

### **Tabla: ai_model_versions**

_Versionado de modelos de IA desplegados. Soporte para MLOps y rollback._

| Campo           | Tipo de Dato  | Restricciones | Descripcion                                            | Ejemplo                |
| :-------------- | :------------ | :------------ | :----------------------------------------------------- | :--------------------- |
| id              | SERIAL        | PK            | ID numerico del modelo.                                | 1                      |
| model_name      | VARCHAR(100)  | Not Null      | Arquitectura del modelo.                               | ResNet50               |
| version         | VARCHAR(20)   | UK, Not Null  | Version semantica del modelo.                          | v1.0.0                 |
| accuracy_metric | NUMERIC(5,4)  | Not Null      | Metrica de accuracy en el dataset de validacion.       | 0.8750                 |
| deployed_at     | TIMESTAMPTZ   | Not Null      | Fecha de despliegue en produccion.                     | 2025-03-01 00:00:00+00 |
| is_active       | BOOLEAN       | Default False | Indica si es la version activa sirviendo predicciones. | true                   |
| notes           | TEXT          | Nullable      | Notas sobre la version.                                | Initial release        |
| created_at      | TIMESTAMPTZ   | Default NOW() | Fecha de registro.                                     | 2025-03-01 00:00:00+00 |

---

## **Contexto: GenAI & Business Assistant (PostgreSQL)**

### **Tabla: business_plans**

_Planes de negocio generados por el asistente de IA (GPT-4)._

| Campo                 | Tipo de Dato | Restricciones                 | Descripcion                                                   | Ejemplo                              |
| :-------------------- | :----------- | :---------------------------- | :------------------------------------------------------------ | :----------------------------------- |
| id                    | UUID         | PK, Default gen_random_uuid() | ID del plan.                                                  | plan1...                             |
| entrepreneur_id       | UUID         | Index, Not Null               | **Logical FK** a SQL Server (Users). Emprendedor solicitante. | a0ee...                              |
| project_title         | VARCHAR(200) | Not Null                      | Titulo del proyecto de biocomercio.                           | Exportacion de Vainilla Organica     |
| species_ids           | UUID[]       | Nullable                      | Arreglo de IDs de especies involucradas.                      | {c456..., d789...}                   |
| generated_content     | TEXT         | Not Null                      | Contenido completo en Markdown generado por IA.               | # Plan de Negocio...                 |
| market_analysis_data  | JSONB        | Nullable                      | Datos estructurados para graficos del Dashboard.              | {"cagr": "5%", "competitors": [...]} |
| financial_projections | JSONB        | Nullable                      | Proyecciones financieras.                                     | {"roi": "15%", "payback": "2 years"} |
| generation_prompt     | TEXT         | Nullable                      | Prompt utilizado para la generacion.                          | Genera un plan para...               |
| model_used            | VARCHAR(50)  | Nullable                      | Modelo de IA utilizado.                                       | gpt-4-turbo                          |
| status                | VARCHAR(20)  | Default 'draft'               | Estado del plan.                                              | draft                                |
| created_at            | TIMESTAMPTZ  | Default NOW()                 | Fecha de generacion del plan.                                 | 2025-02-25 10:00:00+00               |
| updated_at            | TIMESTAMPTZ  | Default NOW()                 | Fecha de ultima actualizacion.                                | 2025-02-25 10:00:00+00               |

### **Tabla: rag_documents**

_Documentos indexados para RAG (Retrieval-Augmented Generation). Cada chunk tiene un embedding en ChromaDB._

| Campo        | Tipo de Dato | Restricciones                 | Descripcion                                           | Ejemplo                    |
| :----------- | :----------- | :---------------------------- | :---------------------------------------------------- | :------------------------- |
| id           | UUID         | PK, Default gen_random_uuid() | ID del documento/chunk.                               | doc1...                    |
| title        | VARCHAR(200) | Not Null                      | Titulo del documento fuente.                          | Cattleya trianae - Ficha   |
| content      | TEXT         | Not Null                      | Contenido del chunk de texto.                         | La Cattleya trianae es...  |
| source_type  | VARCHAR(50)  | Nullable                      | Tipo de fuente: Species, Paper, Manual.               | Species                    |
| source_url   | VARCHAR(500) | Nullable                      | URL del recurso original.                             | https://sib.../cattleya    |
| species_id   | UUID         | FK (species), Nullable        | Especie relacionada (si aplica).                      | c456...                    |
| embedding_id | VARCHAR(100) | Nullable                      | ID del embedding en ChromaDB.                         | chroma-abc123              |
| chunk_index  | INT          | Default 0                     | Indice del chunk dentro del documento.                | 0                          |
| metadata     | JSONB        | Nullable                      | Metadatos adicionales del chunk.                      | {"tokens": 512}            |
| created_at   | TIMESTAMPTZ  | Default NOW()                 | Fecha de indexacion.                                  | 2025-02-25 10:00:00+00     |

### **Tabla: chat_sessions**

_Sesiones de conversacion con el chatbot RAG de asesoria en biocomercio._

| Campo         | Tipo de Dato | Restricciones                 | Descripcion                                                      | Ejemplo                             |
| :------------ | :----------- | :---------------------------- | :--------------------------------------------------------------- | :---------------------------------- |
| id            | UUID         | PK, Default gen_random_uuid() | ID de la sesion.                                                 | sess1...                            |
| user_id       | UUID         | Index, Not Null               | **Logical FK** a SQL Server (Users). Usuario que inicia el chat. | a0ee...                             |
| context_topic | VARCHAR(100) | Nullable                      | Tema de contexto para el RAG.                                    | Biocommerce, Taxonomy, Conservation |
| started_at    | TIMESTAMPTZ  | Default NOW()                 | Inicio de la sesion.                                             | 2025-02-20 09:00:00+00              |

### **Tabla: chat_messages**

_Mensajes individuales dentro de una sesion de chat. Historial del chatbot._

| Campo      | Tipo de Dato | Restricciones                     | Descripcion                           | Ejemplo                                              |
| :--------- | :----------- | :-------------------------------- | :------------------------------------ | :--------------------------------------------------- |
| id         | UUID         | PK, Default gen_random_uuid()     | ID del mensaje.                       | msg1...                                              |
| session_id | UUID         | FK (chat_sessions), Not Null      | Sesion padre.                         | sess1...                                             |
| role       | VARCHAR(20)  | Not Null                          | Rol del emisor: 'user' o 'assistant'. | user                                                 |
| content    | TEXT         | Not Null                          | Contenido del mensaje.                | Que permisos necesito para comercializar orquideas?   |
| created_at | TIMESTAMPTZ  | Default NOW()                     | Timestamp del mensaje.                | 2025-02-20 09:01:00+00                               |

---

# **4. Notas de Implementacion**

1. **Manejo de Fechas:** Todas las fechas (`created_at`, `updated_at`, `timestamp`) deben guardarse en **UTC**. La conversion a hora local (Colombia GMT-5) se realiza exclusivamente en el Frontend.
2. **Imagenes:** Las bases de datos **NO** almacenan archivos binarios (BLOBs). Solo se almacenan **URLs** apuntando a un servicio de almacenamiento externo (Azure Blob Storage o AWS S3).
3. **Documentos de Certificacion:** Se almacenan como URLs en el campo `DocumentUrl` de la tabla `Certifications`. Los documentos fisicos residen en almacenamiento de objetos externo.
4. **Auditoria:** Las tablas criticas (Species, Products, Orders, Certifications) incluyen columnas `created_at` y `updated_at` (Timestamp) para cumplir con requisitos de trazabilidad.
5. **Geospatial:** La tabla `geographic_distribution` requiere la extension PostGIS habilitada en PostgreSQL (`CREATE EXTENSION postgis;`). El campo `location_point` se computa a partir de `latitude`/`longitude`.
6. **Logical Foreign Keys:** Los campos que referencian entidades en el otro motor de base de datos (marcados como **Logical FK**) no tienen restriccion fisica de FK. La validacion de existencia se ejecuta en la Capa de Aplicacion (Commands/Queries con MediatR).
7. **Sensitive Data (Bio-Safety):** Cuando `species.is_sensitive = True`, la API debe enmascarar las coordenadas exactas de `geographic_distribution` y retornar unicamente el centro del municipio. Nunca exponer ubicacion exacta de especies amenazadas.
8. **ABS Compliance (Nagoya):** Un `Product` no puede crearse sin un `AbsPermit` activo y vigente para el `base_species_id` correspondiente. Esta regla se valida en el `CreateProductCommand` (Application Layer).
9. **MLOps:** La tabla `ai_model_versions` permite rollback de modelos. Solo una version puede tener `is_active = True` en cualquier momento dado.
10. **Naming Conventions:** SQL Server usa **PascalCase** para tablas y columnas (EF Core default). PostgreSQL usa **snake_case** para tablas y columnas (configurado via Fluent API en ScientificDbContext).
11. **Certificaciones Unificadas:** La tabla `Certifications` reemplaza las anteriores tablas `SustainabilityCerts`, `ProductCerts`, y `Certification` con un modelo unificado que usa `CertificationType` como discriminador.
