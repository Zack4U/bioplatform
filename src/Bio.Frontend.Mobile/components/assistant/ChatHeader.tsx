/**
 * ChatHeader — Assistant screen header with bot icon, title and status badge.
 */

import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import { Bot } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";

export function ChatHeader() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <View className="px-5 pt-14 pb-3 border-b border-border bg-background">
            <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center">
                    <Bot
                        size={22}
                        color={theme.primary}
                        strokeWidth={1.5}
                    />
                </View>
                <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">
                        Asistente BioCommerce
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                        RAG · Biodiversidad de Caldas
                    </Text>
                </View>
                <View className="flex-row items-center gap-1 bg-success/10 px-2.5 py-1 rounded-full">
                    <View className="w-1.5 h-1.5 rounded-full bg-success" />
                    <Text className="text-[10px] text-success font-medium">
                        Demo
                    </Text>
                </View>
            </View>
        </View>
    );
}
