/**
 * Centralized API route constants for the .NET Core backend.
 *
 * All route strings in one place — eliminates magic strings across services.
 * Base path: /api (prepended by Axios baseURL from constants.ts)
 *
 * @module services/routes/core-routes
 */

export const CORE_ROUTES = {
    /** AuthController — /api/auth */
    AUTH: {
        LOGIN: "/auth/login",
        REFRESH: "/auth/refresh",
        REVOKE: "/auth/revoke",
        CHANGE_PASSWORD: "/auth/change-password",
        TWO_FACTOR_SETUP: "/auth/2fa/setup",
        TWO_FACTOR_VERIFY: "/auth/2fa/verify",
        TWO_FACTOR_DISABLE: "/auth/2fa/disable",
        TWO_FACTOR_LOGIN_CONFIRM: "/auth/2fa/login-confirm",
    },

    /** UsersController — /api/users */
    USERS: {
        BASE: "/users",
        BY_ID: (id: string) => `/users/${id}` as const,
        BY_EMAIL: (email: string) => `/users/email/${email}` as const,
        BY_PHONE: (phone: string) => `/users/phone/${phone}` as const,
    },

    /** UserRolesController — /api/userroles */
    USER_ROLES: {
        BASE: "/userroles",
        BY_ID: (id: string) => `/userroles/${id}` as const,
    },

    /** SpeciesController — /api/species */
    SPECIES: {
        BASE: "/species",
        BY_ID: (id: string) => `/species/${id}` as const,
        BY_SLUG: (slug: string) => `/species/slug/${slug}` as const,
        FILTER_META: "/species/filter-meta",
        EXPORT: "/species/export",
        IMAGES_EXPORT: "/species/images/export",
        DISTRIBUTIONS: (id: string) => `/species/${id}/distributions` as const,
        IMAGES: (id: string) => `/species/${id}/images` as const,
        OBSERVATIONS: (id: string) => `/species/${id}/observations` as const,
    },

    /** TaxonomyController — /api/taxonomy */
    TAXONOMY: {
        BASE: "/taxonomy",
        BY_ID: (id: number) => `/taxonomy/${id}` as const,
    },
} as const;
