/**
 * Mock species data — simulates backend API responses.
 * Used during frontend development before the .NET backend is connected.
 *
 * Data represents real biodiversity of Caldas, Colombia.
 * All UUIDs are deterministic for consistent rendering.
 */

import type { PaginatedResponse } from "@/types";
import type {
    Species,
    SpeciesListItem,
    SpeciesSearchParams,
} from "@/types/species";

/* ─── Full species records ──────────────────────────────────────────────── */

const MOCK_SPECIES: Species[] = [
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000001",
        taxonomyId: 1,
        taxonomy: {
            id: 1,
            kingdom: "Plantae",
            phylum: "Magnoliophyta",
            className: "Magnoliopsida",
            orderName: "Fagales",
            family: "Fagaceae",
            genus: "Quercus",
        },
        scientificName: "Quercus humboldtii",
        commonName: "Roble de tierra fría",
        description:
            "Árbol endémico de los Andes colombianos. Puede alcanzar hasta 25 metros de altura. Es una especie clave en los bosques de niebla andinos, proporcionando hábitat y alimento para una gran diversidad de fauna.",
        ecologicalInfo:
            "Bosque andino húmedo, 2000-3200 msnm. Especie indicadora de bosques bien conservados. Asociado con micorrizas ectomicorrícicas.",
        traditionalUses:
            "Madera para construcción, leña, carbón vegetal. Corteza utilizada en medicina tradicional para afecciones respiratorias.",
        isSensitive: false,
        economicPotential: "Madera sostenible y restauración ecológica",
        conservationStatus: "Vulnerable (VU)",
        slug: "roble-de-tierra-fria",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80",
        images: [
            {
                id: "img-001",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000001",
                uploaderUserId: "usr-001",
                imageUrl:
                    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-001",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000001",
                municipality: "Manizales",
                latitude: 5.067,
                longitude: -75.5174,
                altitude: 2800,
                ecosystemType: "Bosque andino húmedo",
            },
            {
                id: "dist-002",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000001",
                municipality: "Villamaría",
                latitude: 5.0456,
                longitude: -75.5139,
                altitude: 2600,
                ecosystemType: "Bosque andino húmedo",
            },
        ],
        createdAt: "2025-01-15T10:30:00Z",
        updatedAt: "2025-02-10T14:20:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000002",
        taxonomyId: 2,
        taxonomy: {
            id: 2,
            kingdom: "Plantae",
            phylum: "Magnoliophyta",
            className: "Liliopsida",
            orderName: "Arecales",
            family: "Arecaceae",
            genus: "Ceroxylon",
        },
        scientificName: "Ceroxylon quindiuense",
        commonName: "Palma de cera del Quindío",
        description:
            "Árbol nacional de Colombia y la palma más alta del mundo, alcanzando hasta 60 metros. Endémica de los valles interandinos entre 2000 y 3100 msnm. Especie en peligro de extinción.",
        ecologicalInfo:
            "Bosques de niebla andinos, entre 2000 y 3100 msnm. Especie longeva (puede vivir más de 100 años). Frutos consumidos por el loro orejiamarillo (Ognorhynchus icterotis).",
        traditionalUses:
            "Las hojas se usan en celebraciones religiosas de Semana Santa. La cera del tronco fue usada históricamente para fabricar velas.",
        isSensitive: true,
        economicPotential: "Ecoturismo y conservación",
        conservationStatus: "En Peligro (EN)",
        slug: "palma-de-cera-del-quindio",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=600&q=80",
        images: [
            {
                id: "img-002",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000002",
                uploaderUserId: "usr-002",
                imageUrl:
                    "https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-SA-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-003",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000002",
                municipality: "Salamina",
                latitude: null,
                longitude: null,
                altitude: 2500,
                ecosystemType: "Bosque de niebla",
            },
        ],
        createdAt: "2025-01-10T08:00:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000003",
        taxonomyId: 3,
        taxonomy: {
            id: 3,
            kingdom: "Animalia",
            phylum: "Chordata",
            className: "Aves",
            orderName: "Apodiformes",
            family: "Trochilidae",
            genus: "Coeligena",
        },
        scientificName: "Coeligena orina",
        commonName: "Inca dorado",
        description:
            "Colibrí endémico de los Andes colombianos, restringido a los páramos de Caldas y Antioquia. Es una de las aves más amenazadas de Colombia con una población estimada menor a 250 individuos.",
        ecologicalInfo:
            "Páramos y subpáramos entre 3200 y 3800 msnm. Polinizador especialista de Puya y Espeletia. Indicador de salud de ecosistemas de alta montaña.",
        traditionalUses:
            "Especie bandera para la conservación de páramos en Caldas. Sin usos tradicionales conocidos.",
        isSensitive: true,
        economicPotential: "Ecoturismo de avistamiento",
        conservationStatus: "En Peligro Crítico (CR)",
        slug: "inca-dorado",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1555169062-013468b47731?w=600&q=80",
        images: [
            {
                id: "img-003",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000003",
                uploaderUserId: "usr-001",
                imageUrl:
                    "https://images.unsplash.com/photo-1555169062-013468b47731?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-NC-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-004",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000003",
                municipality: "Manizales",
                latitude: null,
                longitude: null,
                altitude: 3500,
                ecosystemType: "Páramo",
            },
        ],
        createdAt: "2025-01-20T09:15:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000004",
        taxonomyId: 4,
        taxonomy: {
            id: 4,
            kingdom: "Fungi",
            phylum: "Basidiomycota",
            className: "Agaricomycetes",
            orderName: "Agaricales",
            family: "Agaricaceae",
            genus: "Agaricus",
        },
        scientificName: "Agaricus campestris",
        commonName: "Champiñón silvestre",
        description:
            "Hongo comestible común en praderas y pastizales de la zona cafetera de Caldas. Se encuentra frecuentemente en zonas abiertas con suelos ricos en materia orgánica.",
        ecologicalInfo:
            "Praderas y pastizales de 1500-2500 msnm. Saprotrofo, descompone materia orgánica del suelo. Fructifica especialmente durante temporada de lluvias.",
        traditionalUses:
            "Ampliamente recolectado para consumo alimentario. Potencial para cultivo comercial en la región cafetera.",
        isSensitive: false,
        economicPotential: "Alto potencial de cultivo comercial",
        conservationStatus: "Preocupación Menor (LC)",
        slug: "champinon-silvestre",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=600&q=80",
        images: [
            {
                id: "img-004",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000004",
                uploaderUserId: "usr-003",
                imageUrl:
                    "https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=600&q=80",
                metadata: null,
                isValidatedByExpert: false,
                usedForTraining: false,
                licenseType: "CC-BY-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-005",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000004",
                municipality: "Chinchiná",
                latitude: 4.9833,
                longitude: -75.6,
                altitude: 1800,
                ecosystemType: "Pradera de zona cafetera",
            },
        ],
        createdAt: "2025-02-01T11:45:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000005",
        taxonomyId: 5,
        taxonomy: {
            id: 5,
            kingdom: "Plantae",
            phylum: "Magnoliophyta",
            className: "Magnoliopsida",
            orderName: "Gentianales",
            family: "Rubiaceae",
            genus: "Coffea",
        },
        scientificName: "Coffea arabica",
        commonName: "Café arábica",
        description:
            "Especie base de la industria cafetera de Caldas. Cultivar predominante en la zona cafetera colombiana entre 1200 y 1800 msnm. Reconocido mundialmente por su calidad y perfil de taza.",
        ecologicalInfo:
            "Cultivado bajo sombra en sistemas agroforestales entre 1200-1800 msnm. Requiere suelos volcánicos bien drenados. Temperaturas entre 17-23°C.",
        traditionalUses:
            "Bebida estimulante. Base de la economía cafetera de Caldas. Pulpa utilizada como fertilizante. Cáscara para infusiones (té de café).",
        isSensitive: false,
        economicPotential: "Base de la economía cafetera regional",
        conservationStatus: "No Evaluado (NE)",
        slug: "cafe-arabica",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80",
        images: [
            {
                id: "img-005",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000005",
                uploaderUserId: "usr-002",
                imageUrl:
                    "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-006",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000005",
                municipality: "Chinchiná",
                latitude: 4.9833,
                longitude: -75.6,
                altitude: 1400,
                ecosystemType: "Zona cafetera",
            },
            {
                id: "dist-007",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000005",
                municipality: "Palestina",
                latitude: 5.0667,
                longitude: -75.6333,
                altitude: 1500,
                ecosystemType: "Zona cafetera",
            },
        ],
        createdAt: "2025-01-05T07:00:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000006",
        taxonomyId: 6,
        taxonomy: {
            id: 6,
            kingdom: "Animalia",
            phylum: "Chordata",
            className: "Aves",
            orderName: "Psittaciformes",
            family: "Psittacidae",
            genus: "Ognorhynchus",
        },
        scientificName: "Ognorhynchus icterotis",
        commonName: "Loro orejiamarillo",
        description:
            "Loro endémico de los Andes colombianos, en peligro crítico de extinción. Anida exclusivamente en palmas de cera. Población estimada en 1000-2000 individuos gracias a esfuerzos de conservación.",
        ecologicalInfo:
            "Bosques de palma de cera entre 1800 y 3000 msnm. Depende directamente de Ceroxylon quindiuense para anidación. Dispersor de semillas clave.",
        traditionalUses:
            "Históricamente capturado como mascota (práctica ahora ilegal). Especie bandera para programas de conservación comunitaria.",
        isSensitive: true,
        economicPotential: "Ecoturismo de avistamiento de aves",
        conservationStatus: "En Peligro (EN)",
        slug: "loro-orejiamarillo",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&q=80",
        images: [
            {
                id: "img-006",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000006",
                uploaderUserId: "usr-001",
                imageUrl:
                    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-NC-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-008",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000006",
                municipality: "Salamina",
                latitude: null,
                longitude: null,
                altitude: 2700,
                ecosystemType: "Bosque de palma de cera",
            },
        ],
        createdAt: "2025-01-18T13:30:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000007",
        taxonomyId: 7,
        taxonomy: {
            id: 7,
            kingdom: "Plantae",
            phylum: "Magnoliophyta",
            className: "Liliopsida",
            orderName: "Asparagales",
            family: "Orchidaceae",
            genus: "Cattleya",
        },
        scientificName: "Cattleya trianae",
        commonName: "Flor de mayo",
        description:
            "Flor nacional de Colombia. Orquídea epífita que se encuentra en los bosques húmedos de la vertiente occidental de la cordillera central. Flores grandes y vistosas de color lavanda con labelo púrpura.",
        ecologicalInfo:
            "Bosques húmedos montanos entre 1500-2500 msnm. Epífita sobre árboles de gran porte. Polinizada por abejas euglosinas.",
        traditionalUses:
            "Valor ornamental y cultural. Comercio de plantas cultivadas in vitro. Uso en arreglos florales tradicionales.",
        isSensitive: false,
        economicPotential: "Alto potencial ornamental y cosmético",
        conservationStatus: "Vulnerable (VU)",
        slug: "flor-de-mayo",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80",
        images: [
            {
                id: "img-007",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000007",
                uploaderUserId: "usr-003",
                imageUrl:
                    "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-009",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000007",
                municipality: "Neira",
                latitude: 5.1644,
                longitude: -75.5189,
                altitude: 2000,
                ecosystemType: "Bosque húmedo montano",
            },
        ],
        createdAt: "2025-01-22T10:00:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000008",
        taxonomyId: 8,
        taxonomy: {
            id: 8,
            kingdom: "Animalia",
            phylum: "Chordata",
            className: "Mammalia",
            orderName: "Carnivora",
            family: "Ursidae",
            genus: "Tremarctos",
        },
        scientificName: "Tremarctos ornatus",
        commonName: "Oso de anteojos",
        description:
            "Único oso de Sudamérica. Habita los bosques de niebla y páramos de la cordillera central. Especie paraguas cuya conservación protege ecosistemas enteros. Población en Caldas estimada en 50-100 individuos.",
        ecologicalInfo:
            "Bosques de niebla y páramos entre 1800 y 4000 msnm. Dispersor de semillas a gran escala. Territorio individual de 5-25 km². Omnívoro con preferencia por bromelias y frutos.",
        traditionalUses:
            "Considerado sagrado por comunidades indígenas. Sin uso comercial legal. Especie emblemática del ecoturismo en Caldas.",
        isSensitive: true,
        economicPotential: "Ecoturismo especializado",
        conservationStatus: "Vulnerable (VU)",
        slug: "oso-de-anteojos",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=600&q=80",
        images: [
            {
                id: "img-008",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000008",
                uploaderUserId: "usr-002",
                imageUrl:
                    "https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-NC-SA-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-010",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000008",
                municipality: "Manizales",
                latitude: null,
                longitude: null,
                altitude: 3200,
                ecosystemType: "Bosque de niebla",
            },
            {
                id: "dist-011",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000008",
                municipality: "Villamaría",
                latitude: null,
                longitude: null,
                altitude: 3500,
                ecosystemType: "Páramo",
            },
        ],
        createdAt: "2025-02-05T16:00:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000009",
        taxonomyId: 9,
        taxonomy: {
            id: 9,
            kingdom: "Plantae",
            phylum: "Magnoliophyta",
            className: "Magnoliopsida",
            orderName: "Laurales",
            family: "Lauraceae",
            genus: "Ocotea",
        },
        scientificName: "Ocotea calophylla",
        commonName: "Laurel de cera",
        description:
            "Árbol nativo de los bosques andinos de Caldas. Alcanza hasta 20 metros de altura. Hojas coriáceas con aroma agradable al frotarlas. Madera de alto valor comercial.",
        ecologicalInfo:
            "Bosques montanos entre 2000 y 3000 msnm. Produce frutos que alimentan aves como tucanes y pavas. Suele crecer en asociación con robles.",
        traditionalUses:
            "Madera para ebanistería y construcción. Hojas usadas en medicina tradicional como antiinflamatorio. Se extrae aceite esencial aromático.",
        isSensitive: false,
        economicPotential: "Aceites esenciales y ebanistería sostenible",
        conservationStatus: "Casi Amenazado (NT)",
        slug: "laurel-de-cera",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&q=80",
        images: [
            {
                id: "img-009",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000009",
                uploaderUserId: "usr-001",
                imageUrl:
                    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&q=80",
                metadata: null,
                isValidatedByExpert: false,
                usedForTraining: false,
                licenseType: "CC-BY-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-012",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000009",
                municipality: "Manizales",
                latitude: 5.0689,
                longitude: -75.5174,
                altitude: 2400,
                ecosystemType: "Bosque montano",
            },
        ],
        createdAt: "2025-02-08T12:30:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000010",
        taxonomyId: 10,
        taxonomy: {
            id: 10,
            kingdom: "Fungi",
            phylum: "Basidiomycota",
            className: "Agaricomycetes",
            orderName: "Polyporales",
            family: "Ganodermataceae",
            genus: "Ganoderma",
        },
        scientificName: "Ganoderma australe",
        commonName: "Hongo oreja de palo",
        description:
            "Hongo leñoso perenne que crece sobre troncos de árboles vivos y muertos. Cuerpo fructífero semicircular, leñoso, con superficie superior marrón a grisácea. Puede vivir varios años.",
        ecologicalInfo:
            "Bosques húmedos de 1000-2800 msnm. Saprofito y parásito débil. Importante descomponedor de madera muerta. Indicador de madurez del bosque.",
        traditionalUses:
            "Usado en medicina tradicional oriental como tónico. Potencial biotecnológico en producción de enzimas lignocelulolíticas. Objeto de bioprospección.",
        isSensitive: false,
        economicPotential: "Biotecnología y medicina funcional",
        conservationStatus: "No Evaluado (NE)",
        slug: "hongo-oreja-de-palo",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1611854543671-3c36a3ce1f88?w=600&q=80",
        images: [
            {
                id: "img-010",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000010",
                uploaderUserId: "usr-003",
                imageUrl:
                    "https://images.unsplash.com/photo-1611854543671-3c36a3ce1f88?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-013",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000010",
                municipality: "Risaralda",
                latitude: 5.15,
                longitude: -75.75,
                altitude: 1600,
                ecosystemType: "Bosque húmedo premontano",
            },
        ],
        createdAt: "2025-02-12T09:00:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000011",
        taxonomyId: 11,
        taxonomy: {
            id: 11,
            kingdom: "Animalia",
            phylum: "Chordata",
            className: "Amphibia",
            orderName: "Anura",
            family: "Dendrobatidae",
            genus: "Andinobates",
        },
        scientificName: "Andinobates bombetes",
        commonName: "Rana venenosa del Cauca",
        description:
            "Rana venenosa pequeña (15-18mm) endémica de la cordillera central colombiana. Coloración aposemática roja brillante con patas negras. Secreta alcaloides tóxicos como defensa.",
        ecologicalInfo:
            "Bosques húmedos premontanos entre 1000 y 2000 msnm. Diurna y terrestre. Deposita huevos en hojarasca húmeda. Controlador biológico de insectos.",
        traditionalUses:
            "Potencial farmacológico de sus toxinas alcaloides. Especie de interés para bioprospección de analgésicos naturales.",
        isSensitive: true,
        economicPotential: "Bioprospección farmacológica",
        conservationStatus: "En Peligro (EN)",
        slug: "rana-venenosa-del-cauca",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=600&q=80",
        images: [
            {
                id: "img-011",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000011",
                uploaderUserId: "usr-001",
                imageUrl:
                    "https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-NC-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-014",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000011",
                municipality: "Victoria",
                latitude: null,
                longitude: null,
                altitude: 1500,
                ecosystemType: "Bosque húmedo premontano",
            },
        ],
        createdAt: "2025-02-15T14:00:00Z",
    },
    {
        id: "a1b2c3d4-1111-4444-aaaa-000000000012",
        taxonomyId: 12,
        taxonomy: {
            id: 12,
            kingdom: "Plantae",
            phylum: "Magnoliophyta",
            className: "Magnoliopsida",
            orderName: "Malpighiales",
            family: "Passifloraceae",
            genus: "Passiflora",
        },
        scientificName: "Passiflora ligularis",
        commonName: "Granadilla",
        description:
            "Enredadera frutal nativa de los Andes. Fruto ovoide de cáscara dura, pulpa gelatinosa dulce con semillas negras. Ampliamente cultivada en Caldas como cultivo comercial alternativo al café.",
        ecologicalInfo:
            "Cultivada entre 1500 y 2500 msnm. Requiere tutores o espalderas. Flores atractivas para polinizadores. Ciclo productivo de 8-10 meses.",
        traditionalUses:
            "Consumo fresco, jugos, postres. Uso medicinal como sedante natural y para aliviar problemas digestivos. Potencial de exportación.",
        isSensitive: false,
        economicPotential: "Cultivo frutal de exportación",
        conservationStatus: "Preocupación Menor (LC)",
        slug: "granadilla",
        thumbnailUrl:
            "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=600&q=80",
        images: [
            {
                id: "img-012",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000012",
                uploaderUserId: "usr-002",
                imageUrl:
                    "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=600&q=80",
                metadata: null,
                isValidatedByExpert: true,
                usedForTraining: true,
                licenseType: "CC-BY-4.0",
            },
        ],
        distributions: [
            {
                id: "dist-015",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000012",
                municipality: "Manizales",
                latitude: 5.067,
                longitude: -75.5174,
                altitude: 2100,
                ecosystemType: "Bosque andino húmedo",
            },
            {
                id: "dist-016",
                speciesId: "a1b2c3d4-1111-4444-aaaa-000000000012",
                municipality: "Neira",
                latitude: 5.1644,
                longitude: -75.5189,
                altitude: 1900,
                ecosystemType: "Bosque húmedo montano",
            },
        ],
        createdAt: "2025-01-28T08:00:00Z",
    },
];

