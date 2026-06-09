/**
 * Offline store — manual offline-first mode state and sync orchestration.
 *
 * The user opts into offline mode (downloads the catalog to SQLite). The store
 * tracks sync status, last sync time, cached species count, and the pending
 * upload-queue size. Persists the enabled flag + last sync to AsyncStorage.
 *
 * @module store/offline-store
 */

import { countPendingObservations } from "@/lib/db/observation-queue";
import { countSpecies } from "@/lib/db/species-cache";
import { downloadCatalog, syncAll } from "@/services/offline-sync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const KEYS = {
    ENABLED: "offlineEnabled",
    LAST_SYNC: "offlineLastSync",
} as const;

type SyncStatus = "idle" | "syncing" | "error";

interface OfflineState {
    enabled: boolean;
    status: SyncStatus;
    lastSyncAt: string | null;
    speciesCount: number;
    pendingCount: number;
    hydrated: boolean;

    hydrate: () => Promise<void>;
    refreshCounts: () => Promise<void>;
    enableOffline: () => Promise<void>;
    disableOffline: () => Promise<void>;
    syncNow: () => Promise<void>;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
    enabled: false,
    status: "idle",
    lastSyncAt: null,
    speciesCount: 0,
    pendingCount: 0,
    hydrated: false,

    hydrate: async () => {
        try {
            const [enabledRaw, lastSync] = await Promise.all([
                AsyncStorage.getItem(KEYS.ENABLED),
                AsyncStorage.getItem(KEYS.LAST_SYNC),
            ]);
            set({
                enabled: enabledRaw === "true",
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
            const [speciesCount, pendingCount] = await Promise.all([
                countSpecies(),
                countPendingObservations(),
            ]);
            set({ speciesCount, pendingCount });
        } catch {
            // Counts are advisory only.
        }
    },

    enableOffline: async () => {
        set({ enabled: true, status: "syncing" });
        await AsyncStorage.setItem(KEYS.ENABLED, "true");
        try {
            await downloadCatalog();
            const now = new Date().toISOString();
            await AsyncStorage.setItem(KEYS.LAST_SYNC, now);
            set({ lastSyncAt: now, status: "idle" });
            await get().refreshCounts();
        } catch {
            set({ status: "error" });
        }
    },

    disableOffline: async () => {
        set({ enabled: false });
        await AsyncStorage.setItem(KEYS.ENABLED, "false");
    },

    syncNow: async () => {
        if (get().status === "syncing") return;
        set({ status: "syncing" });
        try {
            await syncAll({ refreshCatalog: get().enabled });
            const now = new Date().toISOString();
            await AsyncStorage.setItem(KEYS.LAST_SYNC, now);
            set({ lastSyncAt: now, status: "idle" });
            await get().refreshCounts();
        } catch {
            set({ status: "error" });
        }
    },
}));
