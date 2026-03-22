/**
 * Mock data for BioCommerce Caldas Mobile — development/demo fallback.
 *
 * Contains realistic biodiversity data for Caldas, Colombia.
 * Used when the backend is unavailable or during UI development.
 */


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
