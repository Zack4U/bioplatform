/**
 * Mock data for BioCommerce Caldas Mobile — development/demo fallback.
 *
 * Contains realistic biodiversity data for Caldas, Colombia.
 * Used when the backend is unavailable or during UI development.
 * Each mock mirrors the exact types from @/types so the switch to real API is seamless.
 */

import type {
    ClassifyImageResponse,
    PredictionResult,
    Species,
    SpeciesListItem,
    User,
} from "@/types";

// ─── Mock Species (Catalog) ──────────────────────────────────────────────────

export const MOCK_SPECIES: SpeciesListItem[] = [
    {
        id: "sp-001",
        slug: "quercus-humboldtii",
        scientificName: "Quercus humboldtii",
        commonName: "Roble de tierra fría",
        family: "Fagaceae",
        kingdom: "Plantae",
        thumbnailUrl: null,
        isSensitive: false,
    },
    {
        id: "sp-002",
        slug: "ceroxylon-quindiuense",
        scientificName: "Ceroxylon quindiuense",
        commonName: "Palma de cera del Quindío",
        family: "Arecaceae",
        kingdom: "Plantae",
        thumbnailUrl: null,
        isSensitive: true,
    },
    {
        id: "sp-003",
        slug: "cattleya-trianae",
        scientificName: "Cattleya trianae",
        commonName: "Flor de mayo",
        family: "Orchidaceae",
        kingdom: "Plantae",
        thumbnailUrl: null,
        isSensitive: false,
    },
    {
        id: "sp-004",
        slug: "tremarctos-ornatus",
        scientificName: "Tremarctos ornatus",
        commonName: "Oso de anteojos",
        family: "Ursidae",
        kingdom: "Animalia",
        thumbnailUrl: null,
        isSensitive: true,
    },
    {
        id: "sp-005",
        slug: "andigena-nigrirostris",
        scientificName: "Andigena nigrirostris",
        commonName: "Tucán andino piquinegro",
        family: "Ramphastidae",
        kingdom: "Animalia",
        thumbnailUrl: null,
        isSensitive: false,
    },
    {
        id: "sp-006",
        slug: "ganoderma-australe",
        scientificName: "Ganoderma australe",
        commonName: "Hongo oreja de palo",
        family: "Ganodermataceae",
        kingdom: "Fungi",
        thumbnailUrl: null,
        isSensitive: false,
    },
    {
        id: "sp-007",
        slug: "espeletia-hartwegiana",
        scientificName: "Espeletia hartwegiana",
        commonName: "Frailejón",
        family: "Asteraceae",
        kingdom: "Plantae",
        thumbnailUrl: null,
        isSensitive: false,
    },
    {
        id: "sp-008",
        slug: "hapalopsittaca-fuertesi",
        scientificName: "Hapalopsittaca fuertesi",
        commonName: "Loro multicolor",
        family: "Psittacidae",
        kingdom: "Animalia",
        thumbnailUrl: null,
        isSensitive: true,
    },
];

export const MOCK_SPECIES_DETAIL: Species = {
    id: "sp-001",
    taxonomyId: 1,
    taxonomy: {
        id: 1,
        kingdom: "Plantae",
        phylum: "Tracheophyta",
        className: "Magnoliopsida",
        orderName: "Fagales",
        family: "Fagaceae",
        genus: "Quercus",
    },
    slug: "quercus-humboldtii",
    scientificName: "Quercus humboldtii",
    commonName: "Roble de tierra fría",
    description:
        "Árbol nativo de los bosques andinos de Colombia, Ecuador y Panamá. Puede alcanzar alturas de 25 a 30 metros. Es la única especie de roble nativa de Colombia y tiene una gran importancia ecológica como especie fundadora de bosques de niebla.",
    ecologicalInfo:
        "Especie clave en los ecosistemas de bosque de niebla andino. Proporciona hábitat y alimento para numerosas especies de aves, insectos y mamíferos.",
    traditionalUses:
        "Madera utilizada históricamente en construcción y ebanistería. Corteza empleada en medicina tradicional como astringente.",
    economicPotential:
        "Alto potencial para reforestación sostenible, producción de madera certificada y turismo ecológico.",
    conservationStatus: "Vulnerable",
    isSensitive: false,
    thumbnailUrl: null,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-06-20T14:15:00Z",
    images: [],
    distributions: [
        {
            id: "dist-001",
            speciesId: "sp-001",
            municipality: "Manizales",
            latitude: 5.067,
            longitude: -75.517,
            altitude: 2150,
            ecosystemType: "Bosque de niebla",
        },
        {
            id: "dist-002",
            speciesId: "sp-001",
            municipality: "Villamaría",
            latitude: 5.044,
            longitude: -75.511,
            altitude: 2300,
            ecosystemType: "Bosque alto andino",
        },
    ],
};

// ─── Mock CNN Prediction ─────────────────────────────────────────────────────

export const MOCK_PREDICTIONS: PredictionResult[] = [
    { class: "Quercus humboldtii", speciesId: "sp-001", probability: 0.92 },
    { class: "Ceroxylon quindiuense", speciesId: "sp-002", probability: 0.05 },
    { class: "Espeletia hartwegiana", speciesId: "sp-007", probability: 0.02 },
];

export const MOCK_CLASSIFICATION_RESPONSE: ClassifyImageResponse = {
    predictions: MOCK_PREDICTIONS,
    topPrediction: {
        speciesId: "sp-001",
        scientificName: "Quercus humboldtii",
        commonName: "Roble de tierra fría",
        confidence: 0.92,
    },
    processingTimeMs: 1250,
};

// ─── Mock User ───────────────────────────────────────────────────────────────

export const MOCK_USER: User = {
    id: "usr-001",
    email: "investigador@ucaldas.edu.co",
    fullName: "Dr. Carlos Mejía",
    phoneNumber: "+57 310 555 1234",
    isVerified: true,
    isActive: true,
    roles: [{ id: 2, name: "Researcher", description: "Investigador" }],
    createdAt: "2024-01-10T08:00:00Z",
};

// ─── Mock Stats ──────────────────────────────────────────────────────────────

export const MOCK_STATS = {
    totalSpecies: 347,
    totalIdentifications: 1284,
    totalUsers: 89,
    modelAccuracy: 87.3,
};

// ─── Recent Identifications (for Camera history) ─────────────────────────────

export interface RecentIdentification {
    id: string;
    speciesName: string;
    commonName: string | null;
    confidence: number;
    imageUri: string | null;
    timestamp: string;
}

export const MOCK_RECENT_IDENTIFICATIONS: RecentIdentification[] = [
    {
        id: "pred-001",
        speciesName: "Quercus humboldtii",
        commonName: "Roble de tierra fría",
        confidence: 0.92,
        imageUri: null,
        timestamp: "2026-03-14T15:30:00Z",
    },
    {
        id: "pred-002",
        speciesName: "Cattleya trianae",
        commonName: "Flor de mayo",
        confidence: 0.88,
        imageUri: null,
        timestamp: "2026-03-14T14:15:00Z",
    },
    {
        id: "pred-003",
        speciesName: "Espeletia hartwegiana",
        commonName: "Frailejón",
        confidence: 0.76,
        imageUri: null,
        timestamp: "2026-03-13T09:45:00Z",
    },
];
