/**
 * Auth hooks — React Query mutations for authentication flows.
 *
 * Contains all auth logic (login, register, logout, 2FA, hydration).
 * Components use these hooks — never call services directly.
 *
 * @module hooks/features/auth/useAuth
 */

"use client";

import {
    confirmTwoFactorLogin,
    login,
    register,
    revokeToken,
} from "@/services/auth-service";
import { useAuthStore } from "@/store/auth-store";
import type {
    LoginRequest,
    RegisterRequest,
    TwoFactorLoginRequest,
    UserResponse,
} from "@/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

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
                router.push("/");
            }
        },
        onError: () => {
            toast.error("Credenciales invalidas. Intenta de nuevo.");
        },
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
                router.push("/");
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
        onSuccess: (_user: UserResponse) => {
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

// ─── Hydration ───────────────────────────────────────────────────────────────

/** Restores auth state from localStorage on mount */
export function useAuthHydration() {
    const { hydrate } = useAuthStore();

    useEffect(() => {
        hydrate();
    }, [hydrate]);
}
