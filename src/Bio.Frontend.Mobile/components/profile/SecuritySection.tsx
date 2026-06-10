/**
 * SecuritySection — account & security block for the profile screen.
 *
 * Only rendered for authenticated users. Groups:
 * - Edit profile (name / email / phone)
 * - Change password
 * - Two-factor authentication (setup / disable)
 *
 * @module components/profile/SecuritySection
 */

import { ChangePasswordSheet } from "@/components/profile/ChangePasswordSheet";
import { EditProfileSheet } from "@/components/profile/EditProfileSheet";
import { TwoFactorSetup } from "@/components/profile/TwoFactorSetup";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import type { UserResponse } from "@/types";
import { ChevronRight, KeyRound, UserCog } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Pressable, View } from "react-native";

interface SecuritySectionProps {
    user: UserResponse;
}

interface SecurityRowProps {
    icon: React.ReactNode;
    label: string;
    subtitle: string;
    onPress: () => void;
}

function SecurityRow({ icon, label, subtitle, onPress }: SecurityRowProps) {
    return (
        <Pressable
            onPress={onPress}
            className="flex-row items-center py-4 active:opacity-70"
        >
            <View className="w-10 h-10 rounded-xl bg-muted items-center justify-center mr-3">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">
                    {label}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                    {subtitle}
                </Text>
            </View>
            <ChevronRight size={16} color="hsl(149, 10%, 50%)" />
        </Pressable>
    );
}

export function SecuritySection({ user }: SecuritySectionProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    const [editOpen, setEditOpen] = useState(false);
    const [passwordOpen, setPasswordOpen] = useState(false);

    return (
        <View className="px-5">
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Cuenta y Seguridad
            </Text>

            <Card className="border-0 shadow-sm mb-6">
                <CardContent className="px-4 py-1">
                    <SecurityRow
                        icon={
                            <UserCog
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Editar perfil"
                        subtitle="Nombre, correo y teléfono"
                        onPress={() => setEditOpen(true)}
                    />
                    <Separator />
                    <SecurityRow
                        icon={
                            <KeyRound
                                size={18}
                                color={theme.foreground}
                                strokeWidth={1.5}
                            />
                        }
                        label="Cambiar contraseña"
                        subtitle="Actualiza tu contraseña de acceso"
                        onPress={() => setPasswordOpen(true)}
                    />
                </CardContent>
            </Card>

            <TwoFactorSetup enabled={user.twoFactorEnabled} />

            <EditProfileSheet
                open={editOpen}
                onClose={() => setEditOpen(false)}
                user={user}
            />
            <ChangePasswordSheet
                open={passwordOpen}
                onClose={() => setPasswordOpen(false)}
            />
        </View>
    );
}
