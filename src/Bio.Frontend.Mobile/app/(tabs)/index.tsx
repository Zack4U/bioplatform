/**
 * Home Screen — BioCommerce Caldas Mobile.
 *
 * Composes subcomponents:
 * - HeroSection: branding card
 * - QuickActions: 3 action cards
 * - PlatformStats: 3-column stats row
 * - FeaturedSpecies: horizontal carousel
 *
 * Also includes an AI Assistant banner card.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { FeaturedSpecies } from "@/components/home/FeaturedSpecies";
import { HeroSection } from "@/components/home/HeroSection";
import { PlatformStats } from "@/components/home/PlatformStats";
import { QuickActions } from "@/components/home/QuickActions";
import { THEME } from "@/lib/theme";
import { Bot } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, View } from "react-native";

export default function HomeScreen() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {/* Hero */}
            <HeroSection />

            {/* Quick Actions */}
            <QuickActions />

            {/* Stats */}
            <PlatformStats />

            {/* Featured Species */}
            <FeaturedSpecies />

            {/* AI Banner */}
            <View className="px-5 mb-6">
                <Card className="bg-accent border-0">
                    <CardContent className="flex-row items-center p-4 gap-4">
                        <View className="w-12 h-12 rounded-2xl bg-primary/15 items-center justify-center">
                            <Bot
                                size={24}
                                color={theme.primary}
                                strokeWidth={1.5}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="font-semibold text-accent-foreground text-sm">
                                Asistente de Biocomercio
                            </Text>
                            <Text className="text-xs text-accent-foreground/70 mt-0.5">
                                Genera planes de negocio con IA generativa
                            </Text>
                        </View>
                        <Button size="sm" className="rounded-xl">
                            <Text className="text-xs text-primary-foreground font-semibold">
                                Iniciar
                            </Text>
                        </Button>
                    </CardContent>
                </Card>
            </View>
        </ScrollView>
    );
}
