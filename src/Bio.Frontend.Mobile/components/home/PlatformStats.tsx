/**
 * PlatformStats — 3-column stats row with real-time health data.
 *
 * Uses `useHealthCheck()` to display live CNN metrics:
 * - numClasses → CNN species count
 * - dbSpeciesCount → database species count
 * - accuracy from useModelMetrics
 *
 * Each card is pressable → navigates to /model-stats.
 * Shows an offline banner when the AI service is unreachable.
 */

import { Text } from "@/components/ui/text";
import { useHealthCheck, useModelMetrics } from "@/hooks/useClassification";
import { THEME } from "@/lib/theme";
import { Brain, Target, TreePine } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useRouter, type Href } from "expo-router";

export function PlatformStats() {
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { data: health, isLoading, isError } = useHealthCheck();
    const { data: metrics } = useModelMetrics();

    const navigateToStats = () => {
        router.push("/model-stats" as Href);
    };

    // Loading state
    if (isLoading) {
        return (
            <View className="px-5 mb-6">
                <Text className="text-lg font-bold text-foreground mb-4">
                    Plataforma en Cifras
                </Text>
                <View className="bg-card border border-border rounded-2xl p-6 items-center">
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text className="text-xs text-muted-foreground mt-2">
                        Conectando con el servicio de IA…
                    </Text>
                </View>
            </View>
        );
    }

    // Offline / error state
    if (isError || !health) {
        return (
            <View className="px-5 mb-6">
                <Text className="text-lg font-bold text-foreground mb-4">
                    Plataforma en Cifras
                </Text>
                <View
                    className="border rounded-2xl p-4 flex-row items-center gap-3"
                    style={{
                        backgroundColor: "rgba(239,68,68,0.08)",
                        borderColor: "rgba(239,68,68,0.2)",
                    }}
                >
                    <Brain size={20} color="#ef4444" strokeWidth={1.5} />
                    <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">
                            CNN No Disponible
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                            No se pudo conectar con el servicio de IA.
                        </Text>
                    </View>
                </View>
            </View>
        );
    }

    // Format accuracy as percentage
    const accuracyPct = metrics?.accuracy
        ? `${(metrics.accuracy * 100).toFixed(1)}%`
        : "—";

    const stats = [
        {
            icon: TreePine,
            value: String(health.dbSpeciesCount || health.numClasses),
            label: "Especies BD",
            color: theme.primary,
            bgClass: "bg-primary/10",
        },
        {
            icon: Brain,
            value: String(health.numClasses),
            label: "Clases CNN",
            color: theme.primary,
            bgClass: "bg-primary/10",
        },
        {
            icon: Target,
            value: accuracyPct,
            label: "Precisión IA",
            color: theme.primary,
            bgClass: "bg-primary/10",
        },
    ];

    return (
        <View className="px-5 mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">
                Plataforma en Cifras
            </Text>
            <View className="flex-row gap-3">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Pressable
                            key={stat.label}
                            className="flex-1 bg-card border border-border rounded-2xl p-4 items-center active:opacity-70"
                            onPress={navigateToStats}
                        >
                            <View className={`w-10 h-10 rounded-xl ${stat.bgClass} items-center justify-center mb-2`}>
                                <Icon
                                    size={18}
                                    color={stat.color}
                                    strokeWidth={1.8}
                                />
                            </View>
                            <Text className="text-xl font-bold text-foreground">
                                {stat.value}
                            </Text>
                            <Text className="text-[10px] text-muted-foreground mt-0.5 text-center">
                                {stat.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
