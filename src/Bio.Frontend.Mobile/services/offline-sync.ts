/**
 * Offline sync service — orchestrates catalog download and upload-queue flush.
 *
 * - downloadCatalog: pages the species list into the SQLite cache.
 * - flushObservationQueue: re-sends queued offline contributions; drops entries
 *   the server rejects (4xx) and stops on the first network error so it can
 *   retry later.
 * - syncAll: flush the queue, then (when offline mode is enabled) refresh the
 *   catalog cache.
 *
 * @module services/offline-sync
 */

import { upsertSpeciesListItems } from "@/lib/db/species-cache";
import {
    getPendingObservations,
    removeObservation,
    type PendingObservation,
} from "@/lib/db/observation-queue";
import * as speciesService from "@/services/species-service";
import { isAxiosError } from "axios";
import * as Device from "expo-device";

const CATALOG_PAGE_SIZE = 100;
const MAX_CATALOG_PAGES = 100; // hard safety cap (10k species)

export interface FlushResult {
    sent: number;
    dropped: number;
    /** True if a network error interrupted the flush (entries remain queued). */
    interrupted: boolean;
}

function getDeviceTypeName(): string {
    switch (Device.deviceType) {
        case Device.DeviceType.PHONE:
            return "smartphone";
        case Device.DeviceType.TABLET:
            return "tablet";
        case Device.DeviceType.TV:
            return "tv";
        case Device.DeviceType.DESKTOP:
            return "desktop";
        default:
            return "unknown";
    }
}

function buildObservationFormData(obs: PendingObservation): FormData {
    const formData = new FormData();

    formData.append("file", {
        uri: obs.imageUri,
        name: `offline_${obs.id}.jpg`,
        type: obs.mimeType,
    } as unknown as Blob);

    formData.append("licenseType", obs.licenseType);
    formData.append("sourceType", "Mobile");

    if (obs.latitude != null && obs.longitude != null) {
        formData.append("latitude", String(obs.latitude));
        formData.append("longitude", String(obs.longitude));
    }

    formData.append("device", Device.deviceName ?? "Unknown");
    formData.append("deviceType", getDeviceTypeName());
    formData.append(
        "operatingSystem",
        `${Device.osName ?? "Unknown"} ${Device.osVersion ?? ""}`.trim(),
    );

    if (obs.speciesPredicted)
        formData.append("speciesPredicted", obs.speciesPredicted);
    if (obs.confidenceScore != null)
        formData.append("confidenceScore", String(obs.confidenceScore));
    if (obs.modelVersion) formData.append("modelVersion", obs.modelVersion);

    return formData;
}

/**
 * Download the full species catalog into the local cache.
 * Returns the number of species stored.
 */
export async function downloadCatalog(
    onProgress?: (stored: number, total: number) => void,
): Promise<number> {
    let page = 1;
    let stored = 0;
    let total = 0;

    while (page <= MAX_CATALOG_PAGES) {
        const result = await speciesService.getList({
            page,
            pageSize: CATALOG_PAGE_SIZE,
            sortBy: "scientificName",
            sortOrder: "asc",
        });

        total = result.totalCount || total;
        await upsertSpeciesListItems(result.items);
        stored += result.items.length;
        onProgress?.(stored, total);

        if (!result.hasNextPage || result.items.length === 0) break;
        page += 1;
    }

    return stored;
}

/**
 * Re-send all queued offline observations.
 * Stops on the first network error; drops entries the server rejects (4xx).
 */
export async function flushObservationQueue(): Promise<FlushResult> {
    const pending = await getPendingObservations();
    let sent = 0;
    let dropped = 0;

    for (const obs of pending) {
        try {
            await speciesService.uploadSpeciesObservation(
                obs.speciesId,
                buildObservationFormData(obs),
            );
            await removeObservation(obs.id);
            sent += 1;
        } catch (error) {
            // No response → network error: keep the entry and stop for now.
            if (isAxiosError(error) && !error.response) {
                return { sent, dropped, interrupted: true };
            }
            // Server reached but rejected (4xx/5xx) → drop to avoid a stuck queue.
            await removeObservation(obs.id);
            dropped += 1;
        }
    }

    return { sent, dropped, interrupted: false };
}

/**
 * Full sync: flush the upload queue, then refresh the catalog cache when
 * offline mode is enabled.
 */
export async function syncAll(options: {
    refreshCatalog: boolean;
    onCatalogProgress?: (stored: number, total: number) => void;
}): Promise<{ flush: FlushResult; catalogStored: number }> {
    const flush = await flushObservationQueue();
    let catalogStored = 0;
    if (options.refreshCatalog) {
        catalogStored = await downloadCatalog(options.onCatalogProgress);
    }
    return { flush, catalogStored };
}
