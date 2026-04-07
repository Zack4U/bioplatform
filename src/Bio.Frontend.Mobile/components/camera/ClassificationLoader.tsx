/**
 * ClassificationLoader — Full-screen overlay during CNN image classification.
 */

import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import { Sparkles } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

export function ClassificationLoader() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const spinAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const spin = Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            }),
        );
        spin.start();
        return () => spin.stop();
    }, [spinAnim]);

    const rotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    return (
        <View className="absolute inset-0 bg-black/80 items-center justify-center z-20">
            <Animated.View style={{ transform: [{ rotate }], marginBottom: 20 }}>
                <View className="w-20 h-20 rounded-3xl bg-primary/20 items-center justify-center">
                    <Sparkles size={36} color={theme.primary} strokeWidth={1.5} />
                </View>
            </Animated.View>
            <Text className="text-lg font-bold text-white mb-1">
                Clasificando...
            </Text>
            <Text className="text-sm text-white/60 mb-6">
                Modelo CNN procesando imagen
            </Text>
            <View className="w-48">
                <Progress value={75} className="h-1.5" />
            </View>
        </View>
    );
}
