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

import {
    getThumbnailTargets,
    setImageLocalUri,
    setThumbLocalUri,
    upsertImageRows,
    upsertSpeciesDetail,
} from "@/lib/db/species-cache";
import type { SpeciesImage } from "@/types";
import {
    getPendingObservations,
    removeObservation,
    type PendingObservation,
} from "@/lib/db/observation-queue";
import { downloadGalleryImage, downloadThumbnail } from "@/lib/offline-files";
import * as speciesService from "@/services/species-service";
import { isAxiosError } from "axios";
import * as Device from "expo-device";

export type ProgressCallback = (done: number, total: number) => void;

const EXPORT_PAGE_SIZE = 50; // full-detail pages are heavier
const IMAGE_EXPORT_PAGE_SIZE = 100;
const MAX_PAGES = 500; // hard safety cap

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
 * Download the FULL catalog (complete detail per species) into the local cache,
 * batched via the export endpoint. Stores description, ecology, economic
 * potential, traditional uses and taxonomy — true offline, no per-species visit.
 * Returns the number of species stored.
 */
export async function downloadCatalog(
    onProgress?: ProgressCallback,
): Promise<number> {
    let page = 1;
    let stored = 0;
    let total = 0;

    while (page <= MAX_PAGES) {
        const result = await speciesService.getSpeciesExport(
            page,
            EXPORT_PAGE_SIZE,
        );

        total = result.totalCount || total;
        for (const species of result.items) {
            await upsertSpeciesDetail(species);
        }
        stored += result.items.length;
        onProgress?.(stored, total);

        if (!result.hasNextPage || result.items.length === 0) break;
        page += 1;
    }

    return stored;
}

/**
 * Download the primary thumbnail of every cached species for offline display.
 * Skips species whose thumbnail is already downloaded. Returns count stored.
 */
export async function downloadThumbnails(
    onProgress?: ProgressCallback,
): Promise<number> {
    const targets = await getThumbnailTargets();
    let done = 0;

    for (const target of targets) {
        const localUri = await downloadThumbnail(target.id, target.thumbnailUrl);
        if (localUri) await setThumbLocalUri(target.id, localUri);
        done += 1;
        onProgress?.(done, targets.length);
    }

    return done;
}

/**
 * Download the full image gallery (binaries) for the whole catalog.
 * Enumerates every image via the export endpoint (batched), stores the rows,
 * then downloads each binary to disk with progress. Optional / heavy.
 * Returns the number of image binaries stored.
 */
export async function downloadGalleryImages(
    onProgress?: ProgressCallback,
): Promise<number> {
    // Pass 1: enumerate + persist all image rows (batched).
    const allImages: SpeciesImage[] = [];
    let page = 1;
    while (page <= MAX_PAGES) {
        const result = await speciesService.getSpeciesImagesExport(
            page,
            IMAGE_EXPORT_PAGE_SIZE,
            false,
        );
        await upsertImageRows(result.items);
        allImages.push(...result.items);
        if (!result.hasNextPage || result.items.length === 0) break;
        page += 1;
    }

    // Pass 2: download each binary to disk.
    let done = 0;
    let stored = 0;
    for (const img of allImages) {
        const localUri = await downloadGalleryImage(img.id, img.imageUrl);
        if (localUri) {
            await setImageLocalUri(img.id, localUri);
            stored += 1;
        }
        done += 1;
        onProgress?.(done, allImages.length);
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
