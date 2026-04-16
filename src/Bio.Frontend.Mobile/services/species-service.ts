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
    PaginatedResponse,
    SpeciesFilterMeta,
    SpeciesListItem,
    SpeciesResponse,
    SpeciesSearchParams,
} from "@/types";

function toPaginatedSpecies(
    payload: unknown,
): PaginatedResponse<SpeciesListItem> {
    const empty: PaginatedResponse<SpeciesListItem> = {
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
        items: rawItems as SpeciesListItem[],
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

    return toPaginatedSpecies(data);
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
