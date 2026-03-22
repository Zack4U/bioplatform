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
} from "@/types";

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
        commonName: "Roble de tierra fria",
        confidence: 0.92,
    },
    processingTimeMs: 1250,
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
        commonName: "Roble de tierra fria",
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
        commonName: "Frailejon",
        confidence: 0.76,
        imageUri: null,
        timestamp: "2026-03-13T09:45:00Z",
    },
];
