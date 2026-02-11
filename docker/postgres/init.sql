-- ===========================================
-- BioPlatform - PostgreSQL Initialization Script
-- Base de datos: BioCommerce_Scientific
-- ===========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Para búsquedas fuzzy

-- ===========================================
-- ESQUEMA: Taxonomía y Especies
-- ===========================================

-- Tabla: Taxonomies
CREATE TABLE IF NOT EXISTS taxonomies (
    id SERIAL PRIMARY KEY,
    kingdom VARCHAR(50) NOT NULL,
    phylum VARCHAR(50),
    class VARCHAR(50),
    "order" VARCHAR(50),
    family VARCHAR(50),
    genus VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_taxonomies_family ON taxonomies(family);
CREATE INDEX idx_taxonomies_genus ON taxonomies(genus);

-- Tabla: Species
CREATE TABLE IF NOT EXISTS species (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    taxonomy_id INT REFERENCES taxonomies(id),
    scientific_name VARCHAR(150) UNIQUE NOT NULL,
    common_name VARCHAR(150),
    description TEXT,
    ecological_info TEXT,
    traditional_uses TEXT,
    economic_potential TEXT,
    conservation_status VARCHAR(50),
    is_sensitive BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX idx_species_scientific_name ON species(scientific_name);
CREATE INDEX idx_species_common_name ON species USING gin(common_name gin_trgm_ops);
CREATE INDEX idx_species_taxonomy ON species(taxonomy_id);

-- Tabla: GeographicDistributions (GIS)
CREATE TABLE IF NOT EXISTS geographic_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    species_id UUID REFERENCES species(id) ON DELETE CASCADE,
    municipality VARCHAR(100) NOT NULL,
    vereda VARCHAR(100),
    location_point GEOGRAPHY(Point, 4326),
    altitude FLOAT,
    observation_date DATE,
    observer_user_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_geo_species ON geographic_distributions(species_id);
CREATE INDEX idx_geo_location ON geographic_distributions USING GIST(location_point);
CREATE INDEX idx_geo_municipality ON geographic_distributions(municipality);

-- ===========================================
-- ESQUEMA: Computer Vision & AI
-- ===========================================

-- Tabla: SpeciesImages
CREATE TABLE IF NOT EXISTS species_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    species_id UUID REFERENCES species(id) ON DELETE CASCADE,
    uploader_user_id UUID,
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    metadata JSONB,
    is_primary BOOLEAN DEFAULT FALSE,
    is_validated_by_expert BOOLEAN DEFAULT FALSE,
    validated_by_user_id UUID,
    validation_date TIMESTAMP WITH TIME ZONE,
    license_type VARCHAR(50) DEFAULT 'CC-BY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_images_species ON species_images(species_id);
CREATE INDEX idx_images_validated ON species_images(is_validated_by_expert);

-- Tabla: PredictionLogs
CREATE TABLE IF NOT EXISTS prediction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    image_input_url VARCHAR(500) NOT NULL,
    raw_prediction_result JSONB NOT NULL,
    top_prediction_species_id UUID REFERENCES species(id),
    confidence_score DECIMAL(5,4) NOT NULL,
    feedback_correct BOOLEAN,
    feedback_actual_species_id UUID REFERENCES species(id),
    processing_time_ms INT,
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_predictions_date ON prediction_logs(created_at);
CREATE INDEX idx_predictions_confidence ON prediction_logs(confidence_score);

-- ===========================================
-- ESQUEMA: GenAI & Business Plans
-- ===========================================

-- Tabla: BusinessPlans
CREATE TABLE IF NOT EXISTS business_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entrepreneur_id UUID NOT NULL,
    project_title VARCHAR(200) NOT NULL,
    species_ids UUID[] DEFAULT '{}',
    generated_content TEXT NOT NULL,
    market_analysis_data JSONB,
    financial_projections JSONB,
    generation_prompt TEXT,
    model_used VARCHAR(50),
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_business_plans_entrepreneur ON business_plans(entrepreneur_id);

-- Tabla: RAG Documents (Fuentes de conocimiento)
CREATE TABLE IF NOT EXISTS rag_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    source_type VARCHAR(50),
    source_url VARCHAR(500),
    species_id UUID REFERENCES species(id),
    embedding_id VARCHAR(100),
    chunk_index INT DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rag_species ON rag_documents(species_id);

-- ===========================================
-- DATOS SEMILLA (Seeders)
-- ===========================================

-- Taxonomías iniciales de Caldas
INSERT INTO taxonomies (kingdom, phylum, class, "order", family, genus) VALUES
('Plantae', 'Tracheophyta', 'Liliopsida', 'Asparagales', 'Orchidaceae', 'Cattleya'),
('Plantae', 'Tracheophyta', 'Liliopsida', 'Asparagales', 'Orchidaceae', 'Masdevallia'),
('Plantae', 'Tracheophyta', 'Liliopsida', 'Asparagales', 'Orchidaceae', 'Dracula'),
('Plantae', 'Tracheophyta', 'Magnoliopsida', 'Gentianales', 'Rubiaceae', 'Coffea'),
('Plantae', 'Tracheophyta', 'Magnoliopsida', 'Laurales', 'Lauraceae', 'Persea'),
('Animalia', 'Chordata', 'Aves', 'Apodiformes', 'Trochilidae', 'Coeligena'),
('Animalia', 'Chordata', 'Aves', 'Passeriformes', 'Thraupidae', 'Tangara'),
('Animalia', 'Chordata', 'Mammalia', 'Primates', 'Atelidae', 'Alouatta'),
('Fungi', 'Basidiomycota', 'Agaricomycetes', 'Agaricales', 'Agaricaceae', 'Agaricus'),
('Fungi', 'Ascomycota', 'Sordariomycetes', 'Hypocreales', 'Cordycipitaceae', 'Cordyceps')
ON CONFLICT DO NOTHING;

-- Especies representativas de Caldas
INSERT INTO species (taxonomy_id, scientific_name, common_name, description, ecological_info, traditional_uses, conservation_status, is_sensitive) VALUES
(1, 'Cattleya trianae', 'Flor de Mayo', 'Orquídea epífita, flor nacional de Colombia', 'Bosque de niebla andino, 1500-2500 msnm', 'Ornamental, ceremonial', 'VU', true),
(2, 'Masdevallia coccinea', 'Banderita', 'Orquídea de flores rojas intensas', 'Bosque húmedo montano', 'Ornamental', 'NT', false),
(4, 'Coffea arabica', 'Café arábigo', 'Arbusto base del café colombiano', 'Zona cafetera, 1200-1800 msnm', 'Bebida, exportación', 'LC', false),
(6, 'Coeligena torquata', 'Inca collarejo', 'Colibrí de collar blanco', 'Bosque de niebla', 'Polinizador', 'LC', false),
(8, 'Alouatta seniculus', 'Mono aullador', 'Primate de pelaje rojizo', 'Bosque tropical', 'Dispersor de semillas', 'LC', true)
ON CONFLICT (scientific_name) DO NOTHING;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL initialization completed successfully!';
END $$;
