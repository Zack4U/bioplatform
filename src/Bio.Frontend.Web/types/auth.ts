/**
 * TypeScript types — Identity & Access Management (SQL Server)
 * Maps to: BioCommerce_Transactional database
 */

/** User entity — mirrors Users table (SQL Server) */
export interface User {
    id: string;
    email: string;
    fullName: string;
    phoneNumber: string | null;
    isVerified: boolean;
    isActive: boolean;
    roles: Role[];
    createdAt: string; // ISO 8601 UTC — format to local time only in UI
}

/** Role entity — mirrors Roles table */
export interface Role {
    id: number;
    name: UserRoleName;
    description: string | null;
}

export type UserRoleName =
    | "Admin"
    | "Researcher"
    | "Entrepreneur"
    | "Community"
    | "Buyer"
    | "EnvironmentalAuthority";

/** Authentication DTOs */
export interface LoginRequest {
    email: string;
    password: string;
    totpCode?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: User;
}

export interface RegisterRequest {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    role: UserRoleName;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
}
