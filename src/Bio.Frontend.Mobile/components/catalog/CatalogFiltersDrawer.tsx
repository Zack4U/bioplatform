import {
    BottomSheet,
    BottomSheetBody,
    BottomSheetFooter,
    BottomSheetHeader,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { formatConservationStatus } from "@/lib/formatters";
import type { SpeciesFilterMeta, SpeciesSearchParams } from "@/types";
import { Check, Search } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from "react-native";

type CatalogFilterState = Pick<
    SpeciesSearchParams,
    | "kingdom"
    | "phylum"
    | "className"
    | "orderName"
    | "family"
    | "genus"
    | "conservationStatus"
    | "isSensitive"
>;

interface CatalogFiltersDrawerProps {
    open: boolean;
    onClose: () => void;
    onApply: () => void;
    onClear: () => void;
    value: CatalogFilterState;
    onChange: (next: CatalogFilterState) => void;
    filterMeta?: SpeciesFilterMeta;
}

interface ChoiceOption<T> {
    label: string;
    value: T;
}

interface SearchableFilterSectionProps {
    title: string;
    options: ChoiceOption<string | undefined>[];
    selected: string | undefined;
    onSelect: (value: string | undefined) => void;
    searchPlaceholder?: string;
}

const OPTIONS_PAGE_SIZE = 20;

function SearchableFilterSection({
    title,
    options,
    selected,
    onSelect,
    searchPlaceholder = "Buscar opcion...",
}: SearchableFilterSectionProps) {
    const { colorScheme } = useColorScheme();
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleCount, setVisibleCount] = useState(OPTIONS_PAGE_SIZE);

    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filteredOptions = useMemo(() => {
        if (!normalizedQuery) {
            return options;
        }

        return options.filter((option) => {
            if (option.value === undefined) {
                return true;
            }
            return option.label.toLowerCase().includes(normalizedQuery);
        });
    }, [options, normalizedQuery]);

    useEffect(() => {
        setVisibleCount(OPTIONS_PAGE_SIZE);
    }, [normalizedQuery, options]);

    const visibleOptions = useMemo(
        () => filteredOptions.slice(0, visibleCount),
        [filteredOptions, visibleCount],
    );

    const canLoadMore = visibleCount < filteredOptions.length;

    const loadMore = () => {
        if (!canLoadMore) return;
        setVisibleCount((current) => current + OPTIONS_PAGE_SIZE);
    };

    const handleListScroll = (
        event: NativeSyntheticEvent<NativeScrollEvent>,
    ) => {
        const { layoutMeasurement, contentOffset, contentSize } =
            event.nativeEvent;

        const remaining =
            contentSize.height - (layoutMeasurement.height + contentOffset.y);

        if (remaining < 40) {
            loadMore();
        }
    };

    const mutedColor =
        colorScheme === "dark" ? "hsl(149, 10%, 65%)" : "hsl(149, 10%, 50%)";

    return (
        <View className="mb-5">
            <Text className="text-sm font-semibold text-foreground mb-2">
                {title}
            </Text>

            <View className="relative mb-2">
                <View className="absolute left-3 top-0 bottom-0 z-10 justify-center">
                    <Search size={14} color={mutedColor} />
                </View>
                <Input
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder={searchPlaceholder}
                    className="h-9 pl-9 text-sm"
                    autoCorrect={false}
                />
            </View>

            <View className="rounded-xl border border-border bg-card max-h-44 overflow-hidden">
                <ScrollView
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                    keyboardShouldPersistTaps="handled"
                    onScroll={handleListScroll}
                    scrollEventThrottle={16}
                >
                    {visibleOptions.length === 0 && (
                        <View className="px-3 py-3">
                            <Text className="text-xs text-muted-foreground">
                                Sin coincidencias.
                            </Text>
                        </View>
                    )}

                    {visibleOptions.map((option) => {
                        const isActive = selected === option.value;
                        return (
                            <Pressable
                                key={
                                    String(option.value ?? "all") + option.label
                                }
                                className="flex-row items-center justify-between px-3 py-2.5"
                                onPress={() => onSelect(option.value)}
                            >
                                <Text
                                    className={`text-sm ${
                                        isActive
                                            ? "font-semibold text-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    {option.label}
                                </Text>
                                {isActive && (
                                    <Check
                                        size={16}
                                        color={mutedColor}
                                        strokeWidth={2.2}
                                    />
                                )}
                            </Pressable>
                        );
                    })}

                    {canLoadMore && (
                        <View className="px-3 py-2">
                            <Text className="text-[11px] text-muted-foreground">
                                Desliza para cargar mas opciones...
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

interface SensitivitySectionProps {
    selected: boolean | undefined;
    onSelect: (value: boolean | undefined) => void;
}

function SensitivitySection({ selected, onSelect }: SensitivitySectionProps) {
    const options: ChoiceOption<boolean | undefined>[] = [
        { label: "Todos", value: undefined },
        { label: "Solo sensibles", value: true },
        { label: "No sensibles", value: false },
    ];

    return (
        <View className="mb-3">
            <Text className="text-sm font-semibold text-foreground mb-2">
                Sensibilidad
            </Text>
            <View className="rounded-xl border border-border bg-card overflow-hidden">
                {options.map((option) => {
                    const isActive = selected === option.value;
                    return (
                        <Pressable
                            key={String(option.value ?? "all") + option.label}
                            className="flex-row items-center justify-between px-3 py-2.5"
                            onPress={() => onSelect(option.value)}
                        >
                            <Text
                                className={`text-sm ${
                                    isActive
                                        ? "font-semibold text-foreground"
                                        : "text-muted-foreground"
                                }`}
                            >
                                {option.label}
                            </Text>
                            {isActive && (
                                <Text className="text-xs font-semibold text-primary">
                                    Activo
                                </Text>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

export function CatalogFiltersDrawer({
    open,
    onClose,
    onApply,
    onClear,
    value,
    onChange,
    filterMeta,
}: CatalogFiltersDrawerProps) {
    const updateFilter = <K extends keyof CatalogFilterState>(
        key: K,
        nextValue: CatalogFilterState[K],
    ) => {
        onChange({
            ...value,
            [key]: nextValue,
        });
    };

    const kingdomOptions = useMemo(
        () => [
            { label: "Todos", value: undefined },
            ...(filterMeta?.kingdoms ?? []).map((entry) => ({
                label: entry,
                value: entry,
            })),
        ],
        [filterMeta?.kingdoms],
    );

    const phylumOptions = useMemo(
        () => [
            { label: "Todos", value: undefined },
            ...(filterMeta?.phylums ?? []).map((entry) => ({
                label: entry,
                value: entry,
            })),
        ],
        [filterMeta?.phylums],
    );

    const familyOptions = useMemo(
        () => [
            { label: "Todas", value: undefined },
            ...(filterMeta?.families ?? []).map((entry) => ({
                label: entry,
                value: entry,
            })),
        ],
        [filterMeta?.families],
    );

    const classOptions = useMemo(
        () => [
            { label: "Todas", value: undefined },
            ...(filterMeta?.classes ?? []).map((entry) => ({
                label: entry,
                value: entry,
            })),
        ],
        [filterMeta?.classes],
    );

    const orderOptions = useMemo(
        () => [
            { label: "Todos", value: undefined },
            ...(filterMeta?.orders ?? []).map((entry) => ({
                label: entry,
                value: entry,
            })),
        ],
        [filterMeta?.orders],
    );

    const genusOptions = useMemo(
        () => [
            { label: "Todos", value: undefined },
            ...(filterMeta?.genera ?? []).map((entry) => ({
                label: entry,
                value: entry,
            })),
        ],
        [filterMeta?.genera],
    );

    const conservationStatusOptions = useMemo(
        () => [
            { label: "Todos", value: undefined },
            ...(filterMeta?.conservationStatuses ?? []).map((entry) => ({
                label: formatConservationStatus(entry),
                value: entry,
            })),
        ],
        [filterMeta?.conservationStatuses],
    );

    return (
        <BottomSheet open={open} onClose={onClose} snapPoint={0.88}>
            <BottomSheetHeader>
                <Text className="text-lg font-bold text-foreground">
                    Filtros del catalogo
                </Text>
                <Text className="text-xs text-muted-foreground mt-1">
                    Usa el buscador dentro de cada filtro para encontrar
                    opciones rapidamente.
                </Text>
            </BottomSheetHeader>

            <BottomSheetBody>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 8 }}
                >
                    <SearchableFilterSection
                        title="Reino"
                        options={kingdomOptions}
                        selected={value.kingdom}
                        onSelect={(next) => updateFilter("kingdom", next)}
                        searchPlaceholder="Buscar reino..."
                    />
                    <SearchableFilterSection
                        title="Filo"
                        options={phylumOptions}
                        selected={value.phylum}
                        onSelect={(next) => updateFilter("phylum", next)}
                        searchPlaceholder="Buscar filo..."
                    />
                    <SearchableFilterSection
                        title="Clase"
                        options={classOptions}
                        selected={value.className}
                        onSelect={(next) => updateFilter("className", next)}
                        searchPlaceholder="Buscar clase..."
                    />
                    <SearchableFilterSection
                        title="Orden"
                        options={orderOptions}
                        selected={value.orderName}
                        onSelect={(next) => updateFilter("orderName", next)}
                        searchPlaceholder="Buscar orden..."
                    />
                    <SearchableFilterSection
                        title="Familia"
                        options={familyOptions}
                        selected={value.family}
                        onSelect={(next) => updateFilter("family", next)}
                        searchPlaceholder="Buscar familia..."
                    />
                    <SearchableFilterSection
                        title="Genero"
                        options={genusOptions}
                        selected={value.genus}
                        onSelect={(next) => updateFilter("genus", next)}
                        searchPlaceholder="Buscar genero..."
                    />
                    <SearchableFilterSection
                        title="Estado de conservacion"
                        options={conservationStatusOptions}
                        selected={value.conservationStatus}
                        onSelect={(next) =>
                            updateFilter("conservationStatus", next)
                        }
                        searchPlaceholder="Buscar estado..."
                    />
                    <SensitivitySection
                        selected={value.isSensitive}
                        onSelect={(next) => updateFilter("isSensitive", next)}
                    />
                </ScrollView>
            </BottomSheetBody>

            <BottomSheetFooter className="flex-row gap-2 pb-10">
                <Button
                    variant="outline"
                    className="flex-1 h-11 rounded-xl"
                    onPress={onClear}
                >
                    <Text>Limpiar</Text>
                </Button>
                <Button className="flex-1 h-11 rounded-xl" onPress={onApply}>
                    <Text>Aplicar filtros</Text>
                </Button>
            </BottomSheetFooter>
        </BottomSheet>
    );
}
