-- =============================================================================
-- Seed: Geographic Distributions for 6 species in Caldas, Colombia
-- Database: PostgreSQL (BioCommerce_Scientific)
-- Minimum: 10 distribution points per species
--
-- Species (from catalog):
--   1. Abracris flavolineata (Saltamontes de rayas amarillas)
--   2. Acacia decurrens       (Acacia negra)
--   3. Acaena elongata        (Cadillo de páramo)
--   4. Accipiter striatus     (Gavilán acollarado)
--   5. Achlyodes pallida      (Saltarina pálida)
--   6. Acrocomia aculeata     (Corozo)
--
-- NOTE: Replace <SPECIES_ID_N> placeholders with actual UUIDs from the
-- species table. Run: SELECT id, scientific_name FROM species WHERE scientific_name IN (...);
-- =============================================================================

-- Lookup actual species IDs
DO $$
DECLARE
    v_abracris    UUID;
    v_acacia      UUID;
    v_acaena      UUID;
    v_accipiter   UUID;
    v_achlyodes   UUID;
    v_acrocomia   UUID;
BEGIN
    SELECT id INTO v_abracris   FROM species WHERE scientific_name = 'Abracris flavolineata';
    SELECT id INTO v_acacia     FROM species WHERE scientific_name = 'Acacia decurrens';
    SELECT id INTO v_acaena     FROM species WHERE scientific_name = 'Acaena elongata';
    SELECT id INTO v_accipiter  FROM species WHERE scientific_name = 'Accipiter striatus';
    SELECT id INTO v_achlyodes  FROM species WHERE scientific_name = 'Achlyodes pallida';
    SELECT id INTO v_acrocomia  FROM species WHERE scientific_name = 'Acrocomia aculeata';

    -- Validate all IDs found
    IF v_abracris IS NULL THEN RAISE EXCEPTION 'Species not found: Abracris flavolineata'; END IF;
    IF v_acacia IS NULL THEN RAISE EXCEPTION 'Species not found: Acacia decurrens'; END IF;
    IF v_acaena IS NULL THEN RAISE EXCEPTION 'Species not found: Acaena elongata'; END IF;
    IF v_accipiter IS NULL THEN RAISE EXCEPTION 'Species not found: Accipiter striatus'; END IF;
    IF v_achlyodes IS NULL THEN RAISE EXCEPTION 'Species not found: Achlyodes pallida'; END IF;
    IF v_acrocomia IS NULL THEN RAISE EXCEPTION 'Species not found: Acrocomia aculeata'; END IF;

    -- =========================================================================
    -- 1. Abracris flavolineata — Saltamontes de rayas amarillas
    --    Habitat: Pastizales y cultivos de tierra caliente/templada (800-2200m)
    -- =========================================================================
    INSERT INTO geographic_distribution (id, species_id, latitude, longitude, altitude, municipality, ecosystem_type)
    VALUES
        (gen_random_uuid(), v_abracris, 5.0689, -75.5174, 1200, 'Manizales',   'Pastizal periurbano'),
        (gen_random_uuid(), v_abracris, 4.9833, -75.6000, 1400, 'Chinchiná',   'Zona cafetera abierta'),
        (gen_random_uuid(), v_abracris, 5.0456, -75.5139, 1800, 'Villamaría',  'Ecotono bosque-pastizal'),
        (gen_random_uuid(), v_abracris, 5.0667, -75.6333, 1100, 'Palestina',   'Pastizal de zona cafetera'),
        (gen_random_uuid(), v_abracris, 5.3000, -75.5167, 1600, 'Salamina',    'Potrero de ladera'),
        (gen_random_uuid(), v_abracris, 5.1644, -75.5189, 1500, 'Neira',       'Cultivo de caña panelera'),
        (gen_random_uuid(), v_abracris, 5.4500, -75.6500, 1300, 'Pácora',      'Pastizal ganadero'),
        (gen_random_uuid(), v_abracris, 5.2000, -75.5500, 1700, 'Aranzazu',    'Pradera de ladera'),
        (gen_random_uuid(), v_abracris, 5.3500, -75.5800, 1000, 'Aguadas',     'Herbazal tropical'),
        (gen_random_uuid(), v_abracris, 5.1000, -75.7500, 1200, 'Risaralda',   'Pastizal de valle');

    -- =========================================================================
    -- 2. Acacia decurrens — Acacia negra
    --    Habitat: Bosque seco, zonas reforestadas (1500-2800m)
    -- =========================================================================
    INSERT INTO geographic_distribution (id, species_id, latitude, longitude, altitude, municipality, ecosystem_type)
    VALUES
        (gen_random_uuid(), v_acacia, 5.0689, -75.5174, 2200, 'Manizales',    'Zona reforestada urbana'),
        (gen_random_uuid(), v_acacia, 5.0456, -75.5139, 2400, 'Villamaría',   'Bosque plantado de ladera'),
        (gen_random_uuid(), v_acacia, 5.1644, -75.5189, 2100, 'Neira',        'Borde de carretera'),
        (gen_random_uuid(), v_acacia, 5.3000, -75.5167, 2300, 'Salamina',     'Plantación forestal'),
        (gen_random_uuid(), v_acacia, 5.2000, -75.5500, 2500, 'Aranzazu',     'Bosque secundario'),
        (gen_random_uuid(), v_acacia, 5.4500, -75.6500, 1800, 'Pácora',       'Cerca viva ganadera'),
        (gen_random_uuid(), v_acacia, 4.9500, -75.6200, 1600, 'Santa Rosa',   'Margen de quebrada'),
        (gen_random_uuid(), v_acacia, 5.3500, -75.5800, 1900, 'Aguadas',      'Zona reforestada'),
        (gen_random_uuid(), v_acacia, 5.0500, -75.4500, 2600, 'Manizales',    'Ladera oriental reforestada'),
        (gen_random_uuid(), v_acacia, 5.1200, -75.6000, 2000, 'Filadelfia',   'Bordes de caminos rurales'),
        (gen_random_uuid(), v_acacia, 5.2500, -75.5800, 2200, 'Aranzazu',     'Pendiente reforestada');

    -- =========================================================================
    -- 3. Acaena elongata — Cadillo de páramo
    --    Habitat: Páramos y subpáramos (2800-4200m)
    -- =========================================================================
    INSERT INTO geographic_distribution (id, species_id, latitude, longitude, altitude, municipality, ecosystem_type)
    VALUES
        (gen_random_uuid(), v_acaena, 4.9833, -75.3667, 3800, 'Villamaría',   'Páramo de Letras'),
        (gen_random_uuid(), v_acaena, 4.9667, -75.3500, 4000, 'Villamaría',   'Superpáramo del Ruiz'),
        (gen_random_uuid(), v_acaena, 5.0689, -75.4000, 3200, 'Manizales',    'Subpáramo de Termales'),
        (gen_random_uuid(), v_acaena, 5.0000, -75.3700, 3600, 'Villamaría',   'Páramo de la Olleta'),
        (gen_random_uuid(), v_acaena, 4.9500, -75.3300, 3900, 'Villamaría',   'Páramo del Cisne'),
        (gen_random_uuid(), v_acaena, 5.1000, -75.4200, 2900, 'Manizales',    'Ecotono bosque-páramo'),
        (gen_random_uuid(), v_acaena, 5.3000, -75.5000, 3100, 'Salamina',     'Subpáramo de San Félix'),
        (gen_random_uuid(), v_acaena, 5.0200, -75.3900, 3400, 'Manizales',    'Páramo del Ruiz sector N'),
        (gen_random_uuid(), v_acaena, 4.9000, -75.3200, 4100, 'Villamaría',   'Superpáramo glaciar'),
        (gen_random_uuid(), v_acaena, 5.0500, -75.4100, 3000, 'Manizales',    'Borde de páramo');

    -- =========================================================================
    -- 4. Accipiter striatus — Gavilán acollarado
    --    Habitat: Bosques montanos y bordes de bosque (1200-3200m)
    -- =========================================================================
    INSERT INTO geographic_distribution (id, species_id, latitude, longitude, altitude, municipality, ecosystem_type)
    VALUES
        (gen_random_uuid(), v_accipiter, 5.0689, -75.5174, 2400, 'Manizales',   'Bosque montano de Río Blanco'),
        (gen_random_uuid(), v_accipiter, 5.0456, -75.5139, 2600, 'Villamaría',  'Bosque de niebla'),
        (gen_random_uuid(), v_accipiter, 5.1644, -75.5189, 2200, 'Neira',       'Bosque secundario de ladera'),
        (gen_random_uuid(), v_accipiter, 5.3000, -75.5167, 2500, 'Salamina',    'Bosque andino fragmentado'),
        (gen_random_uuid(), v_accipiter, 4.9833, -75.6000, 1800, 'Chinchiná',   'Borde de cafetal arbolado'),
        (gen_random_uuid(), v_accipiter, 5.4500, -75.6500, 1600, 'Pácora',      'Relicto de bosque'),
        (gen_random_uuid(), v_accipiter, 5.0000, -75.3700, 3000, 'Villamaría',  'Bosque alto andino'),
        (gen_random_uuid(), v_accipiter, 5.2000, -75.5500, 2100, 'Aranzazu',    'Borde bosque-potrero'),
        (gen_random_uuid(), v_accipiter, 5.3500, -75.5800, 1400, 'Aguadas',     'Bosque premontano'),
        (gen_random_uuid(), v_accipiter, 5.1000, -75.7500, 1200, 'Risaralda',   'Bosque seco interandino'),
        (gen_random_uuid(), v_accipiter, 5.0300, -75.4800, 2800, 'Manizales',   'Corredor biológico andino');

    -- =========================================================================
    -- 5. Achlyodes pallida — Saltarina pálida
    --    Habitat: Sotobosque y claros de bosque húmedo (500-1800m)
    -- =========================================================================
    INSERT INTO geographic_distribution (id, species_id, latitude, longitude, altitude, municipality, ecosystem_type)
    VALUES
        (gen_random_uuid(), v_achlyodes, 5.4833, -75.6667, 800,  'La Merced',     'Bosque húmedo tropical'),
        (gen_random_uuid(), v_achlyodes, 5.1500, -75.7500, 1200, 'Risaralda',     'Sotobosque húmedo'),
        (gen_random_uuid(), v_achlyodes, 5.5333, -75.0500, 600,  'Victoria',      'Bosque tropical de planicie'),
        (gen_random_uuid(), v_achlyodes, 5.2333, -74.9833, 500,  'Norcasia',      'Bosque basal del Magdalena'),
        (gen_random_uuid(), v_achlyodes, 5.0667, -75.6333, 1400, 'Palestina',     'Claro de bosque cafetero'),
        (gen_random_uuid(), v_achlyodes, 5.3500, -75.6000, 1000, 'Aguadas',       'Borde de bosque húmedo'),
        (gen_random_uuid(), v_achlyodes, 5.4500, -75.6500, 900,  'Pácora',        'Bosque ribereño'),
        (gen_random_uuid(), v_achlyodes, 4.9833, -75.6000, 1500, 'Chinchiná',     'Sotobosque agroforestal'),
        (gen_random_uuid(), v_achlyodes, 5.3833, -74.9500, 700,  'Samaná',        'Bosque húmedo premontano'),
        (gen_random_uuid(), v_achlyodes, 5.4167, -75.0333, 550,  'Pensilvania',   'Bosque húmedo de quebrada');

    -- =========================================================================
    -- 6. Acrocomia aculeata — Corozo
    --    Habitat: Bosque seco tropical y zonas abiertas (200-1400m)
    -- =========================================================================
    INSERT INTO geographic_distribution (id, species_id, latitude, longitude, altitude, municipality, ecosystem_type)
    VALUES
        (gen_random_uuid(), v_acrocomia, 5.5333, -75.0500, 400,  'Victoria',      'Bosque seco tropical'),
        (gen_random_uuid(), v_acrocomia, 5.2333, -74.9833, 350,  'Norcasia',      'Zona ribereña del Magdalena'),
        (gen_random_uuid(), v_acrocomia, 5.3833, -74.9500, 500,  'Samaná',        'Pastizal arbolado tropical'),
        (gen_random_uuid(), v_acrocomia, 5.4833, -75.6667, 700,  'La Merced',     'Bosque seco interandino'),
        (gen_random_uuid(), v_acrocomia, 5.4167, -75.0333, 450,  'Pensilvania',   'Vega de río'),
        (gen_random_uuid(), v_acrocomia, 5.3500, -75.6000, 900,  'Aguadas',       'Potrero con palmas dispersas'),
        (gen_random_uuid(), v_acrocomia, 5.1500, -75.7500, 1100, 'Risaralda',     'Valle interandino'),
        (gen_random_uuid(), v_acrocomia, 5.0667, -75.6333, 1200, 'Palestina',     'Zona cafetera baja'),
        (gen_random_uuid(), v_acrocomia, 4.9833, -75.6000, 1300, 'Chinchiná',     'Borde de zona cafetera'),
        (gen_random_uuid(), v_acrocomia, 5.4500, -75.6500, 800,  'Pácora',        'Pradera tropical con palmas'),
        (gen_random_uuid(), v_acrocomia, 5.6000, -75.0000, 300,  'La Dorada',     'Llanura del Magdalena');

    RAISE NOTICE 'Seed complete: 63 geographic distributions inserted for 6 species.';
END $$;
