-- =============================================================================
-- Seed: Related Products for 6 species 
-- Database: SQL Server (BioCommerce)
-- Minimum: 5 products per species (30 total)
--
-- NOTE: BaseSpeciesId is a LOGICAL FK to PostgreSQL species.id.
--       You must replace the placeholder UUIDs with real species IDs from PostgreSQL.
--       Run in PostgreSQL first:
--         SELECT id, scientific_name FROM species
--         WHERE scientific_name IN (
--           'Abracris flavolineata', 'Acacia decurrens', 'Acaena elongata',
--           'Accipiter striatus', 'Achlyodes pallida', 'Acrocomia aculeata'
--         );
--
-- EntrepreneurId uses the seeded Entrepreneur user: A3333333-3333-3333-3333-333333333333
-- =============================================================================

DECLARE @EntrepreneurId UNIQUEIDENTIFIER = 'A3333333-3333-3333-3333-333333333333';

-- Replace these with actual UUIDs from PostgreSQL species table
-- You MUST update these values before running the script
DECLARE @AbracrisId   UNIQUEIDENTIFIER; -- = '<UUID from PostgreSQL>'
DECLARE @AcaciaId     UNIQUEIDENTIFIER; -- = '<UUID from PostgreSQL>'
DECLARE @AcaenaId     UNIQUEIDENTIFIER; -- = '<UUID from PostgreSQL>'
DECLARE @AccipiterId  UNIQUEIDENTIFIER; -- = '<UUID from PostgreSQL>'
DECLARE @AchlyodesId  UNIQUEIDENTIFIER; -- = '<UUID from PostgreSQL>'
DECLARE @AcrocomiaId  UNIQUEIDENTIFIER; -- = '<UUID from PostgreSQL>'

-- IMPORTANT: Uncomment and set the real UUIDs from your PostgreSQL database:
-- SET @AbracrisId   = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
-- SET @AcaciaId     = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
-- SET @AcaenaId     = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
-- SET @AccipiterId  = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
-- SET @AchlyodesId  = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
-- SET @AcrocomiaId  = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';

-- For development, generate deterministic UUIDs based on species names:
SET @AbracrisId  = 'B0000001-0001-0001-0001-000000000001';
SET @AcaciaId    = 'B0000001-0001-0001-0001-000000000002';
SET @AcaenaId    = 'B0000001-0001-0001-0001-000000000003';
SET @AccipiterId = 'B0000001-0001-0001-0001-000000000004';
SET @AchlyodesId = 'B0000001-0001-0001-0001-000000000005';
SET @AcrocomiaId = 'B0000001-0001-0001-0001-000000000006';

-- =============================================================================
-- 1. Abracris flavolineata — Saltamontes de rayas amarillas
--    Products: Educational, ecotourism, biological control, scientific
-- =============================================================================
INSERT INTO Products (Id, Slug, EntrepreneurId, BaseSpeciesId, Name, Description, Price, StockQuantity, IsActive, CreatedAt)
VALUES
    (NEWID(), 'guia-insectos-caldas', @EntrepreneurId, @AbracrisId,
     'Guía de Insectos de Caldas', 
     'Guía ilustrada de los insectos más representativos de Caldas. Incluye fotografías de alta calidad y descripciones de hábitat.',
     45000, 50, 1, GETUTCDATE()),
    
    (NEWID(), 'tour-entomologico-caldas', @EntrepreneurId, @AbracrisId,
     'Tour Entomológico Guiado',
     'Experiencia de campo de 4 horas con entomólogo experto. Incluye lupa, guía impresa e identificación de insectos en vivo.',
     120000, 20, 1, GETUTCDATE()),
    
    (NEWID(), 'kit-coleccion-insectos', @EntrepreneurId, @AbracrisId,
     'Kit de Colección Entomológica',
     'Kit profesional para colección de insectos con caja entomológica, alfileres, pinzas y guía de montaje.',
     85000, 30, 1, GETUTCDATE()),
    
    (NEWID(), 'poster-ortopteros-colombia', @EntrepreneurId, @AbracrisId,
     'Póster Taxonómico de Ortópteros',
     'Póster científico de 60x90cm con ilustraciones de las principales familias de ortópteros de Colombia.',
     25000, 100, 1, GETUTCDATE()),
    
    (NEWID(), 'servicio-control-biologico', @EntrepreneurId, @AbracrisId,
     'Asesoría en Control Biológico de Plagas',
     'Servicio de consultoría para manejo integrado de plagas agrícolas utilizando enfoques de control biológico.',
     350000, 10, 1, GETUTCDATE());

