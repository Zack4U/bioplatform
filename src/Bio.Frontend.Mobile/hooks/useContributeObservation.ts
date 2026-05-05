/**
 * useContributeObservation — hook for the "Contribuir Observación" feature (Mobile).
 *
 * Responsibilities:
 * - React Query mutation for POST /api/species/{id}/observations
 * - Geolocation via expo-location (proper React Native API)
 * - Device metadata via expo-device (deviceName, deviceType, osName, osVersion)
 *
 * @module hooks/useContributeObservation
 */

import { uploadSpeciesObservation } from "@/services/species-service";
import { useMutation } from "@tanstack/react-query";
import * as Device from "expo-device";
import * as Location from "expo-location";
import { useCallback, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LocationStatus = "idle" | "requesting" | "granted" | "denied";

export interface ObservationCoords {
    latitude: number;
    longitude: number;
}

export interface MobileUploadObservationParams {
    speciesId: string;
    /** Local file URI returned by expo-image-picker or expo-camera */
    imageUri: string;
    /** MIME type of the image e.g. "image/jpeg" */
    mimeType: string;
    licenseType: string;
    coords: ObservationCoords | null;
    speciesPredicted?: string;
    confidenceScore?: number;
    modelVersion?: string;
}

// ── Device helpers ────────────────────────────────────────────────────────────

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

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useContributeObservation() {
    const [locationStatus, setLocationStatus] =
        useState<LocationStatus>("idle");
    const [coords, setCoords] = useState<ObservationCoords | null>(null);

    // ── Geolocation ───────────────────────────────────────────────────────────

    /**
     * Requests foreground location permission via expo-location,
     * then fetches the current position.
     * Resolves with coordinates or null if the user denies permission.
     */
    const requestGeolocation =
        useCallback(async (): Promise<ObservationCoords | null> => {
            setLocationStatus("requesting");

            try {
                const { status } =
                    await Location.requestForegroundPermissionsAsync();

                if (status !== "granted") {
                    setCoords(null);
                    setLocationStatus("denied");
                    return null;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                const result: ObservationCoords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                };

                setCoords(result);
                setLocationStatus("granted");
                return result;
            } catch {
                setCoords(null);
                setLocationStatus("denied");
                return null;
            }
        }, []);

    // ── Upload Mutation ───────────────────────────────────────────────────────

    const mutation = useMutation<unknown, Error, MobileUploadObservationParams>(
        {
            mutationFn: async (params) => {
                const formData = new FormData();

                // Image file — React Native FormData accepts uri/name/type objects
                formData.append("file", {
                    uri: params.imageUri,
                    name: `mobile_${Date.now()}.jpg`,
                    type: params.mimeType,
                } as unknown as Blob);

                // License and source
                formData.append("licenseType", params.licenseType);
                formData.append("sourceType", "Mobile");

                // Geolocation (only if granted)
                if (params.coords) {
                    formData.append("latitude", String(params.coords.latitude));
                    formData.append(
                        "longitude",
                        String(params.coords.longitude),
                    );
                }

                // Device metadata from expo-device
                formData.append("device", Device.deviceName ?? "Unknown");
                formData.append("deviceType", getDeviceTypeName());
                formData.append(
                    "operatingSystem",
                    `${Device.osName ?? "Unknown"} ${Device.osVersion ?? ""}`.trim(),
                );

                // CNN context
                if (params.speciesPredicted)
                    formData.append(
                        "speciesPredicted",
                        params.speciesPredicted,
                    );
                if (params.confidenceScore !== undefined)
                    formData.append(
                        "confidenceScore",
                        String(params.confidenceScore),
                    );
                if (params.modelVersion)
                    formData.append("modelVersion", params.modelVersion);

                return uploadSpeciesObservation(params.speciesId, formData);
            },
        },
    );

    return {
        locationStatus,
        coords,
        requestGeolocation,
        uploadObservation: mutation.mutateAsync,
        isUploading: mutation.isPending,
        isSuccess: mutation.isSuccess,
        uploadError: mutation.error,
        reset: mutation.reset,
    };
}
