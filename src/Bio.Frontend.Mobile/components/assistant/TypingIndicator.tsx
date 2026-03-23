/**
 * TypingIndicator — 3-dot animated indicator shown while assistant is "typing".
 */

import { THEME } from "@/lib/theme";
import { Bot } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";

export function TypingIndicator() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <View className="mb-3 px-4 items-start">
            <View className="flex-row items-end gap-2">
                <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center mb-1">
                    <Bot
                        size={16}
                        color={theme.primary}
                        strokeWidth={1.8}
                    />
                </View>
                <View className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                    <View className="flex-row gap-1.5 items-center">
                        <View className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                        <View className="w-2 h-2 rounded-full bg-muted-foreground/60" />
                        <View className="w-2 h-2 rounded-full bg-muted-foreground/80" />
                    </View>
                </View>
            </View>
        </View>
    );
}
