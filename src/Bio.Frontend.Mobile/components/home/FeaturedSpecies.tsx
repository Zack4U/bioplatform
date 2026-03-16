/**
 * FeaturedSpecies — Horizontal ScrollView carousel of species cards.
 */

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { MOCK_SPECIES } from "@/lib/mock-data";
import { THEME } from "@/lib/theme";
import { Leaf } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";

export function FeaturedSpecies() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

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

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    gap: 12,
                }}
            >
                {MOCK_SPECIES.slice(0, 5).map((species) => (
                    <Pressable
                        key={species.id}
                        className="active:opacity-80"
                    >
                        <View className="w-44 bg-card border border-border rounded-2xl overflow-hidden">
                            {/* Image placeholder */}
                            <View className="h-28 bg-muted items-center justify-center">
                                <Leaf
                                    size={28}
                                    color={theme.mutedForeground}
                                    strokeWidth={1.2}
                                />
                            </View>
                            <View className="p-3">
                                <Text
                                    className="text-xs font-semibold text-foreground"
                                    numberOfLines={1}
                                >
                                    {species.scientificName}
                                </Text>
                                <Text
                                    className="text-[10px] text-muted-foreground mt-0.5"
                                    numberOfLines={1}
                                >
                                    {species.commonName ?? species.family}
                                </Text>
                                <View className="flex-row items-center mt-2">
                                    <Badge
                                        variant="secondary"
                                        className="px-2 py-0.5"
                                    >
                                        <Text className="text-[9px]">
                                            {species.kingdom}
                                        </Text>
                                    </Badge>
                                </View>
                            </View>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
}
