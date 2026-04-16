/**
 * SpeciesDistributionMap — Leaflet map for species distribution points.
 *
 * Centered on Caldas, Colombia. Renders distribution markers when data
 * is available. For sensitive species with masked coordinates, shows
 * municipality labels instead of exact points.
 *
 * Lazy-loaded with Next.js dynamic() to avoid SSR issues with Leaflet.
 *
 * UI ONLY — receives distributions via props.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { GeographicDistribution } from "@/types/species";
import { AlertTriangle, MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo } from "react";

/* ─── Lazy-load Leaflet components (no SSR) ─────────────────────────────── */

const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false },
);

const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false },
);

const LeafletMarker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false },
);

const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false },
);

/**
 * Leaflet Icon Configuration
 * Overrides the default broken image icon with a custom SVG map pin
 * styled with the primary theme color (green).
 */
const FixLeafletIcons = dynamic(
    () =>
        import("leaflet").then((L) => {
            const customIcon = L.divIcon({
                html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-8 w-8 text-primary drop-shadow-md" stroke="white" stroke-width="1.5">
                    <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                </svg>`,
                className: "custom-leaflet-marker border-none bg-transparent",
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
            });

            // Globally override the default marker icon
            L.Marker.prototype.options.icon = customIcon;

            // Return a no-op component — the side-effect is the icon fix
            return { default: () => null };
        }),
    { ssr: false },
);

/* ─── Caldas, Colombia center coordinates ─────────────────────────────── */

const CALDAS_CENTER: [number, number] = [5.0689, -75.5174];
const DEFAULT_ZOOM = 9;

/* ─── Props ─────────────────────────────────────────────────────────────── */

interface SpeciesDistributionMapProps {
    distributions: GeographicDistribution[];
    isSensitive: boolean;
    isLoading?: boolean;
    hasMaskedPoints?: boolean;
}

/* ─── Component ─────────────────────────────────────────────────────────── */

export function SpeciesDistributionMap({
    distributions,
    isSensitive,
    isLoading = false,
    hasMaskedPoints = false,
}: SpeciesDistributionMapProps) {
    /* Only get points with actual coordinates */
    const visiblePoints = useMemo(
        () => distributions.filter((d) => d.latitude != null && d.longitude != null),
        [distributions],
    );

    /* Municipalities from masked points */
    const maskedMunicipalities = useMemo(
        () =>
            [
                ...new Set(
                    distributions
                        .filter((d) => d.isMasked && d.municipality)
                        .map((d) => d.municipality!),
                ),
            ],
        [distributions],
    );

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-4 w-4 text-primary" />
                    Distribución Geográfica
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 p-0 sm:p-6 sm:pt-0">
                {/* Sensitivity warning */}
                {(isSensitive || hasMaskedPoints) && (
                    <div className="mx-4 sm:mx-0 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="text-xs text-amber-800 dark:text-amber-200">
                            <p className="font-medium">Especie con datos protegidos</p>
                            <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                                Las coordenadas exactas han sido enmascaradas para proteger
                                esta especie sensible. Solo se muestran los municipios de
                                avistamiento.
                            </p>
                        </div>
                    </div>
                )}

                {/* Masked municipalities list */}
                {maskedMunicipalities.length > 0 && (
                    <div className="mx-4 sm:mx-0 flex flex-wrap gap-1.5">
                        <span className="text-xs text-muted-foreground mr-1 self-center">
                            Municipios reportados:
                        </span>
                        {maskedMunicipalities.map((m) => (
                            <Badge key={m} variant="secondary" className="text-xs">
                                {m}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Map */}
                {isLoading ? (
                    <Skeleton className="h-[350px] w-full rounded-none sm:rounded-lg" />
                ) : (
                    <div className="h-[350px] w-full overflow-hidden sm:rounded-lg">
                        <MapContainer
                            center={CALDAS_CENTER}
                            zoom={DEFAULT_ZOOM}
                            scrollWheelZoom={false}
                            className="h-full w-full z-0"
                            style={{ height: "100%", width: "100%" }}
                        >
                        <FixLeafletIcons />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {visiblePoints.map((point) => (
                                <LeafletMarker
                                    key={point.id}
                                    position={[point.latitude!, point.longitude!]}
                                >
                                    <Popup>
                                        <div className="text-xs">
                                            {point.municipality && (
                                                <p className="font-semibold">
                                                    {point.municipality}
                                                </p>
                                            )}
                                            {point.altitude && (
                                                <p>{point.altitude} msnm</p>
                                            )}
                                            {point.ecosystemType && (
                                                <p className="text-muted-foreground">
                                                    {point.ecosystemType}
                                                </p>
                                            )}
                                        </div>
                                    </Popup>
                                </LeafletMarker>
                            ))}
                        </MapContainer>
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && distributions.length === 0 && (
                    <div className="mx-4 sm:mx-0 flex flex-col items-center justify-center py-8 text-center">
                        <MapPin className="mb-2 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            No hay datos de distribución geográfica registrados para esta
                            especie.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
