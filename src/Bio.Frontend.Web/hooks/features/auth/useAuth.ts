/**
 * Auth hooks — React Query mutations for authentication flows.
 *
 * Contains all auth logic (login, register, logout, 2FA, profile, hydration).
 * Components use these hooks — never call services directly.
 *
 * @module hooks/features/auth/useAuth
 */

"use client";

import {
    changePassword,
    confirmTwoFactorLogin,
    deleteAccount,
    disableTwoFactor,
    getProfile,
    login,
    register,
    revokeToken,
    setupTwoFactor,
    updateProfile,
    verifyTwoFactor,
} from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import type {
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    TwoFactorLoginRequest,
    UserResponse,
    UserUpdateRequest,
} from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Returns the post-login redirect target.
 * Reads ?returnUrl from the current URL and guards against open-redirects
 * (must be a same-origin path starting with a single "/").
 */
function getReturnUrl(): string {
    if (typeof window === "undefined") return "/";
    const returnUrl = new URLSearchParams(window.location.search).get("returnUrl");
    if (returnUrl && returnUrl.startsWith("/") && !returnUrl.startsWith("//")) {
        return returnUrl;
    }
    return "/";
}

// ─── Login ───────────────────────────────────────────────────────────────────

/** Handles login flow including 2FA challenge detection */
export function useLogin() {
    const { setTokens, setTwoFactorPending } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (request: LoginRequest) => login(request),
        onSuccess: (response) => {
            if (response.twoFactorRequired && response.twoFactorToken) {
                setTwoFactorPending(response.twoFactorToken);
                return;
            }

            if (response.accessToken && response.refreshToken) {
                setTokens(response.accessToken, response.refreshToken);
                toast.success("Inicio de sesion exitoso");
                router.push(getReturnUrl());
            }
        },
        onError: () => {
            toast.error("Credenciales invalidas. Intenta de nuevo.");
        },
    });
}

// ─── Profile Fetch ───────────────────────────────────────────────────────────

/**
 * Fetches the complete user profile from the API.
 * The JWT only contains id, email, name, and roles.
 * This hook fetches phoneNumber, twoFactorEnabled, createdAt, etc.
 * Merges the API response with JWT roles (which the API doesn't return).
 */
export function useProfile() {
    const { user, setUser, isAuthenticated } = useAuthStore();

    return useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            if (!user?.id) throw new Error("No user ID");
            const profile = await getProfile(user.id);
            // Merge: API returns full profile but no roles;
            // JWT has roles but incomplete profile data
            const merged: UserResponse = {
                ...profile,
                roles: user.roles ?? [],
            };
            setUser(merged);
            return merged;
        },
        enabled: isAuthenticated && !!user?.id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
    });
}

// ─── 2FA Login Confirm ───────────────────────────────────────────────────────

/** Completes the 2FA challenge during login */
export function useTwoFactorLogin() {
    const { setTokens } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: (request: TwoFactorLoginRequest) =>
            confirmTwoFactorLogin(request),
        onSuccess: (response) => {
            if (response.accessToken && response.refreshToken) {
                setTokens(response.accessToken, response.refreshToken);
                toast.success("Autenticacion completada");
                router.push(getReturnUrl());
            }
        },
        onError: () => {
            toast.error("Codigo invalido. Intenta de nuevo.");
        },
    });
}

// ─── Register ────────────────────────────────────────────────────────────────

/** Registers a new user account */
export function useRegister() {
    const router = useRouter();

    return useMutation({
        mutationFn: (request: RegisterRequest) => register(request),
        onSuccess: () => {
            toast.success("Cuenta creada exitosamente. Inicia sesion.");
            router.push("/login");
        },
        onError: () => {
            toast.error(
                "No se pudo crear la cuenta. Verifica los datos e intenta de nuevo.",
            );
        },
    });
}

// ─── Logout ──────────────────────────────────────────────────────────────────

/** Revokes the refresh token and clears local state */
export function useLogout() {
    const { logout } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            const refreshToken =
                typeof window !== "undefined"
                    ? localStorage.getItem("refreshToken")
                    : null;
            if (refreshToken) {
                await revokeToken(refreshToken);
            }
        },
        onSettled: () => {
            logout();
            router.push("/login");
        },
    });
}

// ─── Change Password ─────────────────────────────────────────────────────────

/** Changes the authenticated user's password */
export function useChangePassword() {
    return useMutation({
        mutationFn: (request: ChangePasswordRequest) =>
            changePassword(request),
        onSuccess: () => {
            toast.success("Contrasena actualizada exitosamente.");
        },
        onError: () => {
            toast.error(
                "No se pudo cambiar la contrasena. Verifica tu contrasena actual.",
            );
        },
    });
}

// ─── Update Profile ──────────────────────────────────────────────────────────

/** Updates the authenticated user's profile */
export function useUpdateProfile() {
    const { setUser, user } = useAuthStore();

    return useMutation({
        mutationFn: (request: UserUpdateRequest) => {
            if (!user?.id) {
                return Promise.reject(new Error("User not authenticated"));
            }
            return updateProfile(user.id, request);
        },
        onSuccess: (updatedUser) => {
            // Preserve roles from current state since API response
            // does not include them (they come from JWT)
            const currentRoles = user?.roles ?? [];
            setUser({ ...updatedUser, roles: currentRoles });
            toast.success("Perfil actualizado exitosamente.");
        },
        onError: () => {
            toast.error(
                "No se pudo actualizar el perfil. Intenta de nuevo.",
            );
        },
    });
}

// ─── Delete Account ──────────────────────────────────────────────────────────

/** Deletes the authenticated user's account */
export function useDeleteAccount() {
    const { logout, user } = useAuthStore();
    const router = useRouter();

    return useMutation({
        mutationFn: async () => {
            if (!user?.id) {
                throw new Error("User not authenticated");
            }
            await deleteAccount(user.id);
        },
        onSuccess: () => {
            logout();
            toast.success("Tu cuenta ha sido eliminada permanentemente.");
            router.push("/");
        },
        onError: () => {
            toast.error("No se pudo eliminar la cuenta. Intenta de nuevo.");
        },
    });
}

// ─── 2FA Setup ───────────────────────────────────────────────────────────────

/** Initiates 2FA setup and returns the QR data */
export function useSetupTwoFactor() {
    return useMutation({
        mutationFn: () => setupTwoFactor(),
        onError: () => {
            toast.error(
                "No se pudo iniciar la configuracion de 2FA.",
            );
        },
    });
}

/** Verifies the 6-digit TOTP code to complete 2FA setup */
export function useVerifyTwoFactor() {
    return useMutation({
        mutationFn: (code: string) => verifyTwoFactor({ code }),
        onSuccess: () => {
            toast.success(
                "Autenticacion de dos factores activada exitosamente.",
            );
        },
        onError: () => {
            toast.error("Codigo invalido. Intenta de nuevo.");
        },
    });
}

/** Disables 2FA for the authenticated user */
export function useDisableTwoFactor() {
    return useMutation({
        mutationFn: () => disableTwoFactor(),
        onSuccess: () => {
            toast.success(
                "Autenticacion de dos factores desactivada.",
            );
        },
        onError: () => {
            toast.error("No se pudo desactivar 2FA. Intenta de nuevo.");
        },
    });
}

// ─── Hydration ───────────────────────────────────────────────────────────────

/** Restores auth state from localStorage on mount */
export function useAuthHydration() {
    const { hydrate } = useAuthStore();

    useEffect(() => {
        hydrate();
    }, [hydrate]);
}
