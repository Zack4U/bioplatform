/**
 * HeroSection — Branding card with decorative circles, Leaf icon, and tagline.
 */

import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import { Leaf, Sparkles } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";

export function HeroSection() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <View className="px-5 pt-14 pb-6">
            <View className="relative overflow-hidden rounded-3xl bg-primary p-6 pb-8">
                {/* Decorative circles */}
                <View className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                <View className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full bg-white/5" />

                <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-12 h-12 rounded-2xl bg-white/20 items-center justify-center">
                        <Leaf
                            size={24}
                            color={theme.primaryForeground}
                            strokeWidth={1.8}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-primary-foreground">
                            BioCommerce
                        </Text>
                        <View className="flex-row items-center gap-1">
                            <Sparkles
                                size={10}
                                color={theme.primaryForeground}
                            />
                            <Text className="text-xs text-primary-foreground/80 tracking-widest uppercase font-medium">
                                Caldas
                            </Text>
                        </View>
                    </View>
                </View>

                <Text className="text-sm text-primary-foreground/90 leading-5">
                    Descubre, identifica y conserva la biodiversidad
                    de Caldas con inteligencia artificial.
                </Text>
            </View>
        </View>
    );
}
