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

/** Maps to SpeciesEconomicPotentialDTO */
export interface SpeciesEconomicPotential {
    id: string;
    speciesId: string;
    sector: string;
    products: string[];
    activeProperties: string[] | null;
    description: string | null;
    marketValue: string | null;
    sustainabilityLevel: string | null;
    confidence: string | null;
    createdAt: string;
}

/** Maps to SpeciesTraditionalUseDTO */
export interface SpeciesTraditionalUse {
    id: string;
    speciesId: string;
    part: string;
    category: string[];
    specificPurpose: string | null;
    preparationMethod: string | null;
    description: string | null;
    community: string | null;
    traditionalWarnings: string | null;
    confidence: string | null;
    createdAt: string;
}

/**
 * Maps to SpeciesDetailDTO — the actual payload of GET /api/species/{id}
 * and /export. economicPotentials and traditionalUses are ARRAYS (not strings).
 */
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
    economicPotentials: SpeciesEconomicPotential[];
    traditionalUses: SpeciesTraditionalUse[];
    conservationStatus: string | null;
    altitudeRange: string | null;
    legalStatus: boolean;
    isSensitive: boolean;
    createdAt: string;
    updatedAt: string | null;
    distributions?: GeographicDistribution[];
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

/** Maps to GeographicDistributionDTO — GET /api/species/{id}/distributions */
export interface GeographicDistribution {
    id: string;
    speciesId: string;
    /** Latitude — null if species.isSensitive and user lacks privileged role */
    latitude: number | null;
    /** Longitude — null if species.isSensitive and user lacks privileged role */
    longitude: number | null;
    altitude: number | null;
    municipality: string | null;
    ecosystemType: string | null;
    /** True if coordinates were masked for bio-safety protection */
    isMasked: boolean;
}

// ─── Species Images ──────────────────────────────────────────────────────────

/** Maps to SpeciesImageDTO — GET /api/species/{id}/images */
export interface SpeciesImage {
    id: string;
    speciesId: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    isPrimary: boolean;
    isValidatedByExpert: boolean;
    licenseType: string;
    createdAt: string;
}

/** Query params for the species images endpoint */
export interface SpeciesImageSearchParams {
    onlyValidatedByExpert?: boolean;
    page?: number;
    pageSize?: number;
}
