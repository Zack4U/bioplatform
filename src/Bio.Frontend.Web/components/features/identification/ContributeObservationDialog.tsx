/**
 * ContributeObservationDialog — Modal para contribuir una observación de especie (Web).
 *
 * Se abre tras la identificación CNN con confianza ≥ umbral configurado.
 * Gestiona la solicitud de geolocalización, selección de licencia y flujo de subida.
 *
 * @module components/features/identification/ContributeObservationDialog
 */

"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    type LocationStatus,
    type ObservationCoords,
    useContributeObservation,
} from "@/hooks/features/identification/useContributeObservation";
import { CheckCircle, Info, Loader2, MapPin, MapPinOff, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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

interface ContributeObservationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** URL blob local de la imagen capturada/seleccionada para previsualización */
    previewUrl: string | null;
    /** UUID de la especie identificada (desde la BD) */
    speciesId: string | null;
    /** Nombre científico predicho por el CNN */
    speciesPredicted?: string;
    /** Score de confianza top del CNN (0–1) */
    confidenceScore?: number;
    /** Versión del modelo retornada por el servicio AI */
    modelVersion?: string;
    /** Objeto File real para subir */
    imageFile: File | null;
    /** Callback al completar la subida exitosamente */
    onSuccess?: () => void;
}

// ── Location status badge ─────────────────────────────────────────────────────

function LocationStatusBadge({ status }: { status: LocationStatus }) {
    if (status === "idle")
        return (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Ubicación no solicitada aún
            </span>
        );
    if (status === "requesting")
        return (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Solicitando ubicación…
            </span>
        );
    if (status === "granted")
        return (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Ubicación GPS obtenida
            </span>
        );
    if (status === "default")
        return (
            <span className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                <Info className="h-4 w-4" aria-hidden="true" />
                Usando ubicación por defecto (Manizales, CO)
            </span>
        );
    // "denied" — shouldn't reach here anymore but kept as fallback
    return (
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPinOff className="h-4 w-4" aria-hidden="true" />
            Sin ubicación GPS
        </span>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ContributeObservationDialog({
    open,
    onOpenChange,
    previewUrl,
    speciesId,
    speciesPredicted,
    confidenceScore,
    modelVersion,
    imageFile,
    onSuccess,
}: ContributeObservationDialogProps) {
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

    // Request geolocation only when the dialog opens (external system interaction).
    // setState calls in response to external async results are fine here.
    useEffect(() => {
        if (open) {
            void requestGeolocation().then((c) => setResolvedCoords(c));
        }
    }, [open, requestGeolocation]);

    // Reset state in an event handler, not in an effect body, to avoid
    // cascading renders triggered by synchronous setState inside effects.
    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
            setResolvedCoords(null);
        }
        onOpenChange(nextOpen);
    };

    const handleSubmit = async () => {
        if (!speciesId || !imageFile) return;

        try {
            await uploadObservation({
                speciesId,
                file: imageFile,
                licenseType,
                sourceType: "Web",
                coords: resolvedCoords,
                speciesPredicted,
                confidenceScore,
                modelVersion,
            });

            toast.success("Observación enviada con éxito", {
                description:
                    "Tu contribución ayudará a enriquecer el catálogo de biodiversidad.",
            });

            onOpenChange(false);
            onSuccess?.();
        } catch {
            toast.error("No se pudo enviar la observación", {
                description: "Verifica tu conexión e intenta de nuevo.",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md gap-5">
                <DialogHeader>
                    <DialogTitle>Contribuir Observación</DialogTitle>
                    <DialogDescription>
                        Comparte esta imagen con la comunidad científica. Será
                        revisada por expertos taxónomos.
                    </DialogDescription>
                </DialogHeader>

                {/* Preview */}
                {previewUrl && (
                    <div className="relative h-44 w-full overflow-hidden rounded-xl border bg-muted">
                        <Image
                            src={previewUrl}
                            alt="Vista previa de la observación"
                            fill
                            className="object-cover"
                            sizes="(max-width: 448px) 100vw, 448px"
                        />
                    </div>
                )}

                {/* Species info */}
                {speciesPredicted && (
                    <p className="text-center text-sm italic text-muted-foreground">
                        {speciesPredicted}
                        {confidenceScore !== undefined && (
                            <span className="ml-2 not-italic font-medium text-primary">
                                ({(confidenceScore * 100).toFixed(1)}%)
                            </span>
                        )}
                    </p>
                )}

                {/* Location status */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Ubicación
                    </p>
                    <LocationStatusBadge status={locationStatus} />
                </div>

                {/* License selector */}
                <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Licencia
                    </p>
                    <Select
                        value={licenseType}
                        onValueChange={(v) => setLicenseType(v as LicenseValue)}
                    >
                        <SelectTrigger id="license-select" className="w-full">
                            <SelectValue placeholder="Selecciona una licencia" />
                        </SelectTrigger>
                        <SelectContent>
                            {LICENSE_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Success state */}
                {isSuccess && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                        <CheckCircle
                            className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                            aria-hidden="true"
                        />
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                            Observación enviada exitosamente.
                        </p>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isUploading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        id="btn-contribuir-observacion"
                        onClick={() => void handleSubmit()}
                        disabled={
                            isUploading ||
                            isSuccess ||
                            !speciesId ||
                            !imageFile ||
                            locationStatus === "requesting"
                        }
                        className="gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                                Enviando…
                            </>
                        ) : (
                            <>
                                <Upload
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                                Contribuir
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