-- =============================================================================
-- 2. Acacia decurrens — Acacia negra
--    Products: Forestry, tannins, honey, biomass, restoration
-- =============================================================================
INSERT INTO Products (Id, Slug, EntrepreneurId, BaseSpeciesId, Name, Description, Price, StockQuantity, IsActive, CreatedAt)
VALUES
    (NEWID(), 'tanino-acacia-500g', @EntrepreneurId, @AcaciaId,
     'Extracto de Tanino de Acacia (500g)',
     'Tanino natural extraído de corteza de Acacia decurrens. Uso en curtido de cueros y tintes naturales.',
     65000, 40, 1, GETUTCDATE()),
    
    (NEWID(), 'miel-floraciion-acacia', @EntrepreneurId, @AcaciaId,
     'Miel de Floración de Acacia (500ml)',
     'Miel artesanal monofloral de floración de acacia. Sabor suave y color claro. Producción apícola sostenible.',
     32000, 80, 1, GETUTCDATE()),
    
    (NEWID(), 'plantulas-acacia-reforestacion', @EntrepreneurId, @AcaciaId,
     'Plántulas de Acacia para Reforestación (x50)',
     'Lote de 50 plántulas de Acacia decurrens listas para trasplante. Ideales para restauración de suelos degradados.',
     75000, 25, 1, GETUTCDATE()),
    
    (NEWID(), 'carbon-vegetal-acacia-5kg', @EntrepreneurId, @AcaciaId,
     'Carbón Vegetal de Acacia (5kg)',
     'Carbón vegetal de alta calidad obtenido de podas de acacia. Producción sostenible con manejo forestal certificado.',
     18000, 150, 1, GETUTCDATE()),
    
    (NEWID(), 'servicio-reforestacion-acacia', @EntrepreneurId, @AcaciaId,
     'Servicio de Reforestación con Acacia',
     'Servicio integral de restauración ecológica con Acacia decurrens. Incluye preparación del terreno, siembra y seguimiento.',
     2500000, 5, 1, GETUTCDATE());

-- =============================================================================
-- 3. Acaena elongata — Cadillo de páramo
--    Products: Medicinal, restoration, education, cosmetics
-- =============================================================================
INSERT INTO Products (Id, Slug, EntrepreneurId, BaseSpeciesId, Name, Description, Price, StockQuantity, IsActive, CreatedAt)
VALUES
    (NEWID(), 'te-cadillo-paramo-30g', @EntrepreneurId, @AcaenaId,
     'Infusión de Cadillo de Páramo (30g)',
     'Infusión herbal de hojas secas de Acaena elongata. Uso tradicional como antiinflamatorio y digestivo.',
     15000, 60, 1, GETUTCDATE()),
    
    (NEWID(), 'crema-paramo-50ml', @EntrepreneurId, @AcaenaId,
     'Crema Hidratante de Páramo (50ml)',
     'Crema cosmética artesanal con extractos de plantas altoandinas incluyendo cadillo de páramo. Hidratación profunda.',
     42000, 35, 1, GETUTCDATE()),
    
    (NEWID(), 'semillas-restauracion-paramo', @EntrepreneurId, @AcaenaId,
     'Semillas Nativas para Restauración de Páramo',
     'Mix de semillas nativas de páramo incluyendo Acaena elongata. Para proyectos de restauración ecológica.',
     55000, 20, 1, GETUTCDATE()),
    
    (NEWID(), 'guia-flora-paramos-caldas', @EntrepreneurId, @AcaenaId,
     'Guía de Flora de Páramos de Caldas',
     'Guía fotográfica con 120 especies de páramo including identificación, usos y estado de conservación.',
     58000, 45, 1, GETUTCDATE()),
    
    (NEWID(), 'tour-paramo-ruiz', @EntrepreneurId, @AcaenaId,
     'Ecoturismo Páramo del Ruiz',
     'Caminata guiada de día completo al Páramo del Ruiz. Incluye transporte, guía experto, almuerzo y sesión de identificación botánica.',
     180000, 15, 1, GETUTCDATE());

-- =============================================================================
-- 4. Accipiter striatus — Gavilán acollarado
--    Products: Birdwatching, optics, educational, conservation
-- =============================================================================
INSERT INTO Products (Id, Slug, EntrepreneurId, BaseSpeciesId, Name, Description, Price, StockQuantity, IsActive, CreatedAt)
VALUES
    (NEWID(), 'tour-avistamiento-rapaces', @EntrepreneurId, @AccipiterId,
     'Tour de Avistamiento de Rapaces',
     'Jornada de avistamiento de aves rapaces en Caldas. Incluye guía experto, equipo óptico y checklist de rapaces.',
     150000, 12, 1, GETUTCDATE()),
    
    (NEWID(), 'poster-rapaces-colombia', @EntrepreneurId, @AccipiterId,
     'Póster de Rapaces de Colombia',
     'Póster ilustrado de 50x70cm con las 80 especies de aves rapaces de Colombia. Ilustraciones científicas de alta calidad.',
     28000, 80, 1, GETUTCDATE()),
    
    (NEWID(), 'binoculares-avistamiento-10x42', @EntrepreneurId, @AccipiterId,
     'Binoculares para Avistamiento 10x42',
     'Binoculares profesionales 10x42 impermeables con tratamiento óptico multicapa. Ideales para avistamiento de aves.',
     890000, 8, 1, GETUTCDATE()),
    
    (NEWID(), 'guia-aves-rapaces-andes', @EntrepreneurId, @AccipiterId,
     'Guía de Campo: Aves Rapaces de los Andes',
     'Guía fotográfica de bolsillo con 65 especies de rapaces andinas. Claves de identificación en vuelo y posadas.',
     52000, 40, 1, GETUTCDATE()),
    
    (NEWID(), 'adopta-gavilan-conservacion', @EntrepreneurId, @AccipiterId,
     'Programa "Adopta un Gavilán"',
     'Apadrina la conservación de un gavilán acollarado. Incluye certificado, reportes de monitoreo y visita de campo anual.',
     200000, 30, 1, GETUTCDATE());

