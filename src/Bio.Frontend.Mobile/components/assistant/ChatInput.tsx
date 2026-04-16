/**
 * ChatInput — Bottom input bar with multiline TextInput and Send button.
 */

import { THEME } from "@/lib/theme";
import { Send } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, TextInput, View } from "react-native";

interface ChatInputProps {
    value: string;
    onChange: (text: string) => void;
    onSend: () => void;
    disabled?: boolean;
}

export function ChatInput({
    value,
    onChange,
    onSend,
    disabled = false,
}: ChatInputProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const canSend = value.trim() && !disabled;

    return (
        <View className="px-4 pb-6 pt-3 border-t border-border bg-background">
            <View className="flex-row items-end gap-2">
                <View className="flex-1 bg-card border border-border rounded-2xl px-4 py-2.5 min-h-[48px] max-h-[120px]">
                    <TextInput
                        value={value}
                        onChangeText={onChange}
                        placeholder="Pregunta sobre biodiversidad..."
                        placeholderTextColor={theme.mutedForeground}
                        multiline
                        style={{
                            color: theme.foreground,
                            fontSize: 15,
                            lineHeight: 20,
                            maxHeight: 100,
                        }}
                        onSubmitEditing={onSend}
                        blurOnSubmit={false}
                    />
                </View>
                <Pressable
                    onPress={onSend}
                    disabled={!canSend}
                    className="active:opacity-70"
                >
                    <View
                        className={`w-12 h-12 rounded-2xl items-center justify-center ${
                            canSend ? "bg-primary" : "bg-muted"
                        }`}
                    >
                        <Send
                            size={20}
                            color={
                                canSend
                                    ? theme.primaryForeground
                                    : theme.mutedForeground
                            }
                            strokeWidth={2}
                        />
                    </View>
                </Pressable>
            </View>
        </View>
    );
}
