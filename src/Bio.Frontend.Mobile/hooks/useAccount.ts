/**
 * Account & security hooks — change password, profile edit, and 2FA management.
 *
 * Mutations talk to the .NET Identity backend and keep the Zustand auth store in
 * sync (updated profile, twoFactorEnabled flag). UI feedback via Sonner toasts.
 *
 * @module hooks/useAccount
 */

import { notificationService } from "@/lib/notifications";
import * as authService from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import type {
    ChangePasswordRequest,
    TwoFactorSetupResponse,
    UpdateProfileRequest,
    UserResponse,
} from "@/types";
import { useMutation } from "@tanstack/react-query";

// ─── Change Password ───────────────────────────────────────────────────────────

export function useChangePassword() {
    return useMutation<void, Error, ChangePasswordRequest>({
        mutationFn: (request) => authService.changePassword(request),
        onSuccess: () => {
            notificationService.success("Contraseña actualizada correctamente.");
        },
        onError: () => {
            notificationService.error(
                "No se pudo cambiar la contraseña. Verifica tu contraseña actual.",
            );
        },
    });
}

// ─── Update Profile ────────────────────────────────────────────────────────────

export function useUpdateProfile() {
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation<UserResponse, Error, UpdateProfileRequest>({
        mutationFn: (request) => {
            const user = useAuthStore.getState().user;
            if (!user) {
                return Promise.reject(new Error("No hay sesión activa."));
            }
            return authService.updateUser(user.id, request);
        },
        onSuccess: (updated) => {
            setUser(updated);
            notificationService.success("Perfil actualizado.");
        },
        onError: () => {
            notificationService.error(
                "No se pudo actualizar el perfil. El correo o teléfono podría estar en uso.",
            );
        },
    });
}

// ─── Two-Factor Authentication ─────────────────────────────────────────────────

export function useSetupTwoFactor() {
    return useMutation<TwoFactorSetupResponse, Error, void>({
        mutationFn: () => authService.setupTwoFactor(),
        onError: () => {
            notificationService.error(
                "No se pudo iniciar la configuración de 2FA.",
            );
        },
    });
}

export function useVerifyTwoFactor() {
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation<boolean, Error, string>({
        mutationFn: (code) => authService.verifyTwoFactor({ code }),
        onSuccess: () => {
            const user = useAuthStore.getState().user;
            if (user) setUser({ ...user, twoFactorEnabled: true });
            notificationService.success(
                "Autenticación de dos factores activada.",
            );
        },
        onError: () => {
            notificationService.error(
                "Código inválido. Verifica e intenta de nuevo.",
            );
        },
    });
}

export function useDisableTwoFactor() {
    const setUser = useAuthStore((state) => state.setUser);

    return useMutation<void, Error, void>({
        mutationFn: () => authService.disableTwoFactor(),
        onSuccess: () => {
            const user = useAuthStore.getState().user;
            if (user) setUser({ ...user, twoFactorEnabled: false });
            notificationService.success(
                "Autenticación de dos factores desactivada.",
            );
        },
        onError: () => {
            notificationService.error("No se pudo desactivar 2FA.");
        },
    });
}
