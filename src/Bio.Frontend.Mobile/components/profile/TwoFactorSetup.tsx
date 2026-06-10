/**
 * TwoFactorSetup — 2FA management card for the mobile profile.
 *
 * - Disabled: "Configurar 2FA" → setup sheet (QR + manual key + code verify).
 * - Enabled:  "Desactivar 2FA" → confirm dialog → disable.
 *
 * The TOTP secret QR is rendered locally with react-native-qrcode-svg so the
 * authenticator URI never leaves the device.
 *
 * @module components/profile/TwoFactorSetup
 */

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
    BottomSheet,
    BottomSheetBody,
    BottomSheetFooter,
    BottomSheetHeader,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
    useDisableTwoFactor,
    useSetupTwoFactor,
    useVerifyTwoFactor,
} from "@/hooks/useAccount";
import { THEME } from "@/lib/theme";
import type { TwoFactorSetupResponse } from "@/types";
import { ShieldCheck, ShieldOff } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

interface TwoFactorSetupProps {
    enabled: boolean;
}

export function TwoFactorSetup({ enabled }: TwoFactorSetupProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const [setupData, setSetupData] = useState<TwoFactorSetupResponse | null>(
        null,
    );
    const [code, setCode] = useState("");
    const [disableOpen, setDisableOpen] = useState(false);

    const setupMutation = useSetupTwoFactor();
    const verifyMutation = useVerifyTwoFactor();
    const disableMutation = useDisableTwoFactor();

    const sheetOpen = setupData !== null;

    const startSetup = () => {
        setCode("");
        verifyMutation.reset();
        setupMutation.mutate(undefined, {
            onSuccess: (data) => setSetupData(data),
        });
    };

    const closeSheet = () => {
        setSetupData(null);
        setCode("");
        verifyMutation.reset();
    };

    // Close the setup sheet once verification enables 2FA.
    useEffect(() => {
        if (verifyMutation.isSuccess) closeSheet();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [verifyMutation.isSuccess]);

    const handleVerify = () => {
        if (code.trim().length !== 6) return;
        verifyMutation.mutate(code.trim());
    };

    return (
        <>
            <Card className="border-0 shadow-sm mb-6">
                <CardContent className="p-4">
                    <View className="flex-row items-center gap-3 mb-2">
                        <View
                            className={`w-10 h-10 rounded-xl items-center justify-center ${
                                enabled ? "bg-emerald-500/15" : "bg-muted"
                            }`}
                        >
                            {enabled ? (
                                <ShieldCheck
                                    size={18}
                                    color={theme.success}
                                    strokeWidth={1.8}
                                />
                            ) : (
                                <ShieldOff
                                    size={18}
                                    color={theme.mutedForeground}
                                    strokeWidth={1.8}
                                />
                            )}
                        </View>
                        <View className="flex-1">
                            <Text className="text-sm font-semibold text-foreground">
                                Autenticación de dos factores
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-0.5">
                                {enabled ? "Activa" : "Inactiva"} · App TOTP
                            </Text>
                        </View>
                    </View>

                    <Text className="text-xs text-muted-foreground leading-5 mb-3">
                        {enabled
                            ? "Tu cuenta está protegida. Al iniciar sesión se pedirá un código de 6 dígitos."
                            : "Agrega una capa extra de seguridad con una app autenticadora (Google Authenticator, Authy)."}
                    </Text>

                    {enabled ? (
                        <Button
                            variant="outline"
                            className="rounded-2xl h-12 border-destructive/30"
                            onPress={() => setDisableOpen(true)}
                            disabled={disableMutation.isPending}
                        >
                            <Text className="font-semibold text-destructive">
                                {disableMutation.isPending
                                    ? "Desactivando..."
                                    : "Desactivar 2FA"}
                            </Text>
                        </Button>
                    ) : (
                        <Button
                            className="rounded-2xl h-12"
                            onPress={startSetup}
                            disabled={setupMutation.isPending}
                        >
                            <Text className="font-semibold text-primary-foreground">
                                {setupMutation.isPending
                                    ? "Generando..."
                                    : "Configurar 2FA"}
                            </Text>
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* ── Setup sheet ──────────────────────────────────── */}
            <BottomSheet open={sheetOpen} onClose={closeSheet} snapPoint={0.85}>
                <BottomSheetHeader>
                    <Text className="text-lg font-bold text-foreground">
                        Configurar 2FA
                    </Text>
                    <Text className="text-sm text-muted-foreground mt-1">
                        Escanea el código con tu app autenticadora e ingresa el
                        código de verificación.
                    </Text>
                </BottomSheetHeader>

                <BottomSheetBody>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {setupData && (
                            <View className="items-center gap-4">
                                {/* QR */}
                                <View className="bg-white p-4 rounded-2xl">
                                    <QRCode
                                        value={setupData.authenticatorUri}
                                        size={200}
                                    />
                                </View>

                                {/* Manual key */}
                                <View className="w-full">
                                    <Text className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                                        Clave manual
                                    </Text>
                                    <View className="bg-muted rounded-xl px-3 py-2.5">
                                        <Text className="text-sm font-mono text-foreground tracking-wider text-center">
                                            {setupData.sharedKey}
                                        </Text>
                                    </View>
                                    <Text className="text-[11px] text-muted-foreground/70 mt-1">
                                        Si no puedes escanear el QR, ingresa esta
                                        clave manualmente.
                                    </Text>
                                </View>

                                {/* Code input */}
                                <View className="w-full">
                                    <Text className="text-sm font-medium text-foreground mb-2">
                                        Código de verificación
                                    </Text>
                                    <Input
                                        value={code}
                                        onChangeText={setCode}
                                        placeholder="000000"
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        className="h-14 rounded-2xl text-center text-xl tracking-[8px] font-mono"
                                    />
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </BottomSheetBody>

                <BottomSheetFooter>
                    <Button
                        className="h-14 rounded-2xl"
                        onPress={handleVerify}
                        disabled={code.trim().length !== 6 || verifyMutation.isPending}
                    >
                        <Text className="text-primary-foreground font-bold text-base">
                            {verifyMutation.isPending
                                ? "Verificando..."
                                : "Verificar y Activar"}
                        </Text>
                    </Button>
                </BottomSheetFooter>
            </BottomSheet>

            {/* ── Disable confirmation ─────────────────────────── */}
            <ConfirmDialog
                open={disableOpen}
                onOpenChange={setDisableOpen}
                trigger={<Pressable />}
                title="Desactivar 2FA"
                description="Tu cuenta quedará protegida solo por tu contraseña. ¿Deseas continuar?"
                confirmLabel="Desactivar"
                cancelLabel="Cancelar"
                onConfirm={() => {
                    setDisableOpen(false);
                    disableMutation.mutate();
                }}
            />
        </>
    );
}
