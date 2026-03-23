/**
 * SuggestedPrompts — Prompt chips shown when chat is empty.
 * Each chip triggers an `onSelect` callback with the prompt text.
 */

import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import {
    BookOpen,
    Leaf,
    Lightbulb,
    MessageCircle,
    Sparkles,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, View } from "react-native";

const SUGGESTED_PROMPTS = [
    {
        id: "s1",
        text: "¿Qué especies de Caldas están en peligro?",
        icon: Leaf,
    },
    {
        id: "s2",
        text: "Genera un plan de biocomercio con frailejón",
        icon: Lightbulb,
    },
    {
        id: "s3",
        text: "¿Qué es el Protocolo de Nagoya?",
        icon: BookOpen,
    },
    {
        id: "s4",
        text: "Usos tradicionales del Roble de tierra fría",
        icon: Sparkles,
    },
];

interface SuggestedPromptsProps {
    onSelect: (text: string) => void;
}

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <View className="px-4 mt-4">
            <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 ml-1">
                Sugerencias
            </Text>
            <View className="gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => {
                    const Icon = prompt.icon;
                    return (
                        <Pressable
                            key={prompt.id}
                            onPress={() => onSelect(prompt.text)}
                            className="active:opacity-70"
                        >
                            <View className="flex-row items-center gap-3 bg-card border border-border rounded-2xl p-3.5">
                                <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center">
                                    <Icon
                                        size={16}
                                        color={theme.primary}
                                        strokeWidth={1.8}
                                    />
                                </View>
                                <Text className="flex-1 text-sm text-foreground">
                                    {prompt.text}
                                </Text>
                                <MessageCircle
                                    size={14}
                                    color={theme.mutedForeground}
                                    strokeWidth={1.5}
                                />
                            </View>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}
