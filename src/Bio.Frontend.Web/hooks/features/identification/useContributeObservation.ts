/**
 * useContributeObservation — hook for the "Contribuir Observación" feature (Web).
 *
 * Responsibilities:
 * - React Query mutation for POST /api/species/{id}/observations
 * - Geolocation request via browser navigator.geolocation (optional)
 * - Exposes location state so the dialog can show feedback to the user
 *
 * @module hooks/features/identification/useContributeObservation
 */

"use client";

import { uploadSpeciesObservation } from "@/services/species-service";
import type { SpeciesImage } from "@/types/species";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LocationStatus = "idle" | "requesting" | "granted" | "denied" | "default";

/** Default coordinates for Manizales, Colombia (used when geolocation is denied) */
export const MANIZALES_DEFAULT_COORDS: ObservationCoords = {
    latitude: 5.0703,
    longitude: -75.5138,
};

export interface ObservationCoords {
    latitude: number;
    longitude: number;
}

export interface UploadObservationParams {
    speciesId: string;
    file: File;
    licenseType: string;
    sourceType: "Web";
    coords: ObservationCoords | null;
    /** Optional CNN context forwarded from the identification result */
    speciesPredicted?: string;
    confidenceScore?: number;
    modelVersion?: string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Custom hook that manages the full observation contribution flow:
 * geolocation permission request + S3 image upload mutation.
 */
export function useContributeObservation() {
    const [locationStatus, setLocationStatus] =
        useState<LocationStatus>("idle");
    const [coords, setCoords] = useState<ObservationCoords | null>(null);

    // ── Geolocation ───────────────────────────────────────────────────────────

    /**
     * Requests the user's browser geolocation.
     * Resolves with coordinates on success, or null if denied / unavailable.
     * Updates `locationStatus` and `coords` state throughout.
     */
    const requestGeolocation =
        useCallback((): Promise<ObservationCoords | null> => {
            if (!navigator.geolocation) {
                setLocationStatus("denied");
                return Promise.resolve(null);
            }

            setLocationStatus("requesting");

            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const result: ObservationCoords = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        };
                        setCoords(result);
                        setLocationStatus("granted");
                        resolve(result);
                    },
                    () => {
                        // Use Manizales default when geolocation is denied
                        setCoords(MANIZALES_DEFAULT_COORDS);
                        setLocationStatus("default");
                        resolve(MANIZALES_DEFAULT_COORDS);
                    },
                    { timeout: 10_000, maximumAge: 60_000 },
                );
            });
        }, []);

    // ── Upload Mutation ───────────────────────────────────────────────────────

    const mutation = useMutation<SpeciesImage, Error, UploadObservationParams>({
        mutationFn: async (params) => {
            const formData = new FormData();

            // Image file — backend expects the field named "file"
            formData.append("file", params.file, params.file.name);

            // License and source
            formData.append("licenseType", params.licenseType);
            formData.append("sourceType", params.sourceType);

            // Geolocation (only if granted)
            if (params.coords) {
                formData.append("latitude", String(params.coords.latitude));
                formData.append("longitude", String(params.coords.longitude));
            }

            // Device info (browser / web context)
            formData.append("deviceType", "desktop");
            formData.append(
                "operatingSystem",
                navigator.userAgent.slice(0, 200),
            );

            // CNN context
            if (params.speciesPredicted)
                formData.append("speciesPredicted", params.speciesPredicted);
            if (params.confidenceScore !== undefined)
                formData.append(
                    "confidenceScore",
                    String(params.confidenceScore),
                );
            if (params.modelVersion)
                formData.append("modelVersion", params.modelVersion);

            return uploadSpeciesObservation(params.speciesId, formData);
        },
    });

    return {
        /** Current geolocation permission state */
        locationStatus,
        /** Resolved coordinates (null if denied or not yet requested) */
        coords,
        /** Request browser geolocation — call before opening the dialog */
        requestGeolocation,
        /** React Query mutation object */
        uploadObservation: mutation.mutateAsync,
        isUploading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        uploadedImage: mutation.data,
        uploadError: mutation.error,
        reset: mutation.reset,
    };
}
