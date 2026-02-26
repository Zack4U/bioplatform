/**
 * TypeScript types — Biodiversity Catalog (PostgreSQL)
 * Maps to: BioCommerce_Scientific database
 */

/** Taxonomy — mirrors taxonomies table (Postgres) */
export interface Taxonomy {
    id: number;
    kingdom: string;
    phylum: string | null;
    className: string | null;
    orderName: string | null;
    family: string | null;
    genus: string;
}

/** Species — mirrors species table (Postgres). Central catalog entity. */
export interface Species {
    id: string;
    taxonomyId: number;
    taxonomy?: Taxonomy;
    slug: string;
    scientificName: string;
    commonName: string | null;
    description: string | null;
    ecologicalInfo: string | null;
    traditionalUses: string | null;
    economicPotential: string | null;
    conservationStatus: string | null;
    isSensitive: boolean;
    thumbnailUrl: string | null;
    images?: SpeciesImage[];
    distributions?: GeographicDistribution[];
    createdAt: string;
    updatedAt?: string;
}

/** SpeciesImage — mirrors species_images table */
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

/** GeographicDistribution — mirrors geographic_distributions table (PostGIS) */
export interface GeographicDistribution {
    id: string;
    speciesId: string;
    municipality: string;
    /** Latitude — masked if species.isSensitive is true */
    latitude: number | null;
    /** Longitude — masked if species.isSensitive is true */
    longitude: number | null;
    altitude: number | null;
    ecosystemType: string | null;
}

/** SpeciesListItem — lightweight DTO for lists/cards (avoids over-fetching) */
export interface SpeciesListItem {
    id: string;
    slug: string;
    scientificName: string;
    commonName: string | null;
    family: string | null;
    kingdom: string;
    thumbnailUrl: string | null;
    isSensitive: boolean;
}

/** Species search/filter params */
export interface SpeciesSearchParams {
    query?: string;
    kingdom?: string;
    family?: string;
    municipality?: string;
    isSensitive?: boolean;
    page?: number;
    pageSize?: number;
    sortBy?: "scientificName" | "commonName" | "createdAt";
    sortOrder?: "asc" | "desc";
}
