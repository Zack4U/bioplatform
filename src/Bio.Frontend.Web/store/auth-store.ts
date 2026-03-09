/**
 * Auth Zustand store — manages client-side auth state.
 * Tokens stored in localStorage; user data in memory.
 */

import type { User } from "@/types";
import { create } from "zustand";

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setUser: (user: User) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

    setLoading: (isLoading) => set({ isLoading }),

    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
    },

    hydrate: () => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                set({ isLoading: false });
            }
            // Full hydration happens via a useAuth hook that calls /auth/me
        }
    },
}));
