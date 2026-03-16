/**
 * Login Screen — BioCommerce Caldas Mobile.
 *
 * Features:
 * - Email + password form with validation
 * - Optional TOTP (2FA) field for critical roles
 * - Login mutation via useAuth hook (real API + mock fallback)
 * - Modern premium design with Caldas branding
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/hooks/useAuth";
import { THEME } from "@/lib/theme";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    KeyRound,
    Leaf,
    Lock,
    Mail,
    Sparkles,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    View,
} from "react-native";
import { router } from "expo-router";

export default function LoginScreen() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showTotp, setShowTotp] = useState(false);

    const handleLogin = () => {
        if (!email.trim() || !password.trim()) return;
        login.mutate({
            email: email.trim(),
            password,
            totpCode: totpCode.trim() || undefined,
        });
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ─── Back Button ──────────────────────────── */}
                <View className="px-5 pt-14">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-xl bg-card border border-border items-center justify-center active:opacity-70"
                    >
                        <ArrowLeft
                            size={18}
                            color={theme.foreground}
                            strokeWidth={1.8}
                        />
                    </Pressable>
                </View>

                {/* ─── Branding ─────────────────────────────── */}
                <View className="items-center px-8 pt-8 pb-10">
                    <View className="w-20 h-20 rounded-3xl bg-primary/10 items-center justify-center mb-6">
                        <Leaf
                            size={36}
                            color={theme.primary}
                            strokeWidth={1.5}
                        />
                    </View>
                    <Text className="text-2xl font-bold text-foreground mb-1">
                        Iniciar Sesión
                    </Text>
                    <Text className="text-sm text-muted-foreground text-center">
                        Accede a tu cuenta de BioCommerce Caldas
                    </Text>
                </View>

                {/* ─── Form ────────────────────────────────── */}
                <View className="px-6 gap-4">
                    {/* Email */}
                    <View>
                        <Text className="text-sm font-medium text-foreground mb-2">
                            Correo electrónico
                        </Text>
                        <View className="relative">
                            <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
                                <Mail
                                    size={16}
                                    color={theme.mutedForeground}
                                    strokeWidth={1.5}
                                />
                            </View>
                            <Input
                                placeholder="correo@ucaldas.edu.co"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                className="pl-10 h-14 rounded-2xl"
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View>
                        <Text className="text-sm font-medium text-foreground mb-2">
                            Contraseña
                        </Text>
                        <View className="relative">
                            <View className="absolute left-3 top-0 bottom-0 justify-center z-10">
                                <Lock
                                    size={16}
                                    color={theme.mutedForeground}
                                    strokeWidth={1.5}
                                />
                            </View>
                            <Input
                                placeholder="••••••••"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                className="pl-10 pr-12 h-14 rounded-2xl"
                            />
                            <Pressable
                                onPress={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-0 bottom-0 justify-center"
                            >
                                {showPassword ? (
                                    <EyeOff
                                        size={16}
                                        color={theme.mutedForeground}
                                    />
                                ) : (
                                    <Eye
                                        size={16}
                                        color={theme.mutedForeground}
                                    />
                                )}
                            </Pressable>
                        </View>
                    </View>

                    {/* TOTP Toggle */}
                    <Pressable
                        onPress={() => setShowTotp(!showTotp)}
                        className="flex-row items-center gap-2"
                    >
                        <KeyRound
                            size={14}
                            color={theme.mutedForeground}
                            strokeWidth={1.5}
                        />
                        <Text className="text-xs text-muted-foreground">
                            {showTotp
                                ? "Ocultar código 2FA"
                                : "¿Tienes código 2FA?"}
                        </Text>
                    </Pressable>

                    {showTotp && (
                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Código TOTP (2FA)
                            </Text>
                            <Input
                                placeholder="000000"
                                value={totpCode}
                                onChangeText={setTotpCode}
                                keyboardType="number-pad"
                                maxLength={6}
                                className="h-14 rounded-2xl text-center text-xl tracking-[8px] font-mono"
                            />
                        </View>
                    )}

                    {/* Login Error */}
                    {login.isError && (
                        <View className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
                            <Text className="text-sm text-destructive text-center">
                                Credenciales incorrectas. Intenta de nuevo.
                            </Text>
                        </View>
                    )}

                    {/* Submit */}
                    <Button
                        className="h-14 rounded-2xl mt-2"
                        onPress={handleLogin}
                        disabled={login.isPending || !email || !password}
                    >
                        {login.isPending ? (
                            <Text className="text-primary-foreground font-bold text-base">
                                Verificando...
                            </Text>
                        ) : (
                            <Text className="text-primary-foreground font-bold text-base">
                                Iniciar Sesión
                            </Text>
                        )}
                    </Button>
                </View>

                {/* ─── Footer ──────────────────────────────── */}
                <View className="items-center mt-8 pb-10">
                    <Pressable onPress={() => router.replace("/register")}>
                        <Text className="text-sm text-muted-foreground">
                            ¿No tienes cuenta?{" "}
                            <Text className="text-primary font-semibold">
                                Regístrate
                            </Text>
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
