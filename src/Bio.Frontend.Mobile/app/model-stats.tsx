/**
 * Model Stats Screen — CNN Model statistics and health dashboard.
 *
 * Displays:
 * - Model name / architecture / status badge
 * - Health status (CNN + DB)
 * - Stats grid: CNN Classes, DB Species, Accuracy, F1 Score, Image Size, Device
 * - Full searchable list of recognized class names with per-species F1 badge
 *
 * Data fetched from:
 * - GET /api/v1/model-info   (model metadata + class names)
 * - GET /health              (live health status + DB species count)
 * - GET /api/v1/model-metrics (evaluation accuracy, F1, per-class)
 *
 * Navigable from Dashboard (PlatformStats) and Camera screen.
 */

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
    useHealthCheck,
    useModelInfo,
    useModelMetrics,
} from "@/hooks/useClassification";
import { THEME } from "@/lib/theme";
import {
    ArrowLeft,
    Brain,
    CheckCircle,
    Cpu,
    Database,
    Heart,
    Image,
    Layers,
    Search,
    Target,
    TreePine,
    XCircle,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

/** Color-code an F1/precision value. */
function metricColor(value: number): string {
    if (value >= 0.8) return "#22c55e"; // green
    if (value >= 0.5) return "#f59e0b"; // amber
    return "#ef4444"; // red
}

/** Format a 0-1 metric as percentage string. */
function pct(value: number | undefined): string {
    if (value == null) return "—";
    return `${(value * 100).toFixed(1)}%`;
}

export default function ModelStatsScreen() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { data: model, isLoading: modelLoading, error: modelError } = useModelInfo();
    const { data: health, isLoading: healthLoading } = useHealthCheck();
    const { data: metrics, isLoading: metricsLoading } = useModelMetrics();
    const [search, setSearch] = useState("");

    const isLoading = modelLoading || healthLoading;

    // Build class list with per-class metrics
    const classListWithMetrics = useMemo(() => {
        const names = model?.classNames ?? [];
        const perClass = metrics?.perClass ?? {};
        return names.map((name) => {
            const m = perClass[name];
            return {
                name,
                f1: m?.f1Score ?? null,
                precision: m?.precision ?? null,
            };
        });
    }, [model?.classNames, metrics?.perClass]);

    const filteredClasses = useMemo(() => {
        if (!search) return classListWithMetrics;
        const q = search.toLowerCase();
        return classListWithMetrics.filter((item) =>
            item.name.toLowerCase().includes(q),
        );
    }, [classListWithMetrics, search]);

    if (isLoading) {
        return (
            <SafeAreaView
                className="flex-1 bg-background items-center justify-center"
                edges={["top"]}
            >
                <ActivityIndicator size="large" color={theme.primary} />
                <Text className="text-muted-foreground mt-3">
                    Cargando estadísticas del modelo…
                </Text>
            </SafeAreaView>
        );
    }

    if (modelError || !model) {
        return (
            <SafeAreaView
                className="flex-1 bg-background items-center justify-center p-6"
                edges={["top"]}
            >
                <XCircle size={48} color={theme.destructive} strokeWidth={1.2} />
                <Text className="text-foreground font-bold text-lg mt-4 text-center">
                    Error al cargar el modelo
                </Text>
                <Text className="text-muted-foreground text-center mt-2">
                    No se pudo conectar con el servicio de IA. Verifica que el
                    backend esté activo.
                </Text>
                <Button
                    className="mt-6 rounded-xl"
                    onPress={() => router.back()}
                >
                    <Text className="text-primary-foreground font-semibold">
                        Volver
                    </Text>
                </Button>
            </SafeAreaView>
        );
    }

    const isModelActive = health?.modelLoaded ?? model.isLoaded;
    const isDbConnected = health?.databaseConnected ?? false;
    const serviceStatus = health?.status ?? "degraded";
    const dbSpeciesCount = health?.dbSpeciesCount ?? 0;

    const topStats = [
        {
            icon: Layers,
            label: "Clases CNN",
            value: `${model.numClasses}`,
            color: theme.primary,
        },
        {
            icon: TreePine,
            label: "Especies BD",
            value: `${dbSpeciesCount}`,
            color: theme.primary,
        },
        {
            icon: Target,
            label: "Precisión",
            value: pct(metrics?.accuracy),
            color: theme.primary,
        },
        {
            icon: Brain,
            label: "F1 Score",
            value: pct(metrics?.macroAvg?.f1Score),
            color: theme.primary,
        },
    ];

    const detailRows = [
        {
            icon: Cpu,
            label: "Modelo Activo",
            value: model.modelName,
        },
        {
            icon: Image,
            label: "Resolución de Imagen",
            value: `${model.imageSize}×${model.imageSize} px`,
        },
        {
            icon: Cpu,
            label: "Procesamiento",
            value: model.device.toUpperCase(),
        },
        {
            icon: isModelActive ? CheckCircle : XCircle,
            label: "Motor CNN",
            value: isModelActive ? "Operativo" : "Inactivo",
            valueColor: isModelActive ? theme.primary : theme.destructive,
        },
        {
            icon: Database,
            label: "Base de Datos",
            value: isDbConnected ? "Conectada" : "Desconectada",
            valueColor: isDbConnected ? theme.primary : theme.destructive,
        },
    ];

    const renderHeader = () => (
        <View>
            {/* ─── Top Stats Grid (4 cards) ──────────────────────── */}
            <View className="px-4 py-4 pb-2">
                <View className="flex-row flex-wrap gap-2.5">
                    {topStats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <View
                                key={stat.label}
                                className="bg-card border border-border rounded-2xl p-3.5 flex-1"
                                style={{ minWidth: "45%" }}
                            >
                                <Icon
                                    size={18}
                                    color={stat.color}
                                    strokeWidth={1.5}
                                />
                                <Text className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1.5">
                                    {stat.label}
                                </Text>
                                <Text className="text-sm font-bold text-foreground mt-0.5">
                                    {stat.value}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* ─── Technical Details List ────────────────────────── */}
            <View className="px-4 pb-4">
                <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
                    Detalles Técnicos
                </Text>
                <View className="bg-card border border-border rounded-2xl overflow-hidden">
                    {detailRows.map((row, index) => {
                        const Icon = row.icon;
                        return (
                            <View
                                key={row.label}
                                className={`flex-row items-center justify-between px-4 py-3.5 ${
                                    index < detailRows.length - 1
                                        ? "border-b border-border"
                                        : ""
                                }`}
                            >
                                <View className="flex-row items-center gap-3">
                                    <Icon
                                        size={18}
                                        color={theme.mutedForeground}
                                        strokeWidth={1.5}
                                    />
                                    <Text className="text-sm text-foreground">
                                        {row.label}
                                    </Text>
                                </View>
                                <Text
                                    className="text-sm font-semibold"
                                    style={{ color: row.valueColor || theme.foreground }}
                                >
                                    {row.value}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* ─── Class Names Header & Search ───────────────────── */}
            <View className="px-4">
                <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-1">
                    Especies reconocidas ({filteredClasses.length})
                    {metricsLoading && " · Cargando métricas…"}
                </Text>

                {/* Search bar */}
                <View className="flex-row items-center bg-card border border-border rounded-xl px-3 py-2 mb-2">
                    <Search
                        size={16}
                        color={theme.mutedForeground}
                        strokeWidth={1.5}
                    />
                    <TextInput
                        className="flex-1 ml-2 text-sm text-foreground"
                        placeholder="Buscar especie…"
                        placeholderTextColor={theme.mutedForeground}
                        value={search}
                        onChangeText={setSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            {/* ─── Header ────────────────────────────────────────── */}
            <View className="flex-row items-center px-4 py-3 border-b border-border">
                <Button
                    variant="ghost"
                    size="icon"
                    className="mr-2"
                    onPress={() => router.back()}
                >
                    <ArrowLeft
                        size={22}
                        color={theme.foreground}
                        strokeWidth={1.8}
                    />
                </Button>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">
                        Estadísticas del Modelo
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                        {model.modelName} · {model.device.toUpperCase()}
                    </Text>
                </View>
                {/* Service status badge */}
                <View
                    className="rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
                    style={{
                        backgroundColor:
                            serviceStatus === "healthy"
                                ? "rgba(34,197,94,0.15)"
                                : "rgba(239,68,68,0.15)",
                    }}
                >
                    <Heart
                        size={12}
                        color={serviceStatus === "healthy" ? "#22c55e" : "#ef4444"}
                        strokeWidth={2}
                        fill={serviceStatus === "healthy" ? "#22c55e" : "#ef4444"}
                    />
                    <Text
                        className="text-[10px] font-semibold"
                        style={{
                            color: serviceStatus === "healthy" ? "#22c55e" : "#ef4444",
                        }}
                    >
                        {serviceStatus === "healthy" ? "Saludable" : "Degradado"}
                    </Text>
                </View>
            </View>

            {/* ─── Main Content (Single Scrollable List) ─────────── */}
            <FlatList
                data={filteredClasses}
                keyExtractor={(item) => item.name}
                ListHeaderComponent={renderHeader()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24 }}
                renderItem={({ item, index }) => (
                    <View
                        className={`flex-row items-center py-2.5 mx-4 ${
                            index < filteredClasses.length - 1
                                ? "border-b border-border"
                                : ""
                        }`}
                    >
                        {/* Index */}
                        <View className="w-7 h-7 rounded-lg bg-muted items-center justify-center mr-3">
                            <Text className="text-[10px] font-bold text-muted-foreground">
                                {index + 1}
                            </Text>
                        </View>
                        {/* Species name */}
                        <Text className="text-sm text-foreground italic flex-1 mr-2" numberOfLines={1}>
                            {item.name.replace(/_/g, " ")}
                        </Text>
                        {/* F1 badge */}
                        {item.f1 != null && (
                            <View
                                className="rounded-full px-2 py-0.5 mr-1.5"
                                style={{
                                    backgroundColor: `${metricColor(item.f1)}18`,
                                }}
                            >
                                <Text
                                    className="text-[9px] font-bold"
                                    style={{ color: metricColor(item.f1) }}
                                >
                                    F1 {(item.f1 * 100).toFixed(0)}%
                                </Text>
                            </View>
                        )}
                        {/* Precision badge */}
                        {item.precision != null && (
                            <View
                                className="rounded-full px-2 py-0.5"
                                style={{
                                    backgroundColor: `${metricColor(item.precision)}18`,
                                }}
                            >
                                <Text
                                    className="text-[9px] font-bold"
                                    style={{ color: metricColor(item.precision) }}
                                >
                                    P {(item.precision * 100).toFixed(0)}%
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
