/**
 * PlatformStats — 3-column stats row (species count, identifications, accuracy).
 */

import { Text } from "@/components/ui/text";
import { MOCK_STATS } from "@/lib/mock-data";
import { THEME } from "@/lib/theme";
import { FlaskConical, TreePine, TrendingUp } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";

export function PlatformStats() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const stats = MOCK_STATS;

    return (
        <View className="px-5 mb-6">
            <Text className="text-lg font-bold text-foreground mb-4">
                Plataforma en Cifras
            </Text>
            <View className="flex-row gap-3">
                <View className="flex-1 bg-card border border-border rounded-2xl p-4 items-center">
                    <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mb-2">
                        <TreePine
                            size={18}
                            color={theme.primary}
                            strokeWidth={1.8}
                        />
                    </View>
                    <Text className="text-xl font-bold text-foreground">
                        {stats.totalSpecies}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground mt-0.5 text-center">
                        Especies
                    </Text>
                </View>
                <View className="flex-1 bg-card border border-border rounded-2xl p-4 items-center">
                    <View className="w-10 h-10 rounded-xl bg-info/10 items-center justify-center mb-2">
                        <FlaskConical
                            size={18}
                            color={theme.info}
                            strokeWidth={1.8}
                        />
                    </View>
                    <Text className="text-xl font-bold text-foreground">
                        {stats.totalIdentifications}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground mt-0.5 text-center">
                        Identificaciones
                    </Text>
                </View>
                <View className="flex-1 bg-card border border-border rounded-2xl p-4 items-center">
                    <View className="w-10 h-10 rounded-xl bg-warning/10 items-center justify-center mb-2">
                        <TrendingUp
                            size={18}
                            color={theme.warning}
                            strokeWidth={1.8}
                        />
                    </View>
                    <Text className="text-xl font-bold text-foreground">
                        {stats.modelAccuracy}%
                    </Text>
                    <Text className="text-[10px] text-muted-foreground mt-0.5 text-center">
                        Precisión IA
                    </Text>
                </View>
            </View>
        </View>
    );
}