/* ─── Helper: slugify ───────────────────────────────────────────────────── */

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

/* ─── Helper: convert full Species → SpeciesListItem ────────────────────── */

function toListItem(species: Species): SpeciesListItem {
    return {
        id: species.id,
        slug: species.slug,
        scientificName: species.scientificName,
        commonName: species.commonName,
        family: species.taxonomy?.family ?? null,
        kingdom: species.taxonomy?.kingdom ?? "Desconocido",
        thumbnailUrl: species.thumbnailUrl,
        isSensitive: species.isSensitive,
    };
}

/* ─── Available filter options (derived from data) ──────────────────────── */

export const MOCK_KINGDOMS = [
    ...new Set(MOCK_SPECIES.map((s) => s.taxonomy?.kingdom ?? "")),
].filter(Boolean);

export const MOCK_FAMILIES = [
    ...new Set(MOCK_SPECIES.map((s) => s.taxonomy?.family ?? "")),
].filter(Boolean);

export const MOCK_MUNICIPALITIES = [
    ...new Set(
        MOCK_SPECIES.flatMap(
            (s) => s.distributions?.map((d) => d.municipality) ?? [],
        ),
    ),
].filter(Boolean);

/* ─── Simulated API functions ───────────────────────────────────────────── */

/** Simulates network latency */
function delay(ms = 600): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates GET /api/species (paginated list with filters).
 * Mimics backend behavior including search, filter, sort, and pagination.
 */
