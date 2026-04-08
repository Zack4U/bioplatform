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

import { CatalogFiltersDrawer } from "@/components/catalog/CatalogFiltersDrawer";
import { CatalogHeader } from "@/components/catalog/CatalogHeader";
import { KingdomFilters } from "@/components/catalog/KingdomFilters";
import { SpeciesGridItem } from "@/components/catalog/SpeciesGridItem";
import { SpeciesListItem } from "@/components/catalog/SpeciesListItem";
import { SearchInput } from "@/components/common";
import { Text } from "@/components/ui/text";
import { useSpeciesFilterMeta, useSpeciesList } from "@/hooks/useSpecies";
import { THEME } from "@/lib/theme";
import type {
    SpeciesListItem as SpeciesListItemType,
    SpeciesSearchParams,
} from "@/types";
import { router, useLocalSearchParams } from "expo-router";
import { Search } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    FlatList,
    RefreshControl,
    View,
    useWindowDimensions,
} from "react-native";

export default function CatalogScreen() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { width } = useWindowDimensions();

    type CatalogFilterState = Pick<
        SpeciesSearchParams,
        | "kingdom"
        | "phylum"
        | "family"
        | "genus"
        | "conservationStatus"
        | "isSensitive"
    >;

    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<CatalogFilterState>({});
    const [draftFilters, setDraftFilters] = useState<CatalogFilterState>({});
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const routeParams = useLocalSearchParams<{
        query?: string | string[];
        kingdom?: string | string[];
        phylum?: string | string[];
        family?: string | string[];
        genus?: string | string[];
    }>();

    useEffect(() => {
        const readParam = (value?: string | string[]) =>
            Array.isArray(value) ? value[0] : value;

        const queryFromRoute = readParam(routeParams.query)?.trim();
        const kingdomFromRoute = readParam(routeParams.kingdom)?.trim();
        const phylumFromRoute = readParam(routeParams.phylum)?.trim();
        const familyFromRoute = readParam(routeParams.family)?.trim();
        const genusFromRoute = readParam(routeParams.genus)?.trim();

        const nextFilters: CatalogFilterState = {};

        if (kingdomFromRoute) nextFilters.kingdom = kingdomFromRoute;
        if (phylumFromRoute) nextFilters.phylum = phylumFromRoute;
        if (familyFromRoute) nextFilters.family = familyFromRoute;
        if (genusFromRoute) nextFilters.genus = genusFromRoute;

        const hasRouteDrivenState =
            Boolean(queryFromRoute) || Object.keys(nextFilters).length > 0;

        if (!hasRouteDrivenState) {
            return;
        }

        setSearchQuery(queryFromRoute ?? "");
        setFilters(nextFilters);
        setDraftFilters(nextFilters);
    }, [
        routeParams.query,
        routeParams.kingdom,
        routeParams.phylum,
        routeParams.family,
        routeParams.genus,
    ]);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.kingdom) count++;
        if (filters.phylum) count++;
        if (filters.family) count++;
        if (filters.genus) count++;
        if (filters.conservationStatus) count++;
        if (filters.isSensitive !== undefined) count++;
        return count;
    }, [filters]);

    const openFiltersDrawer = useCallback(() => {
        setDraftFilters(filters);
        setIsFiltersOpen(true);
    }, [filters]);

    const closeFiltersDrawer = useCallback(() => {
        setIsFiltersOpen(false);
    }, []);

    const applyFilters = useCallback(() => {
        setFilters(draftFilters);
        setIsFiltersOpen(false);
    }, [draftFilters]);

    const clearDraftFilters = useCallback(() => {
        setDraftFilters({});
    }, []);

    const { data, isLoading, refetch, isRefetching } = useSpeciesList({
        query: searchQuery || undefined,
        ...filters,
        page: 1,
        pageSize: 500,
        sortBy: "scientificName",
        sortOrder: "asc",
    });
    const { data: filterMeta } = useSpeciesFilterMeta();

    const species = data?.items ?? [];
    const totalCount = data?.totalCount ?? species.length;

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
        ({ item }: { item: SpeciesListItemType }) => (
            <SpeciesListItem
                item={item}
                onPress={() => navigateToDetail(item.id)}
            />
        ),
        [],
    );

    const renderGridItem = useCallback(
        ({ item }: { item: SpeciesListItemType }) => (
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
                    totalCount={totalCount}
                    viewMode={viewMode}
                    activeFilterCount={activeFilterCount}
                    onToggleViewMode={() =>
                        setViewMode((m) => (m === "list" ? "grid" : "list"))
                    }
                    onOpenFilters={openFiltersDrawer}
                />

                {/* Search */}
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar especie, familia, genero..."
                />

                {/* Kingdom Pills */}
                <KingdomFilters
                    options={filterMeta?.kingdoms ?? []}
                    selected={filters.kingdom}
                    onSelect={(kingdom) =>
                        setFilters((previous) => ({
                            ...previous,
                            kingdom,
                        }))
                    }
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

            <CatalogFiltersDrawer
                open={isFiltersOpen}
                onClose={closeFiltersDrawer}
                onApply={applyFilters}
                onClear={clearDraftFilters}
                value={draftFilters}
                onChange={setDraftFilters}
                filterMeta={filterMeta}
            />
        </View>
    );
}
