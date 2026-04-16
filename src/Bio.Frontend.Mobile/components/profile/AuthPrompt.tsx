/**
 * AuthPrompt — Unauthenticated state with login/register buttons.
 */

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import { Leaf } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";
import { router } from "expo-router";

export function AuthPrompt() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <View className="flex-1 bg-background items-center justify-center px-8">
            <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center mb-6">
                <Leaf
                    size={36}
                    color={theme.primary}
                    strokeWidth={1.5}
                />
            </View>
            <Text className="text-2xl font-bold text-foreground mb-2 text-center">
                Bienvenido a BioCommerce
            </Text>
            <Text className="text-sm text-muted-foreground text-center mb-8 px-4">
                Inicia sesión para acceder a tu perfil, sincronizar
                datos y guardar tus identificaciones.
            </Text>

            <View className="w-full gap-3">
                <Button
                    className="rounded-2xl h-14"
                    onPress={() => router.push("/login")}
                >
                    <Text className="text-primary-foreground font-bold text-base">
                        Iniciar Sesión
                    </Text>
                </Button>
                <Button
                    variant="outline"
                    className="rounded-2xl h-14"
                    onPress={() => router.push("/register")}
                >
                    <Text className="font-semibold text-base">
                        Crear Cuenta
                    </Text>
                </Button>
            </View>
        </View>
    );
}
