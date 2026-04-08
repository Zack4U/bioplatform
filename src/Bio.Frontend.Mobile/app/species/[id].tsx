/**
 * Species Detail Screen — Full information about a single species.
 *
 * Route: /species/[id]
 *
 * Sections:
 * - Header with back button, thumbnail, scientific + common names
 * - Taxonomy hierarchy card
 * - Info sections: description, ecology, traditional uses, economic potential
 * - Conservation status, altitude, legal/sensitive badges
 * - Image gallery placeholder (no images endpoint yet)
 * - Distribution map placeholder (no distributions endpoint yet)
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useSpeciesDetail } from "@/hooks/useSpecies";
import {
    formatConservationStatus,
    getConservationStatusBadgeStyle,
} from "@/lib/formatters";
import { THEME } from "@/lib/theme";
import type { SpeciesSearchParams } from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import {
    AlertTriangle,
    ArrowLeft,
    Camera,
    ChevronRight,
    Globe,
    Leaf,
    MapPin,
    Mountain,
    Scale,
    Shield,
    Sparkles,
    TreePine,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    View,
} from "react-native";

// ─── InfoSection ─────────────────────────────────────────────────────────────

interface InfoSectionProps {
    icon: React.ReactNode;
    title: string;
    content: string | null;
}

function InfoSection({ icon, title, content }: InfoSectionProps) {
    if (!content) return null;
    return (
        <Card className="border-0 shadow-sm mb-3">
            <CardContent className="p-4">
                <View className="flex-row items-center gap-2 mb-2">
                    {icon}
                    <Text className="text-sm font-bold text-foreground">
                        {title}
                    </Text>
                </View>
                <Text className="text-sm text-muted-foreground leading-6">
                    {content}
                </Text>
            </CardContent>
        </Card>
    );
}

// ─── TaxonomyRow ─────────────────────────────────────────────────────────────

function TaxonomyRow({
    label,
    value,
    isLast,
    onPress,
}: {
    label: string;
    value: string | null;
    isLast?: boolean;
    onPress?: () => void;
}) {
    if (!value) return null;

    const RowComponent = onPress ? Pressable : View;

    return (
        <RowComponent
            onPress={onPress}
            className={`flex-row items-center justify-between py-2.5 ${!isLast ? "border-b border-border" : ""}`}
        >
            <Text className="text-xs text-muted-foreground uppercase tracking-wider">
                {label}
            </Text>
            <View className="flex-row items-center gap-1">
                <Text className="text-sm font-medium text-foreground">
                    {value}
                </Text>
                {onPress && (
                    <ChevronRight size={12} color="hsl(149, 10%, 50%)" />
                )}
            </View>
        </RowComponent>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function SpeciesDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { data: species, isLoading, isError } = useSpeciesDetail(id ?? "");

    if (isLoading) {
        return (
            <View className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator size="large" color={theme.primary} />
                <Text className="text-sm text-muted-foreground mt-4">
                    Cargando especie...
                </Text>
            </View>
        );
    }

    if (isError || !species) {
        return (
            <View className="flex-1 bg-background items-center justify-center px-8">
                <AlertTriangle
                    size={48}
                    color={theme.destructive}
                    strokeWidth={1.5}
                />
                <Text className="text-lg font-bold text-foreground mt-4 mb-2">
                    Especie no encontrada
                </Text>
                <Text className="text-sm text-muted-foreground text-center mb-6">
                    No se pudo cargar la informacion de esta especie.
                </Text>
                <Pressable onPress={() => router.back()}>
                    <Text className="text-primary font-semibold">Volver</Text>
                </Pressable>
            </View>
        );
    }

    const taxonomy = species.taxonomy;
    const conservationBadgeStyle = getConservationStatusBadgeStyle(
        species.conservationStatus,
    );

    const navigateToCatalogWithFilter = (
        next: Pick<
            SpeciesSearchParams,
            | "kingdom"
            | "phylum"
            | "className"
            | "orderName"
            | "family"
            | "genus"
            | "query"
        >,
    ) => {
        const params = new URLSearchParams();

        if (next.kingdom) params.set("kingdom", next.kingdom);
        if (next.phylum) params.set("phylum", next.phylum);
        if (next.className) params.set("className", next.className);
        if (next.orderName) params.set("orderName", next.orderName);
        if (next.family) params.set("family", next.family);
        if (next.genus) params.set("genus", next.genus);
        if (next.query) params.set("query", next.query);

        const queryString = params.toString();
        router.push(
            (queryString
                ? `/(tabs)/catalog?${queryString}`
                : "/(tabs)/catalog") as never,
        );
    };

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            {/* ─── Header ──────────────────────────────────────── */}
            <View className="px-5 pt-14">
                <Pressable
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center active:opacity-70 mb-4"
                >
                    <ArrowLeft
                        size={18}
                        color={theme.foreground}
                        strokeWidth={1.8}
                    />
                </Pressable>
            </View>

            {/* ─── Hero Section ──────────────────────────────── */}
            <View className="items-center px-6 pb-6">
                <View className="w-28 h-28 rounded-3xl bg-primary/10 items-center justify-center mb-4 overflow-hidden">
                    {species.thumbnailUrl ? (
                        <Image
                            source={{ uri: species.thumbnailUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Leaf
                            size={48}
                            color={theme.primary}
                            strokeWidth={1.5}
                        />
                    )}
                </View>
                <Text className="text-xl font-bold text-foreground text-center italic">
                    {species.scientificName}
                </Text>
                {species.commonName && (
                    <Text className="text-sm text-muted-foreground text-center mt-1">
                        {species.commonName}
                    </Text>
                )}

                {/* Status Badges */}
                <View className="flex-row flex-wrap items-center justify-center gap-2 mt-3">
                    {species.conservationStatus && (
                        <Badge
                            className={`${conservationBadgeStyle.containerClass} border-0 px-3 py-1`}
                        >
                            <Text
                                className={`text-xs font-semibold ${conservationBadgeStyle.textClass}`}
                            >
                                {formatConservationStatus(
                                    species.conservationStatus,
                                )}
                            </Text>
                        </Badge>
                    )}
                    {species.isSensitive && (
                        <Badge className="bg-destructive/15 border-0 px-3 py-1">
                            <Text className="text-xs text-destructive font-semibold">
                                Especie Sensible
                            </Text>
                        </Badge>
                    )}
                    {species.legalStatus && (
                        <Badge className="bg-primary/15 border-0 px-3 py-1">
                            <Text className="text-xs text-primary font-semibold">
                                Proteccion Legal
                            </Text>
                        </Badge>
                    )}
                </View>
            </View>

            {/* ─── Taxonomy Card ─────────────────────────────── */}
            {taxonomy && (
                <View className="px-5 mb-3">
                    <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Taxonomia
                    </Text>
                    <Card className="border-0 shadow-sm">
                        <CardContent className="px-4 py-1">
                            <TaxonomyRow
                                label="Reino"
                                value={taxonomy.kingdom}
                                onPress={() =>
                                    navigateToCatalogWithFilter({
                                        kingdom: taxonomy.kingdom ?? undefined,
                                    })
                                }
                            />
                            <TaxonomyRow
                                label="Filo"
                                value={taxonomy.phylum}
                                onPress={() =>
                                    navigateToCatalogWithFilter({
                                        phylum: taxonomy.phylum ?? undefined,
                                    })
                                }
                            />
                            <TaxonomyRow
                                label="Clase"
                                value={taxonomy.className}
                                onPress={() =>
                                    navigateToCatalogWithFilter({
                                        className:
                                            taxonomy.className ?? undefined,
                                    })
                                }
                            />
                            <TaxonomyRow
                                label="Orden"
                                value={taxonomy.orderName}
                                onPress={() =>
                                    navigateToCatalogWithFilter({
                                        orderName:
                                            taxonomy.orderName ?? undefined,
                                    })
                                }
                            />
                            <TaxonomyRow
                                label="Familia"
                                value={taxonomy.family}
                                onPress={() =>
                                    navigateToCatalogWithFilter({
                                        family: taxonomy.family ?? undefined,
                                    })
                                }
                            />
                            <TaxonomyRow
                                label="Genero"
                                value={taxonomy.genus}
                                isLast
                                onPress={() =>
                                    navigateToCatalogWithFilter({
                                        genus: taxonomy.genus ?? undefined,
                                    })
                                }
                            />
                        </CardContent>
                    </Card>
                </View>
            )}

            {/* ─── Altitude & Legal ──────────────────────────── */}
            {(species.altitudeRange || species.legalStatus) && (
                <View className="px-5 mb-3">
                    <Card className="border-0 shadow-sm">
                        <CardContent className="flex-row p-4 gap-4">
                            {species.altitudeRange && (
                                <View className="flex-1 flex-row items-center gap-2">
                                    <Mountain
                                        size={16}
                                        color={theme.mutedForeground}
                                        strokeWidth={1.5}
                                    />
                                    <View>
                                        <Text className="text-[10px] text-muted-foreground uppercase">
                                            Altitud
                                        </Text>
                                        <Text className="text-xs font-semibold text-foreground">
                                            {species.altitudeRange}
                                        </Text>
                                    </View>
                                </View>
                            )}
                            {species.legalStatus && (
                                <View className="flex-1 flex-row items-center gap-2">
                                    <Scale
                                        size={16}
                                        color={theme.primary}
                                        strokeWidth={1.5}
                                    />
                                    <View>
                                        <Text className="text-[10px] text-muted-foreground uppercase">
                                            Estado Legal
                                        </Text>
                                        <Text className="text-xs font-semibold text-primary">
                                            Protegida
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </CardContent>
                    </Card>
                </View>
            )}

            {/* ─── Info Sections ─────────────────────────────── */}
            <View className="px-5">
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Informacion
                </Text>

                <InfoSection
                    icon={
                        <Leaf
                            size={16}
                            color={theme.primary}
                            strokeWidth={1.5}
                        />
                    }
                    title="Descripcion"
                    content={species.description}
                />

                <InfoSection
                    icon={
                        <TreePine
                            size={16}
                            color={theme.success}
                            strokeWidth={1.5}
                        />
                    }
                    title="Informacion Ecologica"
                    content={species.ecologicalInfo}
                />

                <InfoSection
                    icon={
                        <Sparkles
                            size={16}
                            color={theme.warning}
                            strokeWidth={1.5}
                        />
                    }
                    title="Usos Tradicionales"
                    content={species.traditionalUses}
                />

                <InfoSection
                    icon={
                        <Globe
                            size={16}
                            color={theme.accent}
                            strokeWidth={1.5}
                        />
                    }
                    title="Potencial Economico"
                    content={species.economicPotential}
                />
            </View>

            {/* ─── Image Gallery Placeholder ──────────────────── */}
            <View className="px-5 mt-3">
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Galeria de Imagenes
                </Text>
                <Card className="border-0 shadow-sm">
                    <CardContent className="items-center justify-center py-10">
                        <Camera
                            size={32}
                            color={theme.mutedForeground}
                            strokeWidth={1.2}
                        />
                        <Text className="text-sm text-muted-foreground mt-3 text-center">
                            Sin imagenes disponibles
                        </Text>
                        <Text className="text-xs text-muted-foreground/60 mt-1 text-center">
                            Las imagenes se mostraran cuando esten disponibles
                            en el sistema.
                        </Text>
                    </CardContent>
                </Card>
            </View>

            {/* ─── Distribution Map Placeholder ──────────────── */}
            <View className="px-5 mt-3">
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Mapa de Distribucion
                </Text>
                <Card className="border-0 shadow-sm">
                    <CardContent className="items-center justify-center py-10">
                        <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-3">
                            <MapPin
                                size={28}
                                color={theme.mutedForeground}
                                strokeWidth={1.2}
                            />
                        </View>
                        <View className="flex-row items-center gap-2 mb-2">
                            <Shield
                                size={14}
                                color={theme.warning}
                                strokeWidth={1.5}
                            />
                            <Text className="text-sm font-semibold text-foreground">
                                Sin Datos
                            </Text>
                        </View>
                        <Text className="text-xs text-muted-foreground text-center px-4">
                            No hay datos de distribucion geografica disponibles
                            para esta especie en este momento.
                        </Text>
                    </CardContent>
                </Card>
            </View>
        </ScrollView>
    );
}
