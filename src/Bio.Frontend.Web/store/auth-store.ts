/**
 * Auth Zustand store — manages client-side auth state.
 * Tokens stored in localStorage; user data decoded from JWT.
 */

import { decodeUserFromToken } from "@/services/auth-service";
import type { UserResponse, UserRoleName } from "@/types";
import { create } from "zustand";

/**
 * Check if a JWT token has expired by reading the `exp` claim.
 * Returns true if expired, malformed, or unreadable.
 */
function isTokenExpired(token: string): boolean {
    try {
        const payload = token.split(".")[1];
        if (!payload) return true;
        const decoded = JSON.parse(atob(payload));
        if (!decoded.exp) return false; // No expiry claim — treat as valid
        return decoded.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

interface AuthState {
    /** Current authenticated user (decoded from JWT) */
    user: UserResponse | null;
    /** Whether the user is currently authenticated */
    isAuthenticated: boolean;
    /** Whether initial hydration is in progress */
    isLoading: boolean;
    /** Whether a 2FA challenge is pending during login */
    twoFactorPending: boolean;
    /** Temporary 2FA token received from the login response */
    twoFactorToken: string | null;

    /** Store tokens in localStorage and decode user from JWT */
    setTokens: (accessToken: string, refreshToken: string) => void;
    /** Set user directly (e.g. after fetching profile) */
    setUser: (user: UserResponse) => void;
    /** Set loading state */
    setLoading: (loading: boolean) => void;
    /** Set 2FA pending state with the temporary token */
    setTwoFactorPending: (token: string) => void;
    /** Clear 2FA pending state */
    clearTwoFactorPending: () => void;
    /** Logout — clear tokens and reset state */
    logout: () => void;
    /** Hydrate from localStorage on mount */
    hydrate: () => void;
    /** Check if user has a specific role */
    hasRole: (role: UserRoleName) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    twoFactorPending: false,
    twoFactorToken: null,

    setTokens: (accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
        }
        const user = decodeUserFromToken(accessToken);
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
            twoFactorPending: false,
            twoFactorToken: null,
        });
    },

    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

    setLoading: (isLoading) => set({ isLoading }),

    setTwoFactorPending: (twoFactorToken) =>
        set({ twoFactorPending: true, twoFactorToken, isLoading: false }),

    clearTwoFactorPending: () =>
        set({ twoFactorPending: false, twoFactorToken: null }),

    logout: () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
        }
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            twoFactorPending: false,
            twoFactorToken: null,
        });
    },

    hydrate: () => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token) {
                // Validate token has not expired
                if (isTokenExpired(token)) {
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                    return;
                }

                const user = decodeUserFromToken(token);
                set({
                    user,
                    isAuthenticated: !!user,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        }
    },

    hasRole: (role: UserRoleName) => {
        const { user } = get();
        return user?.roles?.includes(role) ?? false;
    },
}));
