/**
 * KingdomFilters — Horizontal pill row for filtering species by kingdom.
 */

import { Text } from "@/components/ui/text";
import React from "react";
import { Pressable, View } from "react-native";

const KINGDOMS = [
    { label: "Todas", value: undefined },
    { label: "🌿 Plantae", value: "Plantae" },
    { label: "🐾 Animalia", value: "Animalia" },
    { label: "🍄 Fungi", value: "Fungi" },
];

interface KingdomFiltersProps {
    selected: string | undefined;
    onSelect: (kingdom: string | undefined) => void;
}

export function KingdomFilters({ selected, onSelect }: KingdomFiltersProps) {
    return (
        <View className="flex-row gap-2 mt-3">
            {KINGDOMS.map((kingdom) => {
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
