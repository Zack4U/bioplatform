/**
 * Offline store — offline-first mode state, connectivity, and sync orchestration.
 *
 * Two distinct concepts:
 * - Data authorization: `enabled` (catalog + thumbnails downloaded) and
 *   `imagesEnabled` (full gallery binaries downloaded). Only happens on explicit
 *   user action.
 * - Runtime mode: `isOnline` (from NetInfo) and `manualOffline` (user forced).
 *   `effectiveOffline = manualOffline || !isOnline` drives cache-first reads.
 *
 * Persists authorization + manual flags + last sync to AsyncStorage.
 *
 * @module store/offline-store
 */

import { countPendingObservations } from "@/lib/db/observation-queue";
import {
    clearImageLocalUris,
    clearThumbLocalUris,
    countDownloadedImages,
    countSpecies,
    countSpeciesWithDetail,
} from "@/lib/db/species-cache";
import {
    deleteGalleryFiles,
    deleteThumbnailFiles,
} from "@/lib/offline-files";
import { notificationService } from "@/lib/notifications";
import {
    downloadCatalog,
    downloadGalleryImages,
    downloadThumbnails,
    flushObservationQueue,
    syncAll,
} from "@/services/offline-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEYS = {
    ENABLED: "offlineEnabled",
    IMAGES_ENABLED: "offlineImagesEnabled",
    MANUAL: "offlineManual",
    LAST_SYNC: "offlineLastSync",
} as const;

type SyncStatus = "idle" | "syncing" | "error";

interface Progress {
    done: number;
    total: number;
    label: string;
}

interface OfflineState {
    // Data authorization
    enabled: boolean;
    imagesEnabled: boolean;
    // Sync status
    status: SyncStatus;
    progress: Progress | null;
    lastSyncAt: string | null;
    // Counts
    speciesCount: number;
    detailCount: number;
    pendingCount: number;
    imageCount: number;
    // Runtime mode
    isOnline: boolean;
    manualOffline: boolean;
    hydrated: boolean;

    hydrate: () => Promise<void>;
    refreshCounts: () => Promise<void>;
    setOnline: (online: boolean) => void;
    setManualOffline: (value: boolean) => Promise<void>;
    enableOffline: () => Promise<void>;
    disableOffline: () => Promise<void>;
    enableImages: () => Promise<void>;
    disableImages: () => Promise<void>;
    flushPending: () => Promise<void>;
    syncNow: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
    enabled: false,
    imagesEnabled: false,
    status: "idle",
    progress: null,
    lastSyncAt: null,
    speciesCount: 0,
    detailCount: 0,
    pendingCount: 0,
    imageCount: 0,
    isOnline: true,
    manualOffline: false,
    hydrated: false,

    hydrate: async () => {
        try {
            const [enabled, imagesEnabled, manual, lastSync] =
                await Promise.all([
                    AsyncStorage.getItem(KEYS.ENABLED),
                    AsyncStorage.getItem(KEYS.IMAGES_ENABLED),
                    AsyncStorage.getItem(KEYS.MANUAL),
                    AsyncStorage.getItem(KEYS.LAST_SYNC),
                ]);
            set({
                enabled: enabled === "true",
                imagesEnabled: imagesEnabled === "true",
                manualOffline: manual === "true",
                lastSyncAt: lastSync,
                hydrated: true,
            });
            await get().refreshCounts();
        } catch {
            set({ hydrated: true });
        }
    },

    refreshCounts: async () => {
        try {
            const [speciesCount, detailCount, pendingCount, imageCount] =
                await Promise.all([
                    countSpecies(),
                    countSpeciesWithDetail(),
                    countPendingObservations(),
                    countDownloadedImages(),
                ]);
            set({ speciesCount, detailCount, pendingCount, imageCount });
        } catch {
            // Counts are advisory only.
        }
    },

    setOnline: (online) => {
        const wasOffline = !get().isOnline;
        set({ isOnline: online });
        // Lightweight flush of queued uploads when connectivity returns
        // (does NOT re-download the whole catalog — that is user-initiated).
        if (online && wasOffline) {
            void get().flushPending();
        }
    },

    setManualOffline: async (value) => {
        set({ manualOffline: value });
        await AsyncStorage.setItem(KEYS.MANUAL, value ? "true" : "false");
        if (!value && get().isOnline) {
            void get().flushPending();
        }
    },

    enableOffline: async () => {
        set({ enabled: true, status: "syncing", progress: null });
        await AsyncStorage.setItem(KEYS.ENABLED, "true");
        const toastId = notificationService.loading(
            "Descargando catálogo offline...",
        );
        try {
            await downloadCatalog((done, total) =>
                set({ progress: { done, total, label: "Catálogo" } }),
            );
            await downloadThumbnails((done, total) =>
                set({ progress: { done, total, label: "Miniaturas" } }),
            );
            const now = new Date().toISOString();
            await AsyncStorage.setItem(KEYS.LAST_SYNC, now);
            set({ lastSyncAt: now, status: "idle", progress: null });
            await get().refreshCounts();
            notificationService.dismiss(toastId);
            notificationService.success(
                `Catálogo disponible offline (${get().speciesCount} especies).`,
            );
        } catch {
            set({ status: "error", progress: null });
            notificationService.dismiss(toastId);
            notificationService.error("No se pudo descargar el catálogo.");
        }
    },

    disableOffline: async () => {
        // Free downloaded binaries; keep the lightweight text cache.
        if (get().imagesEnabled) {
            await get().disableImages();
        }
        await deleteThumbnailFiles();
        await clearThumbLocalUris();
        set({ enabled: false });
        await AsyncStorage.setItem(KEYS.ENABLED, "false");
        await get().refreshCounts();
    },

    enableImages: async () => {
        set({ status: "syncing", progress: null });
        await AsyncStorage.setItem(KEYS.IMAGES_ENABLED, "true");
        set({ imagesEnabled: true });
        const toastId = notificationService.loading(
            "Descargando imágenes...",
        );
        try {
            await downloadGalleryImages((done, total) =>
                set({ progress: { done, total, label: "Imágenes" } }),
            );
            set({ status: "idle", progress: null });
            await get().refreshCounts();
            notificationService.dismiss(toastId);
            notificationService.success(
                `Imágenes descargadas (${get().imageCount}).`,
            );
        } catch {
            set({ status: "error", progress: null });
            notificationService.dismiss(toastId);
            notificationService.error("No se pudieron descargar las imágenes.");
        }
    },

    disableImages: async () => {
        await deleteGalleryFiles();
        await clearImageLocalUris();
        set({ imagesEnabled: false });
        await AsyncStorage.setItem(KEYS.IMAGES_ENABLED, "false");
        await get().refreshCounts();
    },

    flushPending: async () => {
        if (get().status === "syncing") return;
        set({ status: "syncing" });
        try {
            await flushObservationQueue();
            set({ status: "idle" });
            await get().refreshCounts();
        } catch {
            set({ status: "error" });
        }
    },

    syncNow: async () => {
        if (get().status === "syncing") return;
        set({ status: "syncing", progress: null });
        try {
            await syncAll({
                refreshCatalog: get().enabled,
                onCatalogProgress: (done, total) =>
                    set({ progress: { done, total, label: "Catálogo" } }),
            });
            const now = new Date().toISOString();
            await AsyncStorage.setItem(KEYS.LAST_SYNC, now);
            set({ lastSyncAt: now, status: "idle", progress: null });
            await get().refreshCounts();
        } catch {
            set({ status: "error", progress: null });
        }
    },
}));
