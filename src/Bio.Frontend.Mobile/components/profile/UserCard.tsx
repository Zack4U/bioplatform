/**
 * UserCard — Profile header card.
 *
 * - Authenticated: avatar, name, email, role badge, verified status
 * - Guest: default avatar, "Invitado" label, login/register buttons
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import type { UserResponse } from "@/types";
import { Shield, User as UserIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { View } from "react-native";
import { router } from "expo-router";

interface UserCardProps {
    user: UserResponse | null;
    isAuthenticated: boolean;
}

export function UserCard({ user, isAuthenticated }: UserCardProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;



    return (
        <View className="px-5 pt-14 pb-6">
            <View className="relative overflow-hidden rounded-3xl bg-card border border-border p-6">
                {/* Decorative */}
                <View className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/5" />

                <View className="flex-row items-center gap-4">
                    {/* Avatar */}
                    <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center">
                        <UserIcon
                            size={28}
                            color={theme.primary}
                            strokeWidth={1.5}
                        />
                    </View>
                    <View className="flex-1">
                        {isAuthenticated && user ? (
                            <>
                                <Text className="text-lg font-bold text-foreground">
                                    {user.fullName}
                                </Text>
                                <Text className="text-sm text-muted-foreground">
                                    {user.email}
                                </Text>
                                <View className="flex-row items-center gap-2 mt-2">
                                    <Badge className="bg-primary/10 border-0 px-3 py-1">
                                        <Text className="text-xs text-primary font-semibold">
                                            Usuario
                                        </Text>
                                    </Badge>
                                    {user.twoFactorEnabled && (
                                        <View className="flex-row items-center gap-1">
                                            <Shield
                                                size={12}
                                                color={theme.success}
                                            />
                                            <Text className="text-[10px] text-success font-medium">
                                                2FA Activo
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        ) : (
                            <>
                                <Text className="text-lg font-bold text-foreground">
                                    Invitado
                                </Text>
                                <Text className="text-sm text-muted-foreground">
                                    Inicia sesión para sincronizar
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                {/* Login / Register buttons when unauthenticated */}
                {!isAuthenticated && (
                    <View className="flex-row gap-3 mt-4">
                        <Button
                            className="flex-1 rounded-2xl h-11"
                            onPress={() => router.push("/login")}
                        >
                            <Text className="text-primary-foreground font-semibold text-sm">
                                Iniciar Sesión
                            </Text>
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 rounded-2xl h-11"
                            onPress={() => router.push("/register")}
                        >
                            <Text className="font-semibold text-sm">
                                Registrarse
                            </Text>
                        </Button>
                    </View>
                )}
            </View>
        </View>
    );
}
