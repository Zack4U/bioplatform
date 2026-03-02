USE BioCommerce_Transactional;
GO

-- Limpiar tablas para evitar duplicados en la prueba
DELETE FROM OrderItems;

DELETE FROM Orders;

DELETE FROM AbsPermits;

DELETE FROM Products;

DELETE FROM Users;
GO

-- 1. Insertar un Emprendedor (Vendedor)
DECLARE @EntrepreneurId UNIQUEIDENTIFIER = NEWID ();

INSERT INTO
    Users (
        Id,
        Email,
        PasswordHash,
        FullName,
        PhoneNumber,
        IsVerified,
        IsActive,
        CreatedAt
    )
VALUES (
        @EntrepreneurId,
        'emprendedor@caldas.com',
        'secure_hash_123',
        'Asociación BioCaldas',
        '3001234567',
        1,
        1,
        GETUTCDATE ()
    );

-- 2. Insertar un Permiso ABS Activo (Cumplimiento Bio)
-- Nota: Incluimos EmissionDate y ExpirationDate según tu esquema
DECLARE @SpeciesId UNIQUEIDENTIFIER = NEWID ();

INSERT INTO
    AbsPermits (
        Id,
        EntrepreneurId,
        SpeciesId,
        ResolutionNumber,
        EmissionDate,
        ExpirationDate,
        GrantingAuthority,
        PermitType,
        Status
    )
VALUES (
        NEWID (),
        @EntrepreneurId,
        @SpeciesId,
        'RES-123-2024',
        '2024-01-01',
        '2026-01-01',
        'Corpocaldas',
        'Comercial',
        'Active'
    );

-- 3. Insertar el Producto vinculado
-- Nota: Incluimos Description que es NOT NULL
DECLARE @ProductId UNIQUEIDENTIFIER = NEWID ();

INSERT INTO
    Products (
        Id,
        EntrepreneurId,
        BaseSpeciesId,
        Name,
        Description,
        Price,
        StockQuantity,
        IsActive
    )
VALUES (
        @ProductId,
        @EntrepreneurId,
        @SpeciesId,
        'Extracto de Orquídea Caldense',
        'Extracto puro cultivado en el Nevado del Ruiz.',
        150.00,
        10,
        1
    );

-- MOSTRAR RESULTADOS PARA POSTMAN
SELECT 'COPIAR_ESTE_BUYER_ID' = @EntrepreneurId;

SELECT 'COPIAR_ESTE_PRODUCT_ID' = @ProductId;