export async function fetchSpeciesList(
    params: SpeciesSearchParams = {},
): Promise<PaginatedResponse<SpeciesListItem>> {
    await delay(Math.random() * 400 + 300); // 300-700ms

    const {
        query,
        kingdom,
        family,
        municipality,
        isSensitive,
        page = 1,
        pageSize = 12,
        sortBy = "scientificName",
        sortOrder = "asc",
    } = params;

    let filtered = [...MOCK_SPECIES];

    // Text search
    if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(
            (s) =>
                s.scientificName.toLowerCase().includes(q) ||
                s.commonName?.toLowerCase().includes(q) ||
                s.description?.toLowerCase().includes(q) ||
                s.taxonomy?.family?.toLowerCase().includes(q) ||
                s.taxonomy?.genus?.toLowerCase().includes(q),
        );
    }

    // Kingdom filter
    if (kingdom) {
        filtered = filtered.filter((s) => s.taxonomy?.kingdom === kingdom);
    }

    // Family filter
    if (family) {
        filtered = filtered.filter((s) => s.taxonomy?.family === family);
    }

    // Municipality filter
    if (municipality) {
        filtered = filtered.filter((s) =>
            s.distributions?.some((d) => d.municipality === municipality),
        );
    }

    // Sensitivity filter
    if (isSensitive !== undefined) {
        filtered = filtered.filter((s) => s.isSensitive === isSensitive);
    }

    // Sort
    filtered.sort((a, b) => {
        let cmp = 0;
        if (sortBy === "scientificName") {
            cmp = a.scientificName.localeCompare(b.scientificName);
        } else if (sortBy === "commonName") {
            cmp = (a.commonName ?? "").localeCompare(b.commonName ?? "");
        } else if (sortBy === "createdAt") {
            cmp =
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime();
        }
        return sortOrder === "desc" ? -cmp : cmp;
    });

    // Pagination
    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize).map(toListItem);

    return {
        items,
        totalCount,
        page: safePage,
        pageSize,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPreviousPage: safePage > 1,
    };
}

/**
 * Simulates GET /api/species/:id (single species detail).
 */
export async function fetchSpeciesById(id: string): Promise<Species | null> {
    await delay(Math.random() * 300 + 200);
    return MOCK_SPECIES.find((s) => s.id === id) ?? null;
}

/**
 * Simulates GET /api/species/by-slug/:slug (single species detail by slug).
 */
export async function fetchSpeciesBySlug(
    slug: string,
): Promise<Species | null> {
    await delay(Math.random() * 300 + 200);
    return (
        MOCK_SPECIES.find((s) => {
            return s.slug === slug;
        }) ?? null
    );
}
