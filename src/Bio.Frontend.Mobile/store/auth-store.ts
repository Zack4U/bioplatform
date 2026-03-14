/**
 * Auth Zustand store — manages client-side auth state (React Native).
 *
 * Tokens stored in AsyncStorage; user data in memory.
 * For production, consider migrating tokens to expo-secure-store.
 */

import type { User } from "@/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setUser: (user: User) => void;
    setLoading: (loading: boolean) => void;
    logout: () => Promise<void>;
    hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

    setLoading: (isLoading) => set({ isLoading }),

    logout: async () => {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");
        set({ user: null, isAuthenticated: false, isLoading: false });
    },

    hydrate: async () => {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
            set({ isLoading: false });
        }
        // Full hydration happens via a useAuth hook that calls /auth/me
    },
}));
