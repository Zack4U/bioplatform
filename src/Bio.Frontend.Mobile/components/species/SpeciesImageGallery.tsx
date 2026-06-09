/**
 * SpeciesImageGallery — horizontal thumbnail strip for a species' image gallery.
 *
 * - Infinite pagination (loads more on horizontal end-reached)
 * - Expert-validation filter toggle
 * - Tap a thumbnail to open the full-screen ImageLightbox (zoom/pan/swipe)
 *
 * Designed to live inside the species detail vertical ScrollView, so it uses a
 * horizontal FlatList (no nested vertical scrolling).
 *
 * @module components/species/SpeciesImageGallery
 */

import { ImageLightbox } from "@/components/species/ImageLightbox";
import { SmartImage } from "@/components/common/SmartImage";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useSpeciesGallery } from "@/hooks/useSpecies";
import { THEME } from "@/lib/theme";
import type { SpeciesImage } from "@/types";
import { Camera, ShieldCheck } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";

interface SpeciesImageGalleryProps {
    speciesId: string;
}

const THUMB_SIZE = 116;

export function SpeciesImageGallery({ speciesId }: SpeciesImageGalleryProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const [onlyValidated, setOnlyValidated] = useState(true);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useSpeciesGallery(speciesId, onlyValidated);

    const images = useMemo<SpeciesImage[]>(
        () => data?.pages.flatMap((page) => page.items) ?? [],
        [data],
    );

    const totalCount = data?.pages[0]?.totalCount ?? 0;

    const handleEndReached = () => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    };

    return (
        <View className="px-5 mt-3">
            {/* Header row: title + count + filter toggle */}
            <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Galería de Imágenes
                    {totalCount > 0 ? ` (${totalCount})` : ""}
                </Text>
                <Pressable
                    onPress={() => setOnlyValidated((v) => !v)}
                    className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${
                        onlyValidated ? "bg-emerald-500/15" : "bg-muted"
                    }`}
                >
                    <ShieldCheck
                        size={12}
                        color={onlyValidated ? "#10b981" : theme.mutedForeground}
                        strokeWidth={2}
                    />
                    <Text
                        className={`text-[10px] font-medium ${
                            onlyValidated
                                ? "text-emerald-600"
                                : "text-muted-foreground"
                        }`}
                    >
                        Validadas
                    </Text>
                </Pressable>
            </View>

            {isLoading ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="items-center justify-center py-10">
                        <ActivityIndicator size="small" color={theme.primary} />
                        <Text className="text-xs text-muted-foreground mt-3">
                            Cargando imágenes...
                        </Text>
                    </CardContent>
                </Card>
            ) : images.length === 0 ? (
                <Card className="border-0 shadow-sm">
                    <CardContent className="items-center justify-center py-10">
                        <Camera
                            size={32}
                            color={theme.mutedForeground}
                            strokeWidth={1.2}
                        />
                        <Text className="text-sm text-muted-foreground mt-3 text-center">
                            {isError
                                ? "No se pudieron cargar las imágenes"
                                : "Sin imágenes disponibles"}
                        </Text>
                        <Text className="text-xs text-muted-foreground/60 mt-1 text-center px-6">
                            {onlyValidated
                                ? "No hay imágenes validadas por expertos. Prueba desactivar el filtro."
                                : "Aún no hay imágenes registradas para esta especie."}
                        </Text>
                    </CardContent>
                </Card>
            ) : (
                <FlatList
                    data={images}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.5}
                    ItemSeparatorComponent={() => <View className="w-2.5" />}
                    renderItem={({ item, index }) => (
                        <Pressable
                            onPress={() => setLightboxIndex(index)}
                            className="rounded-2xl overflow-hidden bg-muted active:opacity-80"
                            style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                        >
                            <SmartImage
                                source={{
                                    uri: item.thumbnailUrl ?? item.imageUrl,
                                }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                            />
                            {item.isValidatedByExpert && (
                                <View className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/40 items-center justify-center">
                                    <ShieldCheck size={11} color="#10b981" />
                                </View>
                            )}
                        </Pressable>
                    )}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <View
                                className="items-center justify-center"
                                style={{ width: THUMB_SIZE, height: THUMB_SIZE }}
                            >
                                <ActivityIndicator
                                    size="small"
                                    color={theme.primary}
                                />
                            </View>
                        ) : null
                    }
                />
            )}

            <ImageLightbox
                images={images}
                initialIndex={lightboxIndex ?? 0}
                visible={lightboxIndex !== null}
                onClose={() => setLightboxIndex(null)}
            />
        </View>
    );
}
