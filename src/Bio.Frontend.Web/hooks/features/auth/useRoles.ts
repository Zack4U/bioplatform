"use client";

import { useAuthStore } from "@/store/auth-store";
import type { UserRoleName } from "@/types";

/** Returns true if the authenticated user has the given role. */
export function useHasRole(role: UserRoleName): boolean {
    const { user } = useAuthStore();
    return user?.roles?.includes(role) ?? false;
}

/** Returns true if the authenticated user has at least one of the given roles. */
export function useHasAnyRole(roles: UserRoleName[]): boolean {
    const { user } = useAuthStore();
    if (!user?.roles?.length) return false;
    return roles.some((r) => user.roles.includes(r));
}

/** Returns the full roles array of the authenticated user. */
export function useUserRoles(): UserRoleName[] {
    const { user } = useAuthStore();
    return user?.roles ?? [];
}
