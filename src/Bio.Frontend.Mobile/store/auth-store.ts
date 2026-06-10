/**
 * Auth Zustand store — manages client-side auth state (React Native).
 *
 * Tokens stored in the device keystore/keychain via secureStorage; user data in memory.
 */

import type { UserResponse } from "@/types";
import { secureStorage } from "@/lib/secure-storage";
import { create } from "zustand";

/** Secure storage key constants */
export const STORAGE_KEYS = {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
} as const;

interface AuthState {
    user: UserResponse | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setUser: (user: UserResponse) => void;
    setLoading: (loading: boolean) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

    setLoading: (isLoading) => set({ isLoading }),

    logout: async () => {
        await secureStorage.multiRemove([
            STORAGE_KEYS.ACCESS_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
        ]);
        set({ user: null, isAuthenticated: false, isLoading: false });
    },
}));
