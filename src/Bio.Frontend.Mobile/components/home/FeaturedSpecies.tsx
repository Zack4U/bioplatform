/**
 * FeaturedSpecies — Horizontal ScrollView carousel of species cards.
 * Fetches real species data from the backend.
 */

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { useSpeciesList } from "@/hooks/useSpecies";
import { THEME } from "@/lib/theme";
import { Leaf } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { router } from "expo-router";

export function FeaturedSpecies() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { data: species, isLoading } = useSpeciesList();

    const featured = (species ?? []).slice(0, 5);

    return (
        <View className="mb-6">
            <View className="flex-row items-center justify-between px-5 mb-4">
                <Text className="text-lg font-bold text-foreground">
                    Especies Destacadas
                </Text>
                <Pressable onPress={() => router.push("/(tabs)/catalog")}>
                    <Text className="text-sm font-medium text-primary">
                        Ver todas
                    </Text>
                </Pressable>
            </View>

            {isLoading ? (
                <View className="items-center justify-center py-8">
                    <ActivityIndicator size="small" color={theme.primary} />
                </View>
            ) : featured.length === 0 ? (
                <View className="items-center justify-center py-8 px-5">
                    <Text className="text-sm text-muted-foreground">
                        No hay especies disponibles
                    </Text>
                </View>
            ) : (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal: 20,
                        gap: 12,
                    }}
                >
                    {featured.map((sp) => (
                        <Pressable
                            key={sp.id}
                            className="active:opacity-80"
                            onPress={() => router.push(`/species/${sp.id}` as never)}
                        >
                            <View className="w-44 bg-card border border-border rounded-2xl overflow-hidden">
                                {/* Image / placeholder */}
                                <View className="h-28 bg-muted items-center justify-center overflow-hidden">
                                    {sp.thumbnailUrl ? (
                                        <Image
                                            source={{ uri: sp.thumbnailUrl }}
                                            className="w-full h-full"
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Leaf
                                            size={28}
                                            color={theme.mutedForeground}
                                            strokeWidth={1.2}
                                        />
                                    )}
                                </View>
                                <View className="p-3">
                                    <Text
                                        className="text-xs font-semibold text-foreground"
                                        numberOfLines={1}
                                    >
                                        {sp.scientificName}
                                    </Text>
                                    <Text
                                        className="text-[10px] text-muted-foreground mt-0.5"
                                        numberOfLines={1}
                                    >
                                        {sp.commonName ??
                                            sp.taxonomy?.family ??
                                            "—"}
                                    </Text>
                                    <View className="flex-row items-center mt-2">
                                        <Badge
                                            variant="secondary"
                                            className="px-2 py-0.5"
                                        >
                                            <Text className="text-[9px]">
                                                {sp.taxonomy?.kingdom ?? "—"}
                                            </Text>
                                        </Badge>
                                    </View>
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}
