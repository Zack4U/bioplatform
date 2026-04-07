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
import type { SpeciesResponse } from "@/types";

/** GET /api/species — list species with optional pagination */
export async function getAll(
    skip?: number,
    take?: number,
): Promise<SpeciesResponse[]> {
    const { data } = await apiClient.get<SpeciesResponse[]>(
        CORE_ROUTES.SPECIES.BASE,
        { params: { skip, take } },
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