-- =============================================================================
-- 5. Achlyodes pallida — Saltarina pálida
--    Products: Lepidopterology, garden, education, cosmetics, photography
-- =============================================================================
INSERT INTO Products (Id, Slug, EntrepreneurId, BaseSpeciesId, Name, Description, Price, StockQuantity, IsActive, CreatedAt)
VALUES
    (NEWID(), 'jardin-mariposas-kit', @EntrepreneurId, @AchlyodesId,
     'Kit Jardín de Mariposas',
     'Kit completo para crear un jardín atractor de mariposas. Incluye 15 plántulas nectaríferas y guía de cuidado.',
     95000, 25, 1, GETUTCDATE()),
    
    (NEWID(), 'guia-mariposas-caldas', @EntrepreneurId, @AchlyodesId,
     'Guía Fotográfica: Mariposas de Caldas',
     'Guía con 200 especies de mariposas y polillas de Caldas. Fotografías de alta resolución con claves de identificación.',
     65000, 50, 1, GETUTCDATE()),
    
    (NEWID(), 'taller-fotografia-macro-insectos', @EntrepreneurId, @AchlyodesId,
     'Taller de Macrofotografía de Insectos',
     'Taller práctico de 6 horas sobre macrofotografía de insectos en campo. Incluye lentes macro en préstamo.',
     180000, 10, 1, GETUTCDATE()),
    
    (NEWID(), 'camiseta-ilustracion-mariposas', @EntrepreneurId, @AchlyodesId,
     'Camiseta Ilustración Mariposas Andinas',
     'Camiseta de algodón orgánico con ilustración artística de 12 especies de mariposas andinas. Tallas S-XL.',
     48000, 60, 1, GETUTCDATE()),
    
    (NEWID(), 'poster-ciclo-vida-lepidopteros', @EntrepreneurId, @AchlyodesId,
     'Póster Ciclo de Vida de Lepidópteros',
     'Póster educativo ilustrado (50x70cm) mostrando el ciclo completo de vida de mariposas y polillas.',
     22000, 90, 1, GETUTCDATE());

-- =============================================================================
-- 6. Acrocomia aculeata — Corozo
--    Products: Oil, food, cosmetics, handicrafts, restoration
-- =============================================================================
INSERT INTO Products (Id, Slug, EntrepreneurId, BaseSpeciesId, Name, Description, Price, StockQuantity, IsActive, CreatedAt)
VALUES
    (NEWID(), 'aceite-corozo-250ml', @EntrepreneurId, @AcrocomiaId,
     'Aceite de Corozo Prensado en Frío (250ml)',
     'Aceite vegetal artesanal extraído del fruto de corozo. Rico en ácido oleico y beta-caroteno. Uso culinario y cosmético.',
     38000, 50, 1, GETUTCDATE()),
    
    (NEWID(), 'pulpa-corozo-congelada-500g', @EntrepreneurId, @AcrocomiaId,
     'Pulpa de Corozo Congelada (500g)',
     'Pulpa natural de corozo sin aditivos para jugos, helados y postres. Fuente natural de vitamina A y antioxidantes.',
     12000, 100, 1, GETUTCDATE()),
    
    (NEWID(), 'jabon-artesanal-corozo', @EntrepreneurId, @AcrocomiaId,
     'Jabón Artesanal de Aceite de Corozo',
     'Jabón artesanal saponificado en frío con aceite de corozo. Hidratante natural para piel seca. Sin conservantes.',
     15000, 75, 1, GETUTCDATE()),
    
    (NEWID(), 'artesanias-semilla-corozo', @EntrepreneurId, @AcrocomiaId,
     'Artesanías en Semilla de Corozo',
     'Collar y aretes artesanales tallados en semilla de corozo por artesanos de Caldas. Cada pieza es única.',
     28000, 40, 1, GETUTCDATE()),
    
    (NEWID(), 'plantulas-corozo-restauracion', @EntrepreneurId, @AcrocomiaId,
     'Plántulas de Corozo para Restauración (x20)',
     'Lote de 20 plántulas de Acrocomia aculeata para restauración de bosque seco tropical. 6 meses de crecimiento.',
     60000, 15, 1, GETUTCDATE());

PRINT 'Seed complete: 30 products inserted for 6 species.';
