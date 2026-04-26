/**
 * Species service — typed API calls for the Biodiversity Catalog.
 *
 * All functions map 1:1 to the .NET SpeciesController endpoints.
 * Uses centralized route constants and the shared Axios client.
 *
 * @module services/species-service
 */

import apiClient from "@/lib/axios";
import { CORE_ROUTES } from "@/services/routes";
import type { PaginatedResponse } from "@/types";
import type {
    GeographicDistribution,
    SpeciesDetail,
    SpeciesFilterMeta,
    SpeciesImage,
    SpeciesImageSearchParams,
    SpeciesListItem,
    SpeciesSearchParams,
} from "@/types/species";

// ─── List / Catalog ──────────────────────────────────────────────────────────

/**
 * GET /api/species — paginated list with filters and sorting.
 * Backend returns PaginatedResult<SpeciesListItemDTO> directly.
 */
export async function getSpeciesList(
    params: SpeciesSearchParams = {},
): Promise<PaginatedResponse<SpeciesListItem>> {
    const { data } = await apiClient.get<PaginatedResponse<SpeciesListItem>>(
        CORE_ROUTES.SPECIES.BASE,
        { params },
    );
    return data;
}

// ─── Detail ──────────────────────────────────────────────────────────────────

/**
 * GET /api/species/{id} — full species detail including
 * taxonomy, distributions (protected), and related products.
 */
export async function getSpeciesById(id: string): Promise<SpeciesDetail> {
    const { data } = await apiClient.get<SpeciesDetail>(
        CORE_ROUTES.SPECIES.BY_ID(id),
    );
    return data;
}

/**
 * GET /api/species/slug/{slug} — full species detail by slug.
 */
export async function getSpeciesBySlug(slug: string): Promise<SpeciesDetail> {
    const { data } = await apiClient.get<SpeciesDetail>(
        CORE_ROUTES.SPECIES.BY_SLUG(slug),
    );
    return data;
}

// ─── Distributions ───────────────────────────────────────────────────────────

/**
 * GET /api/species/{id}/distributions — geographic distribution points.
 * Coordinates are masked for sensitive species if user lacks privileged role.
 */
export async function getSpeciesDistributions(
    speciesId: string,
): Promise<GeographicDistribution[]> {
    const { data } = await apiClient.get<GeographicDistribution[]>(
        CORE_ROUTES.SPECIES.DISTRIBUTIONS(speciesId),
    );
    return data;
}

// ─── Filter Metadata ───────────────────────────────────────────────────────────

/**
 * GET /api/species/filter-meta — distinct values for catalog filter dropdowns.
 * Returns kingdoms, phylums, families, genera, conservation statuses, and total count.
 */
export async function getSpeciesFilterMeta(): Promise<SpeciesFilterMeta> {
    const { data } = await apiClient.get<SpeciesFilterMeta>(
        CORE_ROUTES.SPECIES.FILTER_META,
    );
    return data;
}

// ─── Gallery Images ───────────────────────────────────────────────────────────────────

/**
 * GET /api/species/{id}/images — paginated images with optional expert-validation filter.
 * Used by the species detail gallery with infinite scroll.
 */
export async function getSpeciesImages(
    speciesId: string,
    params: SpeciesImageSearchParams = {},
): Promise<PaginatedResponse<SpeciesImage>> {
    const { data } = await apiClient.get<PaginatedResponse<SpeciesImage>>(
        CORE_ROUTES.SPECIES.IMAGES(speciesId),
        { params },
    );
    return data;
}

// ─── Contribute Observation ───────────────────────────────────────────────────

/**
 * POST /api/species/{id}/observations — upload a user observation image.
 * Sends the file and all contextual metadata as multipart/form-data.
 * Requires a valid JWT (any authenticated user can contribute).
 */
export async function uploadSpeciesObservation(
    speciesId: string,
    formData: FormData,
): Promise<SpeciesImage> {
    const { data } = await apiClient.post<SpeciesImage>(
        CORE_ROUTES.SPECIES.OBSERVATIONS(speciesId),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
}
