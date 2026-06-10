/**
 * Identification Store — Zustand store for local identification history.
 *
 * Persists recent classification results in localStorage so users
 * can review past identifications without hitting the backend.
 *
 * Uses Zustand `persist` middleware for automatic localStorage sync.
 * Max 10 entries — oldest entries are evicted on overflow.
 *
 * @module store/identification-store
 */

import type { ClassificationResponse } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ────────────────────────────────────────────────────────────────────

export interface IdentificationRecord {
    /** Unique ID for the record (UUID) */
    id: string;
    /** ISO 8601 timestamp when identification was performed */
    timestamp: string;
    /** Base64 data URL of the uploaded image preview */
    imagePreviewUrl: string;
    /** Full classification response from the AI backend */
    result: ClassificationResponse;
}

interface IdentificationState {
    /** Ordered list of past identifications (newest first) */
    history: IdentificationRecord[];
    /** Add a new identification to history */
    addRecord: (record: Omit<IdentificationRecord, "id" | "timestamp">) => void;
    /** Remove a specific record by ID */
    removeRecord: (id: string) => void;
    /** Clear all history */
    clearHistory: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_HISTORY_ENTRIES = 10;

// ── Store ────────────────────────────────────────────────────────────────────

export const useIdentificationStore = create<IdentificationState>()(
    persist(
        (set) => ({
            history: [],

            addRecord: (record) =>
                set((state) => {
                    const newRecord: IdentificationRecord = {
                        ...record,
                        id: crypto.randomUUID(),
                        timestamp: new Date().toISOString(),
                    };
                    const updated = [newRecord, ...state.history].slice(
                        0,
                        MAX_HISTORY_ENTRIES,
                    );
                    return { history: updated };
                }),

            removeRecord: (id) =>
                set((state) => ({
                    history: state.history.filter((r) => r.id !== id),
                })),

            clearHistory: () => set({ history: [] }),
        }),
        {
            name: "bio-identification-history",
        },
    ),
);
