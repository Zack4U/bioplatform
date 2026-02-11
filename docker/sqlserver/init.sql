-- ===========================================
-- BioPlatform - SQL Server Initialization Script
-- Base de datos: BioCommerce_Transactional
-- ===========================================

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'BioCommerce_Transactional')
BEGIN
    CREATE DATABASE BioCommerce_Transactional;
END
GO

USE BioCommerce_Transactional;
GO

-- ===========================================
-- ESQUEMA: Identity & Access Management
-- ===========================================

-- Tabla: Roles
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE Roles (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(200),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
END
GO

-- Tabla: Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Email NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(MAX) NOT NULL,
        FullName NVARCHAR(150) NOT NULL,
        PhoneNumber NVARCHAR(20),
        IsVerified BIT DEFAULT 0,
        TwoFactorSecret NVARCHAR(100),
        TwoFactorEnabled BIT DEFAULT 0,
        IsActive BIT DEFAULT 1,
        LastLoginAt DATETIME2,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );
    
    CREATE INDEX IX_Users_Email ON Users(Email);
END
GO

-- Tabla: UserRoles (Relación muchos a muchos)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE UserRoles (
        UserId UNIQUEIDENTIFIER NOT NULL,
        RoleId INT NOT NULL,
        AssignedAt DATETIME2 DEFAULT GETUTCDATE(),
        PRIMARY KEY (UserId, RoleId),
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
        FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE
    );
END
GO

-- Tabla: RefreshTokens
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RefreshTokens')
BEGIN
    CREATE TABLE RefreshTokens (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        UserId UNIQUEIDENTIFIER NOT NULL,
        Token NVARCHAR(500) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        RevokedAt DATETIME2,
        ReplacedByToken NVARCHAR(500),
        FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
    );
    
    CREATE INDEX IX_RefreshTokens_Token ON RefreshTokens(Token);
END
GO

-- ===========================================
-- ESQUEMA: Marketplace & Products
-- ===========================================

-- Tabla: Products
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
BEGIN
    CREATE TABLE Products (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        EntrepreneurId UNIQUEIDENTIFIER NOT NULL,
        BaseSpeciesId UNIQUEIDENTIFIER NOT NULL, -- Logical FK a PostgreSQL
        Name NVARCHAR(100) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        ShortDescription NVARCHAR(300),
        Price DECIMAL(18,2) NOT NULL,
        CompareAtPrice DECIMAL(18,2),
        StockQuantity INT NOT NULL DEFAULT 0,
        Sku NVARCHAR(50) UNIQUE,
        Category NVARCHAR(50),
        Tags NVARCHAR(500),
        ImageUrls NVARCHAR(MAX), -- JSON array de URLs
        IsActive BIT DEFAULT 1,
        IsFeatured BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (EntrepreneurId) REFERENCES Users(Id)
    );
    
    CREATE INDEX IX_Products_Entrepreneur ON Products(EntrepreneurId);
    CREATE INDEX IX_Products_Category ON Products(Category);
    CREATE INDEX IX_Products_BaseSpecies ON Products(BaseSpeciesId);
END
GO

-- Tabla: ProductReviews
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProductReviews')
BEGIN
    CREATE TABLE ProductReviews (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ProductId UNIQUEIDENTIFIER NOT NULL,
        UserId UNIQUEIDENTIFIER NOT NULL,
        Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
        Title NVARCHAR(100),
        Comment NVARCHAR(MAX),
        IsVerifiedPurchase BIT DEFAULT 0,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );
END
GO

-- ===========================================
-- ESQUEMA: Orders & Transactions
-- ===========================================

-- Tabla: Orders
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Orders')
BEGIN
    CREATE TABLE Orders (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        OrderNumber NVARCHAR(20) NOT NULL UNIQUE,
        BuyerId UNIQUEIDENTIFIER NOT NULL,
        TotalAmount DECIMAL(18,2) NOT NULL,
        SubtotalAmount DECIMAL(18,2) NOT NULL,
        TaxAmount DECIMAL(18,2) DEFAULT 0,
        ShippingAmount DECIMAL(18,2) DEFAULT 0,
        DiscountAmount DECIMAL(18,2) DEFAULT 0,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Pending',
        PaymentMethod NVARCHAR(50),
        PaymentStatus NVARCHAR(20) DEFAULT 'Pending',
        TransactionRef NVARCHAR(100),
        ShippingAddress NVARCHAR(MAX),
        BillingAddress NVARCHAR(MAX),
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        PaidAt DATETIME2,
        FOREIGN KEY (BuyerId) REFERENCES Users(Id)
    );
    
    CREATE INDEX IX_Orders_Buyer ON Orders(BuyerId);
    CREATE INDEX IX_Orders_Status ON Orders(Status);
    CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);
