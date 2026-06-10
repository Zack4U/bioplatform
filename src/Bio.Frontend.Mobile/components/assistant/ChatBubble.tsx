/**
 * ChatBubble — Renders a single chat message (user or assistant).
 * Includes avatar, bubble styling, and source reference chips.
 */

import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import type { ChatMessage } from "@/types";
import { Bot, Leaf } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";

interface ChatBubbleProps {
    message: ChatMessage;
}

export function ChatBubble({ message }: ChatBubbleProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const isUser = message.role === "user";

    return (
        <View className={`mb-3 px-4 ${isUser ? "items-end" : "items-start"}`}>
            {/* Avatar + Bubble */}
            <View
                className={`flex-row items-end gap-2 max-w-[85%] ${
                    isUser ? "flex-row-reverse" : ""
                }`}
            >
                {/* Avatar */}
                {!isUser && (
                    <View className="w-8 h-8 rounded-full bg-primary/15 items-center justify-center mb-1">
                        <Bot
                            size={16}
                            color={theme.primary}
                            strokeWidth={1.8}
                        />
                    </View>
                )}

                {/* Bubble */}
                <View
                    className={`rounded-2xl px-4 py-3 ${
                        isUser
                            ? "bg-primary rounded-br-sm"
                            : "bg-card border border-border rounded-bl-sm"
                    }`}
                    style={
                        !isUser
                            ? {
                                  elevation: 2,
                                  shadowColor: "#000",
                                  shadowOffset: { width: 0, height: 1 },
                                  shadowOpacity: 0.05,
                                  shadowRadius: 4,
                              }
                            : undefined
                    }
                >
                    <Text
                        className={`text-sm leading-5 ${
                            isUser
                                ? "text-primary-foreground"
                                : "text-foreground"
                        }`}
                    >
                        {message.content}
                    </Text>
                </View>
            </View>

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
                <View className="mt-2 ml-10 flex-row flex-wrap gap-1.5">
                    {message.sources.map((src) => (
                        <View
                            key={src.speciesId}
                            className="flex-row items-center gap-1 bg-accent/50 px-2.5 py-1 rounded-lg"
                        >
                            <Leaf
                                size={10}
                                color={theme.primary}
                                strokeWidth={2}
                            />
                            <Text className="text-[10px] text-primary font-medium">
                                {src.scientificName}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
}
