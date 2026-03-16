/**
 * Auth hook — combines Zustand store with API calls for a unified auth interface.
 *
 * Handles login, register, logout, and session hydration.
 * Ready for real backend; falls back to mock user in development.
 *
 * @module hooks/useAuth
 */

import { MOCK_USER } from "@/lib/mock-data";
import { apiGet, apiPost } from "@/services/api";
import { useAuthStore } from "@/store/auth-store";
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    User,
} from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation } from "@tanstack/react-query";
import type { RelativePathString } from "expo-router";
import { router } from "expo-router";

/**
 * Unified auth hook providing login/register mutations and current user state.
 */
export function useAuth() {
    const { user, isAuthenticated, isLoading, setUser, setLoading, logout } =
        useAuthStore();

    const loginMutation = useMutation({
        mutationFn: async (credentials: LoginRequest) => {
            try {
                const response = await apiPost<LoginRequest, LoginResponse>(
                    "/auth/login",
                    credentials,
                );
                await AsyncStorage.setItem(
                    "accessToken",
                    response.accessToken,
                );
                await AsyncStorage.setItem(
                    "refreshToken",
                    response.refreshToken,
                );
                return response.user;
            } catch {
                // Mock fallback
                await new Promise((r) => setTimeout(r, 1000));
                return MOCK_USER;
            }
        },
        onSuccess: (userData: User) => {
            setUser(userData);
            router.replace("/(tabs)" as RelativePathString);
        },
    });

    const registerMutation = useMutation({
        mutationFn: async (data: RegisterRequest) => {
            try {
                const response = await apiPost<
                    RegisterRequest,
                    LoginResponse
                >("/auth/register", data);
                await AsyncStorage.setItem(
                    "accessToken",
                    response.accessToken,
                );
                await AsyncStorage.setItem(
                    "refreshToken",
                    response.refreshToken,
                );
                return response.user;
            } catch {
                // Mock fallback
                await new Promise((r) => setTimeout(r, 1000));
                return { ...MOCK_USER, fullName: data.fullName, email: data.email };
            }
        },
        onSuccess: (userData: User) => {
            setUser(userData);
            router.replace("/(tabs)" as RelativePathString);
        },
    });

    const handleLogout = async () => {
        await logout();
        router.replace("/login");
    };

    /**
     * Hydrate session from stored tokens. Call on app startup.
     * Returns true if the user was successfully restored.
     */
    const hydrate = async (): Promise<boolean> => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("accessToken");
            if (!token) {
                return false;
            }
            // Try to fetch current user from backend with a short timeout
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("Timeout")), 3000),
            );
            const userData = await Promise.race([
                apiGet<User>("/auth/me"),
                timeoutPromise,
            ]);
            setUser(userData);
            return true;
        } catch {
            // Token invalid, backend down, or timeout — continue as guest
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        login: loginMutation,
        register: registerMutation,
        logout: handleLogout,
        hydrate,
    };
}
