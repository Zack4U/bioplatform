/**
 * TypeScript types — Biodiversity Catalog (PostgreSQL)
 * Maps to: BioCommerce_Scientific database
 * Aligned with backend DTOs: SpeciesResponseDTO, SpeciesDetailDTO,
 * SpeciesListItemDTO, GeographicDistributionDTO, TaxonomyResponseDTO.
 */

/** TaxonomyResponse — mirrors TaxonomyResponseDTO */
export interface TaxonomyResponse {
    id: number;
    kingdom: string | null;
    phylum: string | null;
    className: string | null;
    orderName: string | null;
    family: string | null;
    genus: string | null;
}

/** SpeciesResponse — mirrors SpeciesResponseDTO (flat, no distributions) */
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

/** GeographicDistributionDTO — mirrors backend GeographicDistributionDTO */
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

/** RelatedProductDTO — lightweight product linked to a species via BaseSpeciesId */
export interface RelatedProduct {
    id: string;
    name: string;
    slug: string | null;
    description: string;
    price: number;
    stockQuantity: number;
    thumbnailUrl: string | null;
    isActive: boolean;
}

/** SpeciesDetailDTO — full detail response from GET /api/species/{id} or /slug/{slug} */
export interface SpeciesDetail {
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
    updatedAt: string | null;
    distributions: GeographicDistribution[];
    relatedProducts: RelatedProduct[];
}

/** SpeciesListItemDTO — lightweight DTO for catalog grid/list */
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

/** Species search/filter params — mirrors backend SpeciesFilterParams */
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

/** SpeciesFilterMetaDTO — distinct filter values from backend */
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
