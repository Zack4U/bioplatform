/**
 * KingdomFilters — Horizontal pill row for filtering species by kingdom.
 */

import { Text } from "@/components/ui/text";
import React from "react";
import { Pressable, View } from "react-native";

interface KingdomFiltersProps {
    options?: string[];
    selected: string | undefined;
    onSelect: (kingdom: string | undefined) => void;
}

export function KingdomFilters({
    options = [],
    selected,
    onSelect,
}: KingdomFiltersProps) {
    const kingdoms = [
        { label: "Todas", value: undefined },
        ...options.map((value) => ({ label: value, value })),
    ];

    return (
        <View className="flex-row gap-2 mt-3">
            {kingdoms.map((kingdom) => {
                const isActive = selected === kingdom.value;
                return (
                    <Pressable
                        key={kingdom.label}
                        onPress={() => onSelect(kingdom.value)}
                        className={`px-4 py-2 rounded-full ${
                            isActive
                                ? "bg-primary"
                                : "bg-card border border-border"
                        }`}
                    >
                        <Text
                            className={`text-xs font-semibold ${
                                isActive
                                    ? "text-primary-foreground"
                                    : "text-foreground"
                            }`}
                        >
                            {kingdom.label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}
