/**
 * Species cache repository — read/write the local SQLite mirror of the catalog.
 *
 * Catalog list items are upserted in bulk during an offline sync; full detail
 * (detail_json) and gallery images are written through whenever a species is
 * viewed online, so previously-seen species remain available offline.
 *
 * @module lib/db/species-cache
 */

import { getDb } from "@/lib/db/database";
import type {
    PaginatedResponse,
    SpeciesImage,
    SpeciesListItem,
    SpeciesResponse,
    SpeciesSearchParams,
} from "@/types";

interface SpeciesRow {
    id: string;
    slug: string | null;
    scientific_name: string | null;
    common_name: string | null;
    thumbnail_url: string | null;
    conservation_status: string | null;
    is_sensitive: number;
    kingdom: string | null;
    family: string | null;
    detail_json: string | null;
    updated_at: string | null;
}

function rowToListItem(row: SpeciesRow): SpeciesListItem {
    return {
        id: row.id,
        slug: row.slug ?? "",
        scientificName: row.scientific_name ?? "",
        commonName: row.common_name,
        thumbnailUrl: row.thumbnail_url,
        conservationStatus: row.conservation_status,
        isSensitive: row.is_sensitive === 1,
        kingdom: row.kingdom,
        family: row.family,
        createdAt: row.updated_at ?? new Date().toISOString(),
    };
}

/** Bulk-upsert lightweight catalog list items (preserves any cached detail_json). */
export async function upsertSpeciesListItems(
    items: SpeciesListItem[],
): Promise<void> {
    if (items.length === 0) return;
    const db = await getDb();
    const now = new Date().toISOString();

    await db.withTransactionAsync(async () => {
        for (const item of items) {
            await db.runAsync(
                `INSERT INTO species_cache
                 (id, slug, scientific_name, common_name, thumbnail_url,
                  conservation_status, is_sensitive, kingdom, family, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(id) DO UPDATE SET
                   slug = excluded.slug,
                   scientific_name = excluded.scientific_name,
                   common_name = excluded.common_name,
                   thumbnail_url = excluded.thumbnail_url,
                   conservation_status = excluded.conservation_status,
                   is_sensitive = excluded.is_sensitive,
                   kingdom = excluded.kingdom,
                   family = excluded.family,
                   updated_at = excluded.updated_at`,
                item.id,
                item.slug ?? null,
                item.scientificName ?? null,
                item.commonName ?? null,
                item.thumbnailUrl ?? null,
                item.conservationStatus ?? null,
                item.isSensitive ? 1 : 0,
                item.kingdom ?? null,
                item.family ?? null,
                now,
            );
        }
    });
}

/** Write-through full species detail (also keeps list columns current). */
export async function upsertSpeciesDetail(
    species: SpeciesResponse,
): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO species_cache
         (id, slug, scientific_name, common_name, thumbnail_url,
          conservation_status, is_sensitive, kingdom, family, detail_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           slug = excluded.slug,
           scientific_name = excluded.scientific_name,
           common_name = excluded.common_name,
           thumbnail_url = excluded.thumbnail_url,
           conservation_status = excluded.conservation_status,
           is_sensitive = excluded.is_sensitive,
           kingdom = excluded.kingdom,
           family = excluded.family,
           detail_json = excluded.detail_json,
           updated_at = excluded.updated_at`,
        species.id,
        species.slug ?? null,
        species.scientificName ?? null,
        species.commonName ?? null,
        species.thumbnailUrl ?? null,
        species.conservationStatus ?? null,
        species.isSensitive ? 1 : 0,
        species.taxonomy?.kingdom ?? null,
        species.taxonomy?.family ?? null,
        JSON.stringify(species),
        now,
    );
}

/** Read a paginated slice of the cached catalog with basic query/kingdom/family filters. */
export async function getCachedList(
    params: SpeciesSearchParams = {},
): Promise<PaginatedResponse<SpeciesListItem>> {
    const db = await getDb();
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 60;
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const args: (string | number)[] = [];

    if (params.query) {
        where.push(
            "(scientific_name LIKE ? OR common_name LIKE ? OR family LIKE ?)",
        );
        const like = `%${params.query}%`;
        args.push(like, like, like);
    }
    if (params.kingdom) {
        where.push("kingdom = ?");
        args.push(params.kingdom);
    }
    if (params.family) {
        where.push("family = ?");
        args.push(params.family);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const totalRow = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) AS count FROM species_cache ${whereSql}`,
        ...args,
    );
    const totalCount = totalRow?.count ?? 0;

    const rows = await db.getAllAsync<SpeciesRow>(
        `SELECT * FROM species_cache ${whereSql}
         ORDER BY scientific_name ASC
         LIMIT ? OFFSET ?`,
        ...args,
        pageSize,
        offset,
    );

    return {
        items: rows.map(rowToListItem),
        totalCount,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
        hasNextPage: offset + rows.length < totalCount,
        hasPreviousPage: page > 1,
    };
}

/** Read a cached full species detail, or null if never viewed online. */
export async function getCachedSpecies(
    id: string,
): Promise<SpeciesResponse | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<SpeciesRow>(
        "SELECT * FROM species_cache WHERE id = ?",
        id,
    );
    if (!row?.detail_json) return null;
    try {
        return JSON.parse(row.detail_json) as SpeciesResponse;
    } catch {
        return null;
    }
}

export async function countSpecies(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) AS count FROM species_cache",
    );
    return row?.count ?? 0;
}

/** Replace the cached image set for a species. */
export async function upsertSpeciesImages(
    speciesId: string,
    images: SpeciesImage[],
): Promise<void> {
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        await db.runAsync(
            "DELETE FROM species_image_cache WHERE species_id = ?",
            speciesId,
        );
        for (const img of images) {
            await db.runAsync(
                `INSERT OR REPLACE INTO species_image_cache
                 (id, species_id, image_url, thumbnail_url, is_primary,
                  is_validated, license_type, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                img.id,
                speciesId,
                img.imageUrl,
                img.thumbnailUrl ?? null,
                img.isPrimary ? 1 : 0,
                img.isValidatedByExpert ? 1 : 0,
                img.licenseType ?? null,
                img.createdAt ?? null,
            );
        }
    });
}

interface ImageRow {
    id: string;
    species_id: string;
    image_url: string;
    thumbnail_url: string | null;
    is_primary: number;
    is_validated: number;
    license_type: string | null;
    created_at: string | null;
}

export async function getCachedImages(
    speciesId: string,
): Promise<SpeciesImage[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<ImageRow>(
        "SELECT * FROM species_image_cache WHERE species_id = ? ORDER BY is_primary DESC",
        speciesId,
    );
    return rows.map((row) => ({
        id: row.id,
        speciesId: row.species_id,
        imageUrl: row.image_url,
        thumbnailUrl: row.thumbnail_url,
        isPrimary: row.is_primary === 1,
        isValidatedByExpert: row.is_validated === 1,
        licenseType: row.license_type ?? "",
        createdAt: row.created_at ?? "",
    }));
}
