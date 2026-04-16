/**
 * TypeScript types — Biodiversity Catalog.
 * Maps to .NET Backend DTOs (Bio.Application.DTOs).
 *
 * Naming: camelCase (TypeScript) ↔ PascalCase (C#).
 */

// ─── Taxonomy ────────────────────────────────────────────────────────────────

/** Maps to TaxonomyResponseDTO */
export interface TaxonomyResponse {
    id: number;
    kingdom: string | null;
    phylum: string | null;
    className: string | null;
    orderName: string | null;
    family: string | null;
    genus: string | null;
}

// ─── Species ─────────────────────────────────────────────────────────────────

/** Maps to SpeciesResponseDTO */
export interface SpeciesResponse {
    id: string;
    taxonomyId: number | null;
    taxonomy: TaxonomyResponse | null;
    slug: string;
    thumbnailUrl: string | null;
    scientificName: string;
    commonName: string | null;
    description: string | null;
    ecologicalInfo: string | null;
    traditionalUses: string | null;
    economicPotential: string | null;
    conservationStatus: string | null;
    altitudeRange: string | null;
    legalStatus: boolean;
    isSensitive: boolean;
    createdAt: string;
    updatedAt: string;
}

/** Maps to SpeciesListItemDTO (paginated catalog list) */
export interface SpeciesListItem {
    id: string;
    slug: string;
    scientificName: string;
    commonName: string | null;
    thumbnailUrl: string | null;
    conservationStatus: string | null;
    isSensitive: boolean;
    kingdom: string | null;
    family: string | null;
    createdAt: string;
}

/** Maps to SpeciesFilterParams */
export interface SpeciesSearchParams {
    query?: string;
    kingdom?: string;
    phylum?: string;
    className?: string;
    orderName?: string;
    family?: string;
    genus?: string;
    isSensitive?: boolean;
    conservationStatus?: string;
    page?: number;
    pageSize?: number;
    sortBy?: "scientificName" | "commonName" | "createdAt";
    sortOrder?: "asc" | "desc";
}

/** Maps to SpeciesFilterMetaDTO */
export interface SpeciesFilterMeta {
    kingdoms: string[];
    phylums: string[];
    classes: string[];
    orders: string[];
    families: string[];
    genera: string[];
    conservationStatuses: string[];
    totalSpeciesCount: number;
}

// ─── Geographic Distribution ─────────────────────────────────────────────────

/** Maps to GeographicDistribution entity (no DTO yet — future endpoint) */
export interface GeographicDistribution {
    id: string;
    speciesId: string;
    latitude: number;
    longitude: number;
    altitude: number | null;
    municipality: string | null;
    ecosystemType: string | null;
}

// ─── Species Images ──────────────────────────────────────────────────────────

/** Maps to SpeciesImage entity (no DTO yet — future endpoint) */
export interface SpeciesImage {
    id: string;
    speciesId: string;
    uploaderUserId: string;
    imageUrl: string;
    metadata: Record<string, unknown> | null;
    isValidatedByExpert: boolean;
    usedForTraining: boolean;
    licenseType: string;
}
