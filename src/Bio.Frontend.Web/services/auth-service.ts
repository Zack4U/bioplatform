/**
 * Auth service — typed API calls for Identity & Access Management.
 *
 * All functions map 1:1 to the .NET AuthController and UsersController endpoints.
 * Uses centralized route constants and the shared Axios client.
 *
 * @module services/auth-service
 */

import apiClient from "@/lib/axios";
import { CORE_ROUTES } from "@/services/routes";
import type {
    AuthResponse,
    ChangePasswordRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TwoFactorLoginRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    UserResponse,
    UserRoleName,
    UserUpdateRequest,
} from "@/types";

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

/** POST /api/auth/login — authenticate with email + password */
export async function login(request: LoginRequest): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
        CORE_ROUTES.AUTH.LOGIN,
        request,
    );
    return data;
}

/** POST /api/auth/refresh — refresh an expired access token */
export async function refreshTokens(
    request: RefreshRequest,
): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
        CORE_ROUTES.AUTH.REFRESH,
        request,
    );
    return data;
}

/** POST /api/auth/revoke — invalidate a refresh token */
export async function revokeToken(refreshToken: string): Promise<void> {
    await apiClient.post(CORE_ROUTES.AUTH.REVOKE, JSON.stringify(refreshToken), {
        headers: { "Content-Type": "application/json" },
    });
}

/** PUT /api/auth/change-password — change authenticated user's password */
export async function changePassword(
    request: ChangePasswordRequest,
): Promise<void> {
    await apiClient.put(CORE_ROUTES.AUTH.CHANGE_PASSWORD, request);
}

// ─── Two-Factor Authentication ───────────────────────────────────────────────

/** POST /api/auth/2fa/login-confirm — complete 2FA challenge during login */
export async function confirmTwoFactorLogin(
    request: TwoFactorLoginRequest,
): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
        CORE_ROUTES.AUTH.TWO_FACTOR_LOGIN_CONFIRM,
        request,
    );
    return data;
}

/** POST /api/auth/2fa/setup — start 2FA setup for authenticated user */
export async function setupTwoFactor(): Promise<TwoFactorSetupResponse> {
    const { data } = await apiClient.post<TwoFactorSetupResponse>(
        CORE_ROUTES.AUTH.TWO_FACTOR_SETUP,
    );
    return data;
}

/** POST /api/auth/2fa/verify — verify 6-digit code to enable 2FA */
export async function verifyTwoFactor(
    request: TwoFactorVerifyRequest,
): Promise<boolean> {
    const { data } = await apiClient.post<{ message: string }>(
        CORE_ROUTES.AUTH.TWO_FACTOR_VERIFY,
        request,
    );
    return !!data.message;
}

/** POST /api/auth/2fa/disable — disable 2FA for authenticated user */
export async function disableTwoFactor(): Promise<void> {
    await apiClient.post(CORE_ROUTES.AUTH.TWO_FACTOR_DISABLE);
}

// ─── User Endpoints ──────────────────────────────────────────────────────────

/** POST /api/users — register a new user */
export async function register(
    request: RegisterRequest,
): Promise<UserResponse> {
    const { data } = await apiClient.post<UserResponse>(
        CORE_ROUTES.USERS.BASE,
        request,
    );
    return data;
}

/** GET /api/users/{id} — fetch complete user profile */
export async function getProfile(userId: string): Promise<UserResponse> {
    const { data } = await apiClient.get<UserResponse>(
        CORE_ROUTES.USERS.BY_ID(userId),
    );
    return data;
}

/** PUT /api/users/{id} — update user profile */
export async function updateProfile(
    userId: string,
    request: UserUpdateRequest,
): Promise<UserResponse> {
    const { data } = await apiClient.put<UserResponse>(
        CORE_ROUTES.USERS.BY_ID(userId),
        request,
    );
    return data;
}

/** DELETE /api/users/{id} — delete user account */
export async function deleteAccount(userId: string): Promise<void> {
    await apiClient.delete(CORE_ROUTES.USERS.BY_ID(userId));
}

// ─── Token Utilities ─────────────────────────────────────────────────────────

/** Known role values that the backend JWT emits */
const VALID_ROLES: ReadonlySet<string> = new Set<UserRoleName>([
    "ADMIN",
    "RESEARCHER",
    "ENTREPRENEUR",
    "COMMUNITY",
    "BUYER",
    "AUTHORITY",
]);

/**
 * Decode user information from a JWT access token.
 * The backend JWT contains: sub (id), email, name (fullName), role.
 * Does NOT validate the token — only extracts the payload.
 */
export function decodeUserFromToken(token: string): UserResponse | null {
    try {
        const payload = token.split(".")[1];
        if (!payload) return null;

        const decoded = JSON.parse(atob(payload));

        const id =
            decoded.sub ??
            decoded[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
            ];

        if (!id) return null;

        // Extract roles — JWT may have single string or array for `role` claim
        const rawRole =
            decoded.role ??
            decoded[
                "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ];

        let roles: UserRoleName[] = [];
        if (Array.isArray(rawRole)) {
            roles = rawRole.filter((r: string) =>
                VALID_ROLES.has(r),
            ) as UserRoleName[];
        } else if (typeof rawRole === "string" && VALID_ROLES.has(rawRole)) {
            roles = [rawRole as UserRoleName];
        }

        return {
            id,
            fullName: decoded.name ?? "",
            email:
                decoded.email ??
                decoded[
                    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                ] ??
                "",
            phoneNumber: decoded.phone_number ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: null,
            twoFactorEnabled: false,
            roles,
        };
    } catch {
        return null;
    }
}
