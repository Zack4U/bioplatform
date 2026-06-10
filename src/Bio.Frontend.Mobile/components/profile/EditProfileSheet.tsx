/**
 * EditProfileSheet — bottom sheet to edit the authenticated user's profile.
 *
 * Fields: fullName, email, phoneNumber (all required by the backend).
 * Persists via useUpdateProfile, which also refreshes the auth store.
 *
 * @module components/profile/EditProfileSheet
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
import { useUpdateProfile } from "@/hooks/useAccount";
import type { UserResponse } from "@/types";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

interface EditProfileSheetProps {
    open: boolean;
    onClose: () => void;
    user: UserResponse;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EditProfileSheet({ open, onClose, user }: EditProfileSheetProps) {
    const [fullName, setFullName] = useState(user.fullName);
    const [email, setEmail] = useState(user.email);
    const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");

    const { mutate, isPending, isSuccess, reset } = useUpdateProfile();

    // Re-seed fields whenever the sheet opens with the current user.
    useEffect(() => {
        if (open) {
            setFullName(user.fullName);
            setEmail(user.email);
            setPhoneNumber(user.phoneNumber ?? "");
            reset();
        }
    }, [open, user, reset]);

    // Close on successful save.
    useEffect(() => {
        if (isSuccess) onClose();
    }, [isSuccess, onClose]);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phoneNumber.trim();

    const isValid =
        trimmedName.length > 0 &&
        EMAIL_REGEX.test(trimmedEmail) &&
        trimmedPhone.length > 0;

    const handleSave = () => {
        if (!isValid) return;
        mutate({
            fullName: trimmedName,
            email: trimmedEmail,
            phoneNumber: trimmedPhone,
        });
    };

    return (
        <BottomSheet open={open} onClose={onClose} snapPoint={0.7}>
            <BottomSheetHeader>
                <Text className="text-lg font-bold text-foreground">
                    Editar Perfil
                </Text>
                <Text className="text-sm text-muted-foreground mt-1">
                    Actualiza tu nombre, correo y teléfono de contacto.
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
                                Nombre completo
                            </Text>
                            <Input
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Tu nombre completo"
                                autoCapitalize="words"
                                className="h-12 rounded-2xl"
                            />
                        </View>

                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Correo electrónico
                            </Text>
                            <Input
                                value={email}
                                onChangeText={setEmail}
                                placeholder="correo@ejemplo.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                                className="h-12 rounded-2xl"
                            />
                        </View>

                        <View>
                            <Text className="text-sm font-medium text-foreground mb-2">
                                Teléfono
                            </Text>
                            <Input
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="+57 300 000 0000"
                                keyboardType="phone-pad"
                                autoComplete="tel"
                                className="h-12 rounded-2xl"
                            />
                        </View>
                    </View>
                </ScrollView>
            </BottomSheetBody>

            <BottomSheetFooter>
                <Button
                    className="h-14 rounded-2xl"
                    onPress={handleSave}
                    disabled={!isValid || isPending}
                >
                    <Text className="text-primary-foreground font-bold text-base">
                        {isPending ? "Guardando..." : "Guardar Cambios"}
                    </Text>
                </Button>
            </BottomSheetFooter>
        </BottomSheet>
    );
}
