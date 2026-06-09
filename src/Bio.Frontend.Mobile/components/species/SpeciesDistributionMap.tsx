/**
 * SpeciesDistributionMap — geographic distribution viewer for a species.
 *
 * Renders distribution points on an OpenStreetMap (Leaflet) map inside a WebView.
 * This avoids native map modules / API keys and works cross-platform.
 *
 * Bio-safety: coordinates of sensitive species are masked server-side. When the
 * response only contains masked points, a protection notice is shown instead of
 * exact locations.
 *
 * @module components/species/SpeciesDistributionMap
 */

import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useSpeciesDistributions } from "@/hooks/useSpecies";
import { THEME } from "@/lib/theme";
import { MapPin, Shield } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";

interface SpeciesDistributionMapProps {
    speciesId: string;
}

interface MapPoint {
    lat: number;
    lng: number;
    label: string;
}

/** Build the self-contained Leaflet HTML document with injected points. */
function buildMapHtml(points: MapPoint[]): string {
    const serialized = JSON.stringify(points).replace(/</g, "\\u003c");
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#map{height:100%;margin:0;padding:0;background:transparent;}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var points = ${serialized};
  var map = L.map('map', { zoomControl: true, attributionControl: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  var coords = [];
  points.forEach(function (p) {
    var marker = L.circleMarker([p.lat, p.lng], {
      radius: 8, color: '#15803d', fillColor: '#22c55e', fillOpacity: 0.85, weight: 2
    }).addTo(map);
    if (p.label) { marker.bindPopup(p.label); }
    coords.push([p.lat, p.lng]);
  });
  if (coords.length === 1) { map.setView(coords[0], 11); }
  else if (coords.length > 1) { map.fitBounds(coords, { padding: [30, 30] }); }
  else { map.setView([5.07, -75.52], 8); }
</script>
</body>
</html>`;
}

export function SpeciesDistributionMap({
    speciesId,
}: SpeciesDistributionMapProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const { data: distributions, isLoading } =
        useSpeciesDistributions(speciesId);

    const points = useMemo<MapPoint[]>(() => {
        return (distributions ?? [])
            .filter((d) => d.latitude != null && d.longitude != null)
            .map((d) => ({
                lat: d.latitude as number,
                lng: d.longitude as number,
                label: [d.municipality, d.ecosystemType]
                    .filter(Boolean)
                    .join(" · "),
            }));
    }, [distributions]);

    const hasMaskedPoints = useMemo(
        () => (distributions ?? []).some((d) => d.isMasked),
        [distributions],
    );

    const html = useMemo(() => buildMapHtml(points), [points]);

    return (
        <View className="px-5 mt-3">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Mapa de Distribución
            </Text>

            <Card className="border-0 shadow-sm overflow-hidden">
                {isLoading ? (
                    <CardContent className="items-center justify-center py-10">
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text className="text-xs text-muted-foreground mt-3">
                            Cargando distribución...
                        </Text>
                    </CardContent>
                ) : points.length > 0 ? (
                    <View>
                        <View style={{ height: 240 }}>
                            <WebView
                                originWhitelist={["*"]}
                                source={{ html }}
                                style={{ flex: 1, backgroundColor: "transparent" }}
                                scrollEnabled={false}
                                nestedScrollEnabled
                                javaScriptEnabled
                                domStorageEnabled
                            />
                        </View>
                        {hasMaskedPoints && (
                            <View className="flex-row items-center gap-2 px-4 py-2.5 bg-warning/10">
                                <Shield
                                    size={13}
                                    color={theme.warning}
                                    strokeWidth={1.8}
                                />
                                <Text className="text-[11px] text-warning flex-1">
                                    Algunas ubicaciones exactas están protegidas
                                    por ser especie sensible.
                                </Text>
                            </View>
                        )}
                    </View>
                ) : hasMaskedPoints ? (
                    <CardContent className="items-center justify-center py-10">
                        <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-3">
                            <Shield
                                size={28}
                                color={theme.warning}
                                strokeWidth={1.2}
                            />
                        </View>
                        <Text className="text-sm font-semibold text-foreground mb-1">
                            Ubicación Protegida
                        </Text>
                        <Text className="text-xs text-muted-foreground text-center px-4">
                            Las coordenadas exactas de esta especie sensible
                            están enmascaradas por protección de biodiversidad.
                        </Text>
                    </CardContent>
                ) : (
                    <CardContent className="items-center justify-center py-10">
                        <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-3">
                            <MapPin
                                size={28}
                                color={theme.mutedForeground}
                                strokeWidth={1.2}
                            />
                        </View>
                        <Text className="text-sm font-semibold text-foreground mb-1">
                            Sin Datos
                        </Text>
                        <Text className="text-xs text-muted-foreground text-center px-4">
                            No hay datos de distribución geográfica disponibles
                            para esta especie.
                        </Text>
                    </CardContent>
                )}
            </Card>
        </View>
    );
}
