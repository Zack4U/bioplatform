/**
 * CatalogHeader — Title, species count, view-mode toggle, and filters button.
 */

import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import { LayoutGrid, LayoutList, SlidersHorizontal } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, View } from "react-native";

interface CatalogHeaderProps {
    totalCount: number;
    viewMode: "list" | "grid";
    activeFilterCount: number;
    onToggleViewMode: () => void;
    onOpenFilters: () => void;
}

export function CatalogHeader({
    totalCount,
    viewMode,
    activeFilterCount,
    onToggleViewMode,
    onOpenFilters,
}: CatalogHeaderProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <View className="flex-row items-center justify-between mb-4">
            <View>
                <Text className="text-2xl font-bold text-foreground">
                    Catálogo
                </Text>
                <Text className="text-sm text-muted-foreground mt-0.5">
                    {totalCount} especies registradas
                </Text>
            </View>
            <View className="flex-row items-center gap-2">
                {/* View Mode Toggle */}
                <Pressable
                    onPress={onToggleViewMode}
                    className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center active:opacity-70"
                >
                    {viewMode === "list" ? (
                        <LayoutGrid
                            size={18}
                            color={theme.foreground}
                            strokeWidth={1.8}
                        />
                    ) : (
                        <LayoutList
                            size={18}
                            color={theme.foreground}
                            strokeWidth={1.8}
                        />
                    )}
                </Pressable>
                {/* Filters */}
                <Pressable
                    onPress={onOpenFilters}
                    className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center"
                >
                    <SlidersHorizontal
                        size={18}
                        color={theme.foreground}
                        strokeWidth={1.8}
                    />
                    {activeFilterCount > 0 && (
                        <View className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-primary items-center justify-center">
                            <Text className="text-[10px] font-bold text-primary-foreground">
                                {activeFilterCount}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>
        </View>
    );
}
