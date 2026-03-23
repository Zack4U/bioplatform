/**
 * Splash / Loading Screen — BioCommerce Caldas Mobile
 *
 * Displayed on app startup. Handles:
 * - Brand identity presentation with animated elements
 * - Auth session hydration
 * - Future: offline data sync, model warmup, etc.
 *
 * After initialization, redirects to (tabs) or login based on auth state.
 */

import { useAuth } from "@/hooks/useAuth";
import type { RelativePathString } from "expo-router";
import { Text } from "@/components/ui/text";
import { Progress } from "@/components/ui/progress";
import { Leaf, Sparkles } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { router } from "expo-router";

/** Simulated init stages (will connect to real services later) */
const INIT_STAGES = [
    { label: "Inicializando...", progress: 15 },
    { label: "Verificando sesión...", progress: 40 },
    { label: "Preparando catálogo...", progress: 65 },
    { label: "Cargando modelo IA...", progress: 85 },
    { label: "¡Listo!", progress: 100 },
];

export default function SplashScreen() {
    const { colorScheme } = useColorScheme();
    const { hydrate } = useAuth();
    const [stageIndex, setStageIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const leafRotate = useRef(new Animated.Value(0)).current;

    const primaryColor =
        colorScheme === "dark" ? "hsl(149, 50%, 50%)" : "hsl(149, 70%, 35%)";
    const accentColor =
        colorScheme === "dark" ? "hsl(149, 60%, 85%)" : "hsl(149, 60%, 25%)";

    useEffect(() => {
        // Entry animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Gentle leaf rotation loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(leafRotate, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(leafRotate, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, [fadeAnim, scaleAnim, leafRotate]);

    // Store hydrate in a ref to avoid re-triggering the effect
    const hydrateRef = useRef(hydrate);
    hydrateRef.current = hydrate;

    useEffect(() => {
        let isMounted = true;

        const runInit = async () => {
            try {
                // Stage progression with delays
                for (let i = 0; i < INIT_STAGES.length; i++) {
                    if (!isMounted) return;
                    setStageIndex(i);

                    if (i === 1) {
                        // Actually hydrate the auth on stage 2
                        try {
                            await hydrateRef.current();
                        } catch {
                            // Hydration failed — continue anyway
                        }
                    }

                    // Simulate stage duration
                    await new Promise((r) => setTimeout(r, 600));
                }

                // Small delay to show "¡Listo!" before navigating
                await new Promise((r) => setTimeout(r, 400));
            } catch {
                // Safety: if anything throws, still navigate
            } finally {
                if (isMounted) {
                    router.replace("/(tabs)" as RelativePathString);
                }
            }
        };

        runInit();
        return () => {
            isMounted = false;
        };
    }, []);

    const stage = INIT_STAGES[stageIndex];

    const leafSpin = leafRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["-15deg", "15deg"],
    });

    return (
        <View className="flex-1 bg-background items-center justify-center px-8">
            {/* Decorative gradient orbs (simulated with Views) */}
            <View className="absolute top-20 -left-20 w-60 h-60 rounded-full bg-primary/10" />
            <View className="absolute bottom-32 -right-16 w-48 h-48 rounded-full bg-accent/15" />

            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                    alignItems: "center",
                }}
            >
                {/* Animated Leaf Icon */}
                <Animated.View
                    style={{
                        transform: [{ rotate: leafSpin }],
                        marginBottom: 24,
                    }}
                >
                    <View className="w-24 h-24 rounded-3xl bg-primary/15 items-center justify-center">
                        <Leaf size={48} color={primaryColor} strokeWidth={1.5} />
                    </View>
                </Animated.View>

                {/* Brand Title */}
                <Text className="text-3xl font-bold text-foreground tracking-tight mb-1">
                    BioCommerce
                </Text>
                <View className="flex-row items-center gap-1.5 mb-2">
                    <Sparkles size={14} color={accentColor} />
                    <Text className="text-lg font-medium text-primary tracking-widest uppercase">
                        Caldas
                    </Text>
                    <Sparkles size={14} color={accentColor} />
                </View>
                <Text className="text-sm text-muted-foreground text-center mb-12">
                    Biodiversidad · Ciencia · Sostenibilidad
                </Text>

                {/* Progress Section */}
                <View className="w-64 items-center">
                    <Progress
                        value={stage.progress}
                        className="h-1.5 mb-4"
                    />
                    <Text className="text-xs text-muted-foreground tracking-wide">
                        {stage.label}
                    </Text>
                </View>
            </Animated.View>

            {/* Footer */}
            <View className="absolute bottom-10 items-center">
                <Text className="text-[10px] text-muted-foreground/60 tracking-wider uppercase">
                    Universidad de Caldas · 2026
                </Text>
            </View>
        </View>
    );
}
