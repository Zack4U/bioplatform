/**
 * Auth hook — combines Zustand store with auth service for a unified auth interface.
 *
 * Handles login, register, logout, 2FA challenge, and session hydration.
 * Fully connected to the .NET backend — no mock fallbacks.
 *
 * @module hooks/useAuth
 */

import { handleApiError } from "@/lib/error-handler";
import * as authService from "@/services/auth-service";
import { useAuthStore, STORAGE_KEYS } from "@/store/auth-store";
import type {
    LoginRequest,
    RegisterRequest,
    TwoFactorLoginRequest,
    UserResponse,
} from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import type { RelativePathString } from "expo-router";
import { router } from "expo-router";
import { useState } from "react";

/**
 * Persist tokens and extract user info from the JWT.
 * The JWT contains: sub (id), email, name (fullName), role.
 */
async function persistSessionAndSetUser(
    accessToken: string,
    refreshToken: string,
    setUser: (user: UserResponse) => void,
): Promise<UserResponse> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

    const user = authService.decodeUserFromToken(accessToken);
    if (!user) {
        throw new Error("No se pudo decodificar el usuario del token.");
    }

    setUser(user);
    return user;
}

/**
 * Unified auth hook providing login/register mutations, 2FA flow, and current user state.
 */
export function useAuth() {
    const { user, isAuthenticated, isLoading, setUser, setLoading, logout } =
        useAuthStore();

    // 2FA intermediate state
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [twoFactorToken, setTwoFactorToken] = useState<string | null>(null);

    // ─── Login ───────────────────────────────────────────────────────────

    const loginMutation = useMutation({
        mutationFn: async (credentials: LoginRequest) => {
            const response = await authService.login(credentials);

            // 2FA challenge required
            if (response.twoFactorRequired && response.twoFactorToken) {
                setTwoFactorRequired(true);
                setTwoFactorToken(response.twoFactorToken);
                return null; // Signal: 2FA pending, don't navigate yet
            }

            if (!response.accessToken || !response.refreshToken) {
                throw new Error("Respuesta de autenticacion invalida.");
            }

            return persistSessionAndSetUser(
                response.accessToken,
                response.refreshToken,
                setUser,
            );
        },
        onSuccess: (userData: UserResponse | null) => {
            if (userData) {
                // Full login success — navigate to main app
                router.replace("/(tabs)" as RelativePathString);
            }
            // If null, 2FA is pending — UI will show the code input
        },
        onError: (error: unknown) => {
            handleApiError(error);
        },
    });

    // ─── 2FA Confirm ─────────────────────────────────────────────────────

    const twoFactorMutation = useMutation({
        mutationFn: async (request: TwoFactorLoginRequest) => {
            const response = await authService.confirmTwoFactorLogin(request);

            if (!response.accessToken || !response.refreshToken) {
                throw new Error("Respuesta de autenticacion 2FA invalida.");
            }

            return persistSessionAndSetUser(
                response.accessToken,
                response.refreshToken,
                setUser,
            );
        },
        onSuccess: () => {
            setTwoFactorRequired(false);
            setTwoFactorToken(null);
            router.replace("/(tabs)" as RelativePathString);
        },
        onError: (error: unknown) => {
            handleApiError(error);
        },
    });

    /** Submit the 6-digit TOTP code to complete 2FA login */
    const confirmTwoFactor = (code: string) => {
        if (!twoFactorToken) return;
        twoFactorMutation.mutate({ twoFactorToken, code });
    };

    // ─── Register ────────────────────────────────────────────────────────

    const registerMutation = useMutation({
        mutationFn: async (data: RegisterRequest) => {
            await authService.register(data);
            // Auto-login after successful registration
            const loginResponse = await authService.login({
                email: data.email,
                password: data.password,
            });

            if (
                loginResponse.twoFactorRequired &&
                loginResponse.twoFactorToken
            ) {
                setTwoFactorRequired(true);
                setTwoFactorToken(loginResponse.twoFactorToken);
                return null;
            }

            if (!loginResponse.accessToken || !loginResponse.refreshToken) {
                throw new Error("Respuesta de autenticacion invalida.");
            }

            return persistSessionAndSetUser(
                loginResponse.accessToken,
                loginResponse.refreshToken,
                setUser,
            );
        },
        onSuccess: (userData: UserResponse | null) => {
            if (userData) {
                router.replace("/(tabs)" as RelativePathString);
            }
        },
        onError: (error: unknown) => {
            handleApiError(error);
        },
    });

    // ─── Logout ──────────────────────────────────────────────────────────

    const handleLogout = async () => {
        try {
            const refreshToken = await AsyncStorage.getItem(
                STORAGE_KEYS.REFRESH_TOKEN,
            );
            if (refreshToken) {
                await authService.revokeToken(refreshToken);
            }
        } catch {
            // Revoke failed (token already invalid or network error) — continue logout
        } finally {
            await logout();
            router.replace("/login");
        }
    };

    // ─── Hydration ───────────────────────────────────────────────────────

    /**
     * Hydrate session from stored tokens. Call on app startup.
     * Attempts to refresh the token pair and fetch user profile.
     * Returns true if the user was successfully restored.
     */
    const hydrate = async (): Promise<boolean> => {
        setLoading(true);
        try {
            const accessToken = await AsyncStorage.getItem(
                STORAGE_KEYS.ACCESS_TOKEN,
            );
            const refreshToken = await AsyncStorage.getItem(
                STORAGE_KEYS.REFRESH_TOKEN,
            );

            if (!accessToken || !refreshToken) {
                return false;
            }

            // Attempt silent refresh to get a fresh token pair
            const refreshResponse = await Promise.race([
                authService.refreshTokens({ accessToken, refreshToken }),
                new Promise<never>((_, reject) =>
                    setTimeout(
                        () => reject(new Error("Tiempo de espera agotado")),
                        5000,
                    ),
                ),
            ]);

            if (
                !refreshResponse.accessToken ||
                !refreshResponse.refreshToken
            ) {
                return false;
            }

            await persistSessionAndSetUser(
                refreshResponse.accessToken,
                refreshResponse.refreshToken,
                setUser,
            );
            return true;
        } catch {
            // Token invalid, backend down, or timeout — continue as guest
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.ACCESS_TOKEN,
                STORAGE_KEYS.REFRESH_TOKEN,
            ]);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        // State
        user,
        isAuthenticated,
        isLoading,
        twoFactorRequired,

        // Mutations
        login: loginMutation,
        register: registerMutation,
        twoFactor: twoFactorMutation,

        // Actions
        confirmTwoFactor,
        logout: handleLogout,
        hydrate,
    };
}
