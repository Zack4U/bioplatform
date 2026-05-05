/**
 * ContributeObservationSheet — Bottom sheet para enviar una observación de especie (Mobile).
 *
 * Se abre tras una identificación CNN con confianza ≥ umbral configurado.
 * Maneja el permiso de geolocalización, selección de licencia y flujo de subida.
 *
 * @module components/camera/ContributeObservationSheet
 */

import {
    type LocationStatus,
    type ObservationCoords,
    useContributeObservation,
} from "@/hooks/useContributeObservation";
import { notificationService } from "@/lib/notifications";
import { CheckCircle, MapPin, MapPinOff, Upload, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// ── License options ───────────────────────────────────────────────────────────

const LICENSE_OPTIONS = [
    { value: "CC-BY", label: "CC BY — Atribución" },
    { value: "CC-BY-NC", label: "CC BY-NC — No Comercial" },
    { value: "CC-BY-SA", label: "CC BY-SA — Compartir Igual" },
    {
        value: "CC-BY-NC-SA",
        label: "CC BY-NC-SA — No Comercial + Compartir Igual",
    },
] as const;

type LicenseValue = (typeof LICENSE_OPTIONS)[number]["value"];

// ── Props ─────────────────────────────────────────────────────────────────────

interface ContributeObservationSheetProps {
    open: boolean;
    onClose: () => void;
    imageUri: string | null;
    speciesId: string | null;
    speciesPredicted?: string;
    confidenceScore?: number;
    modelVersion?: string;
    imageMimeType?: string;
    minConfidenceThreshold?: number;
}

// ── Location status row ───────────────────────────────────────────────────────

function LocationStatusRow({ status }: { status: LocationStatus }) {
    if (status === "requesting") {
        return (
            <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" />
                <Text className="text-sm text-muted-foreground">
                    Solicitando ubicación…
                </Text>
            </View>
        );
    }
    if (status === "granted") {
        return (
            <View className="flex-row items-center gap-2">
                <MapPin size={16} className="text-emerald-500" />
                <Text className="text-sm text-emerald-600">
                    Ubicación obtenida
                </Text>
            </View>
        );
    }
    if (status === "denied") {
        return (
            <View className="flex-row items-center gap-2">
                <MapPinOff size={16} className="text-amber-500" />
                <Text className="text-sm text-amber-600">
                    Sin ubicación — se enviará sin coordenadas
                </Text>
            </View>
        );
    }
    return (
        <View className="flex-row items-center gap-2">
            <MapPin size={16} className="text-muted-foreground" />
            <Text className="text-sm text-muted-foreground">
                Ubicación no solicitada aún
            </Text>
        </View>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContributeObservationSheet({
    open,
    onClose,
    imageUri,
    speciesId,
    speciesPredicted,
    confidenceScore,
    modelVersion,
    imageMimeType = "image/jpeg",
    minConfidenceThreshold = 0.6,
}: ContributeObservationSheetProps) {
    const [licenseType, setLicenseType] = useState<LicenseValue>("CC-BY");
    const [resolvedCoords, setResolvedCoords] =
        useState<ObservationCoords | null>(null);

    const {
        locationStatus,
        requestGeolocation,
        uploadObservation,
        isUploading,
        isSuccess,
        reset,
    } = useContributeObservation();

    // Request geolocation only when the sheet opens (external system interaction).
    useEffect(() => {
        if (open) {
            void requestGeolocation().then((c) => setResolvedCoords(c));
        }
    }, [open, requestGeolocation]);

    // Reset happens in event handlers, not in effect bodies, to avoid cascading renders.
    const handleClose = () => {
        reset();
        setResolvedCoords(null);
        onClose();
    };

    const handleSubmit = async () => {
        if (!speciesId || !imageUri) return;

        const meetsThreshold =
            confidenceScore === undefined ||
            confidenceScore >= minConfidenceThreshold;

        if (!meetsThreshold) {
            notificationService.warning(
                "La confianza del modelo es insuficiente para contribuir.",
            );
            return;
        }

        try {
            await uploadObservation({
                speciesId,
                imageUri,
                mimeType: imageMimeType,
                licenseType,
                coords: resolvedCoords,
                speciesPredicted,
                confidenceScore,
                modelVersion,
            });

            notificationService.success("Observación enviada con éxito.");
            handleClose();
        } catch {
            notificationService.error(
                "No se pudo enviar la observación. Intenta de nuevo.",
            );
        }
    };

    return (
        <Modal
            visible={open}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="rounded-t-3xl bg-background px-5 pb-10 pt-4">
                    {/* Handle bar */}
                    <View className="mb-4 items-center">
                        <View className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                    </View>

                    {/* Header */}
                    <View className="mb-4 flex-row items-center justify-between">
                        <Text className="text-lg font-bold text-foreground">
                            Contribuir Observación
                        </Text>
                        <Pressable
                            onPress={handleClose}
                            accessibilityLabel="Cerrar"
                            className="rounded-full p-1"
                        >
                            <X size={20} className="text-muted-foreground" />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        className="gap-5"
                    >
                        {/* Image preview */}
                        {imageUri && (
                            <Image
                                source={{ uri: imageUri }}
                                className="mb-4 h-44 w-full rounded-2xl"
                                resizeMode="cover"
                                accessibilityLabel="Vista previa de la observación"
                            />
                        )}

                        {/* Species info */}
                        {speciesPredicted && (
                            <Text className="mb-4 text-center text-sm italic text-muted-foreground">
                                {speciesPredicted}
                                {confidenceScore !== undefined && (
                                    <Text className="not-italic font-semibold text-primary">
                                        {"  "}(
                                        {(confidenceScore * 100).toFixed(1)}%)
                                    </Text>
                                )}
                            </Text>
                        )}

                        {/* Location status */}
                        <View className="mb-4 rounded-xl border border-border bg-muted/40 px-4 py-3 gap-2">
                            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Ubicación
                            </Text>
                            <LocationStatusRow status={locationStatus} />
                            {locationStatus === "denied" && (
                                <TouchableOpacity
                                    onPress={() =>
                                        void requestGeolocation().then((c) =>
                                            setResolvedCoords(c),
                                        )
                                    }
                                >
                                    <Text className="text-xs text-primary underline">
                                        Intentar de nuevo
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* License selector */}
                        <View className="mb-6 gap-2">
                            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Licencia
                            </Text>
                            {LICENSE_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => setLicenseType(opt.value)}
                                    className={`flex-row items-center gap-3 rounded-xl border px-4 py-3 ${
                                        licenseType === opt.value
                                            ? "border-primary bg-primary/10"
                                            : "border-border bg-transparent"
                                    }`}
                                    accessibilityRole="radio"
                                    accessibilityState={{
                                        checked: licenseType === opt.value,
                                    }}
                                >
                                    <View
                                        className={`h-4 w-4 rounded-full border-2 ${
                                            licenseType === opt.value
                                                ? "border-primary bg-primary"
                                                : "border-muted-foreground"
                                        }`}
                                    />
                                    <Text
                                        className={`flex-1 text-sm ${
                                            licenseType === opt.value
                                                ? "font-semibold text-primary"
                                                : "text-foreground"
                                        }`}
                                    >
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Success message */}
                        {isSuccess && (
                            <View className="mb-4 flex-row items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                                <CheckCircle
                                    size={16}
                                    className="text-emerald-500"
                                />
                                <Text className="text-sm text-emerald-700">
                                    Observación enviada exitosamente.
                                </Text>
                            </View>
                        )}

                        {/* Submit button */}
                        <TouchableOpacity
                            id="btn-contribuir-observacion-mobile"
                            onPress={() => void handleSubmit()}
                            disabled={
                                isUploading ||
                                isSuccess ||
                                !speciesId ||
                                !imageUri ||
                                locationStatus === "requesting"
                            }
                            className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                                isUploading || isSuccess
                                    ? "bg-muted"
                                    : "bg-primary"
                            }`}
                            accessibilityRole="button"
                            accessibilityLabel="Contribuir observación"
                        >
                            {isUploading ? (
                                <>
                                    <ActivityIndicator
                                        color="white"
                                        size="small"
                                    />
                                    <Text className="font-semibold text-primary-foreground">
                                        Enviando…
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <Upload
                                        size={18}
                                        className="text-primary-foreground"
                                    />
                                    <Text className="font-semibold text-primary-foreground">
                                        Contribuir
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}
