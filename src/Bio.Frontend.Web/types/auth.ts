/**
 * TypeScript types — Identity & Access Management.
 * Maps exactly to .NET Backend DTOs (Bio.Application.DTOs).
 *
 * Naming: camelCase (TypeScript) <-> PascalCase (C#) — serialized via System.Text.Json.
 */

// ─── User ────────────────────────────────────────────────────────────────────

/** Maps to UserResponseDTO */
export interface UserResponse {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    createdAt: string; // ISO 8601 UTC — format to local time only in UI
    updatedAt: string | null;
    twoFactorEnabled: boolean;
    /** Roles decoded from JWT — not part of UserResponseDTO */
    roles: UserRoleName[];
}

/** Maps to UserCreateDTO */
export interface RegisterRequest {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
}

/** Maps to UserUpdateDTO */
export interface UserUpdateRequest {
    fullName: string;
    email: string;
    phoneNumber: string;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

/** Maps to LoginRequestDTO */
export interface LoginRequest {
    email: string;
    password: string;
}

/** Maps to AuthResponseDTO */
export interface AuthResponse {
    accessToken: string | null;
    refreshToken: string | null;
    accessTokenExpiration: string | null;
    twoFactorRequired: boolean;
    twoFactorToken: string | null;
}

/** Maps to RefreshRequestDTO */
export interface RefreshRequest {
    accessToken: string;
    refreshToken: string;
}

/** Maps to ChangePasswordRequestDTO */
export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}

// ─── Two-Factor Authentication ───────────────────────────────────────────────

/** Maps to TwoFactorLoginRequestDTO */
export interface TwoFactorLoginRequest {
    twoFactorToken: string;
    code: string;
}

/** Maps to TwoFactorSetupResponseDTO */
export interface TwoFactorSetupResponse {
    sharedKey: string;
    authenticatorUri: string;
}

/** Maps to TwoFactorVerifyRequestDTO */
export interface TwoFactorVerifyRequest {
    code: string;
}

// ─── Roles ───────────────────────────────────────────────────────────────────

/**
 * Matches backend RoleNames.cs constants (uppercase).
 * JWT `role` claim uses these exact values.
 */
export type UserRoleName =
    | "ADMIN"
    | "RESEARCHER"
    | "ENTREPRENEUR"
    | "COMMUNITY"
    | "BUYER"
    | "AUTHORITY";
