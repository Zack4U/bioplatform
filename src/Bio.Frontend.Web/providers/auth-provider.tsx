"use client";

/**
 * AuthProvider — hydrates auth state from localStorage on mount.
 *
 * Must be placed inside the Providers tree so that useAuthHydration
 * runs once when the app loads, restoring the session after page reloads.
 *
 * Also validates token expiry: if the access token is expired, it clears
 * the session to avoid showing stale user state.
 */

import { useAuthHydration } from "@/hooks/features/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    useAuthHydration();

    return <>{children}</>;
}
