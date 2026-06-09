/**
 * Offline files — download and manage image binaries for offline viewing.
 *
 * Uses the stable legacy expo-file-system API. Files live under
 * documentDirectory/offline/{thumbs,images}. Returns local file:// URIs that
 * expo-image can render without connectivity.
 *
 * @module lib/offline-files
 */

import { normalizeImageUrl } from "@/lib/image-url";
import * as FileSystem from "expo-file-system/legacy";

const ROOT = `${FileSystem.documentDirectory}offline/`;
const THUMBS_DIR = `${ROOT}thumbs/`;
const IMAGES_DIR = `${ROOT}images/`;

// Heuristic size estimate constants (no network probing).
const AVG_IMAGES_PER_SPECIES = 4;
const AVG_IMAGE_BYTES = 200 * 1024; // ~200 KB

async function ensureDir(dir: string): Promise<void> {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
}

/** Download a species thumbnail. Returns the local URI, or null on failure. */
export async function downloadThumbnail(
    speciesId: string,
    url: string,
): Promise<string | null> {
    const normalized = normalizeImageUrl(url);
    if (!normalized) return null;
    try {
        await ensureDir(THUMBS_DIR);
        const dest = `${THUMBS_DIR}${speciesId}.jpg`;
        const result = await FileSystem.downloadAsync(normalized, dest);
        return result.uri;
    } catch {
        return null;
    }
}

/** Download a gallery image. Returns the local URI, or null on failure. */
export async function downloadGalleryImage(
    imageId: string,
    url: string,
): Promise<string | null> {
    const normalized = normalizeImageUrl(url);
    if (!normalized) return null;
    try {
        await ensureDir(IMAGES_DIR);
        const dest = `${IMAGES_DIR}${imageId}.jpg`;
        const result = await FileSystem.downloadAsync(normalized, dest);
        return result.uri;
    } catch {
        return null;
    }
}

/** Delete only the downloaded gallery image files (keeps thumbnails). */
export async function deleteGalleryFiles(): Promise<void> {
    try {
        await FileSystem.deleteAsync(IMAGES_DIR, { idempotent: true });
    } catch {
        // Best-effort.
    }
}

/** Delete the downloaded thumbnail files. */
export async function deleteThumbnailFiles(): Promise<void> {
    try {
        await FileSystem.deleteAsync(THUMBS_DIR, { idempotent: true });
    } catch {
        // Best-effort.
    }
}

/** Delete all downloaded offline image files. */
export async function clearOfflineFiles(): Promise<void> {
    try {
        await FileSystem.deleteAsync(ROOT, { idempotent: true });
    } catch {
        // Best-effort.
    }
}

/** Heuristic estimate of the full image-catalog download size (bytes). */
export function estimateImagesSizeBytes(speciesCount: number): number {
    return speciesCount * AVG_IMAGES_PER_SPECIES * AVG_IMAGE_BYTES;
}

/** Human-readable byte size, e.g. "~125 MB". */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${Math.round(kb)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
}