END
GO

-- Tabla: OrderItems
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'OrderItems')
BEGIN
    CREATE TABLE OrderItems (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        OrderId UNIQUEIDENTIFIER NOT NULL,
        ProductId UNIQUEIDENTIFIER NOT NULL,
        SellerId UNIQUEIDENTIFIER NOT NULL,
        ProductName NVARCHAR(100) NOT NULL,
        Quantity INT NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL,
        TotalPrice DECIMAL(18,2) NOT NULL,
        FOREIGN KEY (OrderId) REFERENCES Orders(Id) ON DELETE CASCADE,
        FOREIGN KEY (ProductId) REFERENCES Products(Id),
        FOREIGN KEY (SellerId) REFERENCES Users(Id)
    );
END
GO

-- ===========================================
-- ESQUEMA: Legal & Compliance (ABS)
-- ===========================================

-- Tabla: AbsPermits (Permisos de Acceso a Recursos Genéticos)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AbsPermits')
BEGIN
    CREATE TABLE AbsPermits (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        EntrepreneurId UNIQUEIDENTIFIER NOT NULL,
        SpeciesId UNIQUEIDENTIFIER NOT NULL, -- Logical FK a PostgreSQL
        ResolutionNumber NVARCHAR(100) NOT NULL UNIQUE,
        EmissionDate DATE NOT NULL,
        ExpirationDate DATE NOT NULL,
        GrantingAuthority NVARCHAR(100) NOT NULL,
        PermitType NVARCHAR(50) NOT NULL,
        Status NVARCHAR(20) NOT NULL DEFAULT 'Active',
        DocumentUrl NVARCHAR(500),
        Notes NVARCHAR(MAX),
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (EntrepreneurId) REFERENCES Users(Id)
    );
    
    CREATE INDEX IX_AbsPermits_Species ON AbsPermits(SpeciesId);
    CREATE INDEX IX_AbsPermits_Status ON AbsPermits(Status);
END
GO

-- Tabla: Certifications
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Certifications')
BEGIN
    CREATE TABLE Certifications (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ProductId UNIQUEIDENTIFIER NOT NULL,
        CertificationType NVARCHAR(100) NOT NULL,
        CertificationBody NVARCHAR(150) NOT NULL,
        CertificateNumber NVARCHAR(100),
        IssueDate DATE NOT NULL,
        ExpiryDate DATE,
        DocumentUrl NVARCHAR(500),
        Status NVARCHAR(20) DEFAULT 'Active',
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        FOREIGN KEY (ProductId) REFERENCES Products(Id) ON DELETE CASCADE
    );
END
GO

-- ===========================================
-- DATOS SEMILLA (Seeders)
-- ===========================================

-- Insertar Roles del sistema
IF NOT EXISTS (SELECT * FROM Roles WHERE Name = 'Admin')
BEGIN
    INSERT INTO Roles (Name, Description) VALUES
    ('Admin', 'Full system administrator with all permissions'),
    ('Researcher', 'Can validate species identifications and contribute scientific data'),
    ('Entrepreneur', 'Can create and sell products in the marketplace'),
    ('Community', 'Local community members sharing traditional knowledge'),
    ('Buyer', 'Can browse catalog and purchase products'),
    ('EnvironmentalAuthority', 'Can verify permits and sustainability certifications');
END
GO

-- Crear usuario administrador por defecto (password: Admin@123456)
-- Hash generado con BCrypt
IF NOT EXISTS (SELECT * FROM Users WHERE Email = 'admin@bioplatform.co')
BEGIN
    DECLARE @AdminId UNIQUEIDENTIFIER = NEWID();
    
    INSERT INTO Users (Id, Email, PasswordHash, FullName, IsVerified, IsActive)
    VALUES (@AdminId, 'admin@bioplatform.co', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.SQkFfJ6Z6K.Hs.', 'System Administrator', 1, 1);
    
    INSERT INTO UserRoles (UserId, RoleId)
    SELECT @AdminId, Id FROM Roles WHERE Name = 'Admin';
END
GO

PRINT 'SQL Server initialization completed successfully!';
GO
