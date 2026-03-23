/**
 * QuickActions — 3 action cards linking to Catalog, Camera, and Assistant tabs.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import { BookOpen, Bot, Camera, ChevronRight } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import type { RelativePathString } from "expo-router";

const QUICK_ACTIONS = [
    {
        id: "catalog",
        title: "Explorar Catálogo",
        subtitle: "347+ especies",
        icon: BookOpen,
        gradient: "bg-primary/10",
        route: "/(tabs)/catalog" as const,
    },
    {
        id: "identify",
        title: "Identificar Especie",
        subtitle: "CNN en tiempo real",
        icon: Camera,
        gradient: "bg-info/10",
        route: "/(tabs)/camera" as const,
    },
    {
        id: "assistant",
        title: "Asistente IA",
        subtitle: "RAG + GPT-4",
        icon: Bot,
        gradient: "bg-accent",
        route: "/(tabs)/assistant" as const,
    },
];

export function QuickActions() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <View className="px-5 mb-6">
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-foreground">
                    Acciones Rápidas
                </Text>
            </View>

            <View className="gap-3">
                {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Pressable
                            key={action.id}
                            onPress={() =>
                                router.push(
                                    action.route as RelativePathString,
                                )
                            }
                            className="active:opacity-80"
                        >
                            <Card className="border-0 shadow-sm">
                                <CardContent className="flex-row items-center p-4 gap-4">
                                    <View
                                        className={`w-12 h-12 rounded-2xl items-center justify-center ${action.gradient}`}
                                    >
                                        <Icon
                                            size={22}
                                            color={theme.primary}
                                            strokeWidth={1.8}
                                        />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="font-semibold text-foreground text-[15px]">
                                            {action.title}
                                        </Text>
                                        <Text className="text-xs text-muted-foreground mt-0.5">
                                            {action.subtitle}
                                        </Text>
                                    </View>
                                    <ChevronRight
                                        size={18}
                                        color={theme.mutedForeground}
                                    />
                                </CardContent>
                            </Card>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
