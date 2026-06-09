/**
 * Splash / Loading Screen — BioCommerce Caldas Mobile
 *
 * Displayed on app startup. Runs the real startup orchestration:
 * - Auth session hydration (silent refresh + profile)
 * - Offline-mode hydration
 * - When online: flush the offline upload queue and (if offline mode is on)
 *   refresh the cached catalog
 * - AI model health warmup
 *
 * Progress reflects the actual step in flight. After init, redirects to (tabs).
 */

import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/hooks/useAuth";
import { checkHealth } from "@/services/classification-service";
import { syncAll } from "@/services/offline-sync";
import { useOfflineStore } from "@/store/offline-store";
import NetInfo from "@react-native-community/netinfo";
import { router, type RelativePathString } from "expo-router";
import { Leaf, Sparkles } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

interface InitStage {
    label: string;
    progress: number;
}

export default function SplashScreen() {
    const { colorScheme } = useColorScheme();
    const { hydrate } = useAuth();
    const [stage, setStage] = useState<InitStage>({
        label: "Inicializando...",
        progress: 10,
    });
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

        const wait = (ms: number) =>
            new Promise((resolve) => setTimeout(resolve, ms));

        const runInit = async () => {
            // Each step runs real work; failures are non-fatal so the app still boots.
            const steps: { stage: InitStage; run: () => Promise<void> }[] = [
                {
                    stage: { label: "Inicializando...", progress: 10 },
                    run: async () => {},
                },
                {
                    stage: { label: "Verificando sesión...", progress: 30 },
                    run: async () => {
                        await hydrateRef.current();
                    },
                },
                {
                    stage: { label: "Cargando preferencias...", progress: 45 },
                    run: async () => {
                        await useOfflineStore.getState().hydrate();
                    },
                },
                {
                    stage: { label: "Sincronizando datos...", progress: 75 },
                    run: async () => {
                        const net = await NetInfo.fetch();
                        const online = Boolean(
                            net.isConnected &&
                                net.isInternetReachable !== false,
                        );
                        if (!online) return;
                        const offline = useOfflineStore.getState();
                        await syncAll({ refreshCatalog: offline.enabled });
                        await offline.refreshCounts();
                    },
                },
                {
                    stage: { label: "Verificando modelo IA...", progress: 92 },
                    run: async () => {
                        await checkHealth();
                    },
                },
                {
                    stage: { label: "¡Listo!", progress: 100 },
                    run: async () => {},
                },
            ];

            for (const step of steps) {
                if (!isMounted) return;
                setStage(step.stage);
                try {
                    await step.run();
                } catch {
                    // Non-fatal — continue startup.
                }
                await wait(200);
            }

            await wait(300);
            if (isMounted) {
                router.replace("/(tabs)" as RelativePathString);
            }
        };

        void runInit();
        return () => {
            isMounted = false;
        };
    }, []);

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
