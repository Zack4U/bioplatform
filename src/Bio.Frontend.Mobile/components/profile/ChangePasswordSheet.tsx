/**
 * ChangePasswordSheet — bottom sheet to change the authenticated user's password.
 *
 * Validates new == confirm and a minimum length before enabling submit.
 * Persists via useChangePassword.
 *
 * @module components/profile/ChangePasswordSheet
 */

import {
    BottomSheet,
    BottomSheetBody,
    BottomSheetFooter,
    BottomSheetHeader,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useChangePassword } from "@/hooks/useAccount";
import { THEME } from "@/lib/theme";
import { Eye, EyeOff } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

interface ChangePasswordSheetProps {
    open: boolean;
    onClose: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

export function ChangePasswordSheet({ open, onClose }: ChangePasswordSheetProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showNew, setShowNew] = useState(false);

    const { mutate, isPending, isSuccess, reset } = useChangePassword();

    const clear = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowNew(false);
    };

    useEffect(() => {
        if (open) {
            clear();
            reset();
        }
    }, [open, reset]);

    useEffect(() => {
        if (isSuccess) {
            clear();
            onClose();
        }
    }, [isSuccess, onClose]);

    const matches =
        newPassword.length >= MIN_PASSWORD_LENGTH &&
        newPassword === confirmNewPassword;
    const isValid = currentPassword.length > 0 && matches;
    const showMismatch =
        confirmNewPassword.length > 0 && newPassword !== confirmNewPassword;

    const handleSubmit = () => {
        if (!isValid) return;
        mutate({ currentPassword, newPassword, confirmNewPassword });
    };

    return (
        <BottomSheet open={open} onClose={onClose} snapPoint={0.72}>
            <BottomSheetHeader>
                <Text className="text-lg font-bold text-foreground">
                    Cambiar Contraseña
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                    Usa una contraseña de al menos {MIN_PASSWORD_LENGTH}{" "}
                    caracteres.
                </Text>
            </BottomSheetHeader>

            <BottomSheetBody>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="gap-4">
                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Contraseña actual
                            </Text>
                            <Input
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="••••••••"
                                secureTextEntry
                                autoCapitalize="none"
                                autoComplete="current-password"
                                className="h-12 rounded-2xl"
                            />
                        </View>

                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Nueva contraseña
                            </Text>
                            <View className="relative">
                                <Input
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Mínimo 8 caracteres"
                                    secureTextEntry={!showNew}
                                    autoCapitalize="none"
                                    autoComplete="new-password"
                                    className="h-12 rounded-2xl pr-12"
                                />
                                <Pressable
                                    onPress={() => setShowNew((v) => !v)}
                                    className="absolute right-3 top-0 bottom-0 justify-center"
                                >
                                    {showNew ? (
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

                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Confirmar nueva contraseña
                            </Text>
                            <Input
                                value={confirmNewPassword}
                                onChangeText={setConfirmNewPassword}
                                placeholder="Repite la nueva contraseña"
                                secureTextEntry={!showNew}
                                autoCapitalize="none"
                                autoComplete="new-password"
                                className="h-12 rounded-2xl"
                            />
                            {showMismatch && (
                                <Text className="text-xs text-destructive mt-1.5">
                                    Las contraseñas no coinciden.
                                </Text>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </BottomSheetBody>

            <BottomSheetFooter>
                <Button
                    className="h-14 rounded-2xl"
                    onPress={handleSubmit}
                    disabled={!isValid || isPending}
                >
                    <Text className="text-primary-foreground font-bold text-base">
                        {isPending ? "Cambiando..." : "Cambiar Contraseña"}
                    </Text>
                </Button>
            </BottomSheetFooter>
        </BottomSheet>
    );
}
