/**
 * Species service — typed API calls for the Biodiversity Catalog.
 *
 * Maps to .NET SpeciesController endpoints.
 * Uses apiClient directly (backend returns DTOs, not ApiResponse wrappers).
 *
 * @module services/species-service
 */

import apiClient from "@/lib/axios-client";
import { CORE_ROUTES } from "@/services/routes";
import type {
    GeographicDistribution,
    PaginatedResponse,
    SpeciesFilterMeta,
    SpeciesImage,
    SpeciesImageSearchParams,
    SpeciesListItem,
    SpeciesResponse,
    SpeciesSearchParams,
} from "@/types";

/** Normalize any backend PaginatedResult<T> (camelCase or PascalCase) into PaginatedResponse<T>. */
function toPaginated<T>(payload: unknown): PaginatedResponse<T> {
    const empty: PaginatedResponse<T> = {
        items: [],
        totalCount: 0,
        page: 1,
        pageSize: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    };

    if (!payload || typeof payload !== "object") {
        return empty;
    }

    const obj = payload as Record<string, unknown>;
    const rawItems = obj.items ?? obj.Items;

    if (!Array.isArray(rawItems)) {
        return empty;
    }

    return {
        items: rawItems as T[],
        totalCount: Number(obj.totalCount ?? obj.TotalCount ?? rawItems.length),
        page: Number(obj.page ?? obj.Page ?? 1),
        pageSize: Number(obj.pageSize ?? obj.PageSize ?? rawItems.length),
        totalPages: Number(obj.totalPages ?? obj.TotalPages ?? 1),
        hasNextPage: Boolean(obj.hasNextPage ?? obj.HasNextPage ?? false),
        hasPreviousPage: Boolean(
            obj.hasPreviousPage ?? obj.HasPreviousPage ?? false,
        ),
    };
}

/** GET /api/species — paginated list with filters */
export async function getList(
    params: SpeciesSearchParams = {},
): Promise<PaginatedResponse<SpeciesListItem>> {
    const { data } = await apiClient.get<unknown>(CORE_ROUTES.SPECIES.BASE, {
        params,
    });

    return toPaginated<SpeciesListItem>(data);
}

/** Backward-compatible helper to fetch a full list for simple consumers. */
export async function getAll(
    params: SpeciesSearchParams = {},
): Promise<SpeciesListItem[]> {
    const page = await getList({ page: 1, pageSize: 500, ...params });
    return page.items;
}

/** GET /api/species/filter-meta — available filter values and total count */
export async function getFilterMeta(): Promise<SpeciesFilterMeta> {
    const { data } = await apiClient.get<SpeciesFilterMeta>(
        CORE_ROUTES.SPECIES.FILTER_META,
    );
    return data;
}

/** GET /api/species/{id} — fetch a single species by ID */
export async function getById(id: string): Promise<SpeciesResponse> {
    const { data } = await apiClient.get<SpeciesResponse>(
        CORE_ROUTES.SPECIES.BY_ID(id),
    );
    return data;
}

/** GET /api/species/slug/{slug} — fetch a single species by slug */
export async function getBySlug(slug: string): Promise<SpeciesResponse> {
    const { data } = await apiClient.get<SpeciesResponse>(
        CORE_ROUTES.SPECIES.BY_SLUG(slug),
    );
    return data;
}

// ─── Detail sub-resources ─────────────────────────────────────────────────────

/**
 * GET /api/species/{id}/distributions — geographic distribution points.
 * Coordinates are masked server-side for sensitive species when the caller
 * lacks a privileged role (latitude/longitude null + isMasked=true).
 */
export async function getSpeciesDistributions(
    id: string,
): Promise<GeographicDistribution[]> {
    const { data } = await apiClient.get<GeographicDistribution[]>(
        CORE_ROUTES.SPECIES.DISTRIBUTIONS(id),
    );
    return Array.isArray(data) ? data : [];
}

/**
 * GET /api/species/{id}/images — paginated species image gallery.
 * Defaults to expert-validated images only.
 */
export async function getSpeciesImages(
    id: string,
    params: SpeciesImageSearchParams = {},
): Promise<PaginatedResponse<SpeciesImage>> {
    const { data } = await apiClient.get<unknown>(CORE_ROUTES.SPECIES.IMAGES(id), {
        params,
    });
    return toPaginated<SpeciesImage>(data);
}

// ─── Contribute Observation ───────────────────────────────────────────────────

/**
 * POST /api/species/{id}/observations — upload a user observation image.
 * Sends the image file and all contextual metadata as multipart/form-data.
 * Requires a valid JWT (any authenticated user can contribute).
 */
export async function uploadSpeciesObservation(
    speciesId: string,
    formData: FormData,
): Promise<unknown> {
    const { data } = await apiClient.post(
        CORE_ROUTES.SPECIES.OBSERVATIONS(speciesId),
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
}
