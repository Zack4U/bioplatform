/**
 * Catalog Screen — Species Biodiversity Browser.
 *
 * Composes subcomponents:
 * - CatalogHeader: title, count, view-mode toggle
 * - KingdomFilters: horizontal pill row
 * - SpeciesListItem: full-width card for list mode
 * - SpeciesGridItem: compact square card for grid mode
 *
 * Features:
 * - Search input with debounce
 * - Toggle between List and Grid view modes
 * - Grid mode: responsive columns based on device width
 * - Species FlatList with pull-to-refresh
 * - Tap species to navigate to detail screen
 */

import { SearchInput } from "@/components/common";
import { Text } from "@/components/ui/text";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { KingdomFilters } from "@/components/catalog/KingdomFilters";
import { SpeciesGridItem } from "@/components/catalog/SpeciesGridItem";
import { SpeciesListItem } from "@/components/catalog/SpeciesListItem";
import { useSpeciesList } from "@/hooks/useSpecies";
import { THEME } from "@/lib/theme";
import type { SpeciesResponse } from "@/types";
import { Search } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useState } from "react";
import {
    FlatList,
    RefreshControl,
    View,
    useWindowDimensions,
} from "react-native";
import { router } from "expo-router";

export default function CatalogScreen() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { width } = useWindowDimensions();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedKingdom, setSelectedKingdom] = useState<string | undefined>(
        undefined,
    );
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

    const { data, isLoading, refetch, isRefetching } = useSpeciesList({
        query: searchQuery || undefined,
        kingdom: selectedKingdom,
    });

    const species = data ?? [];

    // Responsive grid columns
    const numColumns = viewMode === "grid" ? (width < 400 ? 2 : 3) : 1;
    const gridGap = 10;
    const gridItemWidth =
        viewMode === "grid"
            ? (width - 40 - gridGap * (numColumns - 1)) / numColumns
            : 0;

    const navigateToDetail = (id: string) => {
        router.push(`/species/${id}` as never);
    };

    // ─── Render Items ───────────────────────────────────────
    const renderListItem = useCallback(
        ({ item }: { item: SpeciesResponse }) => (
            <SpeciesListItem
                item={item}
                onPress={() => navigateToDetail(item.id)}
            />
        ),
        [],
    );

    const renderGridItem = useCallback(
        ({ item }: { item: SpeciesResponse }) => (
            <SpeciesGridItem
                item={item}
                width={gridItemWidth}
                onPress={() => navigateToDetail(item.id)}
            />
        ),
        [gridItemWidth],
    );

    // ─── Empty State ────────────────────────────────────────
    const EmptyComponent = (
        <View className="items-center justify-center py-20">
            <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-4">
                <Search
                    size={28}
                    color={theme.mutedForeground}
                    strokeWidth={1.5}
                />
            </View>
            <Text className="text-base font-semibold text-foreground mb-1">
                {isLoading ? "Cargando especies..." : "Sin resultados"}
            </Text>
            <Text className="text-sm text-muted-foreground text-center px-8">
                {isLoading
                    ? "Consultando el catalogo de biodiversidad"
                    : "Ajusta los filtros o intenta con otro termino de busqueda."}
            </Text>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-5 pt-14 pb-4">
                <CatalogHeader
                    totalCount={species.length}
                    viewMode={viewMode}
                    onToggleViewMode={() =>
                        setViewMode((m) => (m === "list" ? "grid" : "list"))
                    }
                />

                {/* Search */}
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar especie, familia, genero..."
                />

                {/* Kingdom Pills */}
                <KingdomFilters
                    selected={selectedKingdom}
                    onSelect={setSelectedKingdom}
                />
            </View>

            {/* Species List / Grid */}
            <FlatList
                key={viewMode}
                data={species}
                keyExtractor={(item) => item.id}
                renderItem={
                    viewMode === "list" ? renderListItem : renderGridItem
                }
                numColumns={numColumns}
                columnWrapperStyle={
                    viewMode === "grid"
                        ? {
                              justifyContent: "flex-start",
                              gap: gridGap,
                          }
                        : undefined
                }
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingBottom: 100,
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={() => refetch()}
                        tintColor={theme.primary}
                    />
                }
                ListEmptyComponent={EmptyComponent}
            />
        </View>
    );
}
