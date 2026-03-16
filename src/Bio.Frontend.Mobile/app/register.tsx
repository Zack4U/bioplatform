/**
 * Register Screen — BioCommerce Caldas Mobile.
 *
 * Features:
 * - Full name, email, password, confirm password inputs
 * - Role selection via pill buttons
 * - Terms & conditions checkbox
 * - Register mutation via useAuth hook
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/hooks/useAuth";
import { THEME } from "@/lib/theme";
import type { UserRoleName } from "@/types";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    Leaf,
    Lock,
    Mail,
    UserPlus,
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

const AVAILABLE_ROLES: { label: string; value: UserRoleName; emoji: string }[] = [
    { label: "Investigador", value: "Researcher", emoji: "🔬" },
    { label: "Emprendedor", value: "Entrepreneur", emoji: "🌱" },
    { label: "Comunidad", value: "Community", emoji: "🏘️" },
    { label: "Comprador", value: "Buyer", emoji: "🛒" },
];

export default function RegisterScreen() {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;
    const { register } = useAuth();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState<UserRoleName>("Researcher");
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const passwordsMatch = password === confirmPassword;
    const canSubmit =
        fullName.trim() &&
        email.trim() &&
        password.length >= 8 &&
        passwordsMatch &&
        acceptTerms;

    const handleRegister = () => {
        if (!canSubmit) return;
        register.mutate({
            fullName: fullName.trim(),
            email: email.trim(),
            password,
            role: selectedRole,
        });
    };

    return (
        <KeyboardAvoidingView
            className="flex-1 bg-background"
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ─── Back Button ──────────────────────── */}
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

                {/* ─── Branding ─────────────────────────── */}
                <View className="items-center px-8 pt-6 pb-8">
                    <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                        <UserPlus
                            size={28}
                            color={theme.primary}
                            strokeWidth={1.5}
                        />
                    </View>
                    <Text className="text-2xl font-bold text-foreground mb-1">
                        Crear Cuenta
                    </Text>
                    <Text className="text-sm text-muted-foreground text-center">
                        Únete a la comunidad de biodiversidad de Caldas
                    </Text>
                </View>

                {/* ─── Form ────────────────────────────── */}
                <View className="px-6 gap-4">
                    {/* Full Name */}
                    <View>
                        <Text className="text-sm font-medium text-foreground mb-2">
                            Nombre completo
                        </Text>
                        <Input
                            placeholder="Dr. Carlos Mejía"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            autoComplete="name"
                            className="h-14 rounded-2xl"
                        />
                    </View>

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
                                placeholder="Mínimo 8 caracteres"
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

                    {/* Confirm Password */}
                    <View>
                        <Text className="text-sm font-medium text-foreground mb-2">
                            Confirmar contraseña
                        </Text>
                        <Input
                            placeholder="Repite la contraseña"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            className="h-14 rounded-2xl"
                        />
                        {confirmPassword.length > 0 && !passwordsMatch && (
                            <Text className="text-xs text-destructive mt-1">
                                Las contraseñas no coinciden
                            </Text>
                        )}
                    </View>

                    {/* Role Selection */}
                    <View>
                        <Text className="text-sm font-medium text-foreground mb-3">
                            ¿Cuál es tu rol?
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                            {AVAILABLE_ROLES.map((role) => {
                                const isSelected =
                                    selectedRole === role.value;
                                return (
                                    <Pressable
                                        key={role.value}
                                        onPress={() =>
                                            setSelectedRole(role.value)
                                        }
                                        className={`px-4 py-3 rounded-2xl flex-row items-center gap-2 ${
                                            isSelected
                                                ? "bg-primary"
                                                : "bg-card border border-border"
                                        }`}
                                    >
                                        <Text className="text-sm">
                                            {role.emoji}
                                        </Text>
                                        <Text
                                            className={`text-sm font-semibold ${
                                                isSelected
                                                    ? "text-primary-foreground"
                                                    : "text-foreground"
                                            }`}
                                        >
                                            {role.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Terms */}
                    <Pressable
                        onPress={() => setAcceptTerms(!acceptTerms)}
                        className="flex-row items-start gap-3 mt-2"
                    >
                        <Checkbox
                            checked={acceptTerms}
                            onCheckedChange={setAcceptTerms}
                        />
                        <Text className="text-sm text-muted-foreground flex-1 leading-5">
                            Acepto los{" "}
                            <Text className="text-primary font-semibold">
                                Términos y Condiciones
                            </Text>{" "}
                            y la{" "}
                            <Text className="text-primary font-semibold">
                                Política de Privacidad
                            </Text>
                            , incluyendo el cumplimiento del Protocolo de
                            Nagoya para acceso a recursos genéticos.
                        </Text>
                    </Pressable>

                    {/* Register Error */}
                    {register.isError && (
                        <View className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
                            <Text className="text-sm text-destructive text-center">
                                Error al crear la cuenta. Intenta de nuevo.
                            </Text>
                        </View>
                    )}

                    {/* Submit */}
                    <Button
                        className="h-14 rounded-2xl mt-2"
                        onPress={handleRegister}
                        disabled={!canSubmit || register.isPending}
                    >
                        <Text className="text-primary-foreground font-bold text-base">
                            {register.isPending
                                ? "Creando cuenta..."
                                : "Crear Cuenta"}
                        </Text>
                    </Button>
                </View>

                {/* ─── Footer ──────────────────────────── */}
                <View className="items-center mt-6">
                    <Pressable onPress={() => router.replace("/login")}>
                        <Text className="text-sm text-muted-foreground">
                            ¿Ya tienes cuenta?{" "}
                            <Text className="text-primary font-semibold">
                                Inicia Sesión
                            </Text>
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
