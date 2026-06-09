/**
 * Centralized API route constants for the Administration Panel.
 *
 * Updated to match real backend endpoints (Bio.Backend.Core).
 * All paths are relative to the Axios baseURL.
 *
 * @module services/routes/admin-routes
 */

export const ADMIN_ROUTES = {
    // ─── Dashboard (per-role) ───────────────────────────────────────────────
    DASHBOARD: {
        ADMIN:        "/v1/dashboard/admin",
        RESEARCHER:   "/v1/dashboard/researcher",
        SELLER:       "/v1/dashboard/seller/enhanced",
        AUTHORITY:    "/v1/dashboard/authority",
        BUYER:        "/v1/dashboard/buyer",
        SOCIAL:       "/v1/dashboard/social",
    },

    // ─── Users ─────────────────────────────────────────────────────────────
    USERS: {
        FILTERED:     "/users/filtered",
        BY_ID:        (id: string) => `/users/${id}` as const,
        ACTIVATE:     (id: string) => `/users/${id}/activate` as const,
        DEACTIVATE:   (id: string) => `/users/${id}/deactivate` as const,
    },

    // ─── Roles ─────────────────────────────────────────────────────────────
    ROLES: {
        BASE:         "/roles",
        BY_ID:        (id: string) => `/roles/${id}` as const,
    },

    // ─── User-Roles ────────────────────────────────────────────────────────
    USER_ROLES: {
        BASE:         "/user-roles",
        BY_USER:      (userId: string) => `/user-roles/user/${userId}` as const,
        ASSIGN:       "/user-roles",
        REMOVE:       (userId: string, roleId: string) =>
                          `/user-roles/user/${userId}/role/${roleId}` as const,
    },

    // ─── Species ────────────────────────────────────────────────────────────
    SPECIES: {
        BASE:         "/species",
        BY_ID:        (id: string) => `/species/${id}` as const,
        IMAGES:       (id: string) => `/species/${id}/images` as const,
        VALIDATE_IMG: (speciesId: string, imageId: string) =>
                          `/species/${speciesId}/images/${imageId}/validate` as const,
        REJECT_IMG:   (speciesId: string, imageId: string) =>
                          `/species/${speciesId}/images/${imageId}/reject` as const,
    },

    // ─── Products (admin/manage) ────────────────────────────────────────────
    PRODUCTS: {
        MANAGED:      "/manage/products",
        BY_ID:        (id: string) => `/manage/products/${id}` as const,
        ACTIVATE:     (id: string) => `/manage/products/${id}/activate` as const,
        DEACTIVATE:   (id: string) => `/manage/products/${id}/deactivate` as const,
    },

    // ─── Orders ─────────────────────────────────────────────────────────────
    ORDERS: {
        MANAGED:      "/orders/manage",
        BY_ID:        (id: string) => `/orders/${id}` as const,
        UPDATE_STATUS: (id: string) => `/orders/${id}/status` as const,
    },

    // ─── Reviews ────────────────────────────────────────────────────────────
    REVIEWS: {
        BY_PRODUCT:   (productId: string) => `/products/${productId}/reviews` as const,
        DELETE:       (productId: string, reviewId: string) =>
                          `/products/${productId}/reviews/${reviewId}` as const,
        MANAGE:        "/reviews/manage",
        TOGGLE_REPORT: (reviewId: string) => `/reviews/${reviewId}/toggle-report` as const,
        DELETE_MANAGED: (reviewId: string) => `/reviews/${reviewId}` as const,
    },

    // ─── ABS Permits ────────────────────────────────────────────────────────
    PERMITS: {
        BASE:         "/v1/abs-permits",
        BY_ID:        (id: string) => `/v1/abs-permits/${id}` as const,
        BY_ENTREPRENEUR: (id: string) => `/v1/abs-permits/entrepreneur/${id}` as const,
        UPLOAD_DOC:   "/v1/abs-permits/documents/upload",
        REQUEST:        "/v1/abs-permits/request",
        CANCEL_REQUEST: (id: string) => `/v1/abs-permits/${id}/request` as const,
        APPROVE:        (id: string) => `/v1/abs-permits/${id}/approve` as const,
        REJECT:         (id: string) => `/v1/abs-permits/${id}/reject` as const,
    },

    // ─── Platform Requests (aggregated solicitudes) ─────────────────────────
    REQUESTS: {
        BASE:         "/v1/requests",
    },

    // ─── Activity Logs (Audit) ───────────────────────────────────────────────
    AUDIT: {
        BASE:         "/v1/activity-logs",
        BY_ID:        (id: string) => `/v1/activity-logs/${id}` as const,
    },

    // ─── AI Models (kept for compatibility with useAiModelManagement) ────────
    AI_MODELS: {
        BASE:         "/v1/ai/models",
        BY_ID:        (id: number) => `/v1/ai/models/${id}` as const,
        ACTIVATE:     (id: number) => `/v1/ai/models/${id}/activate` as const,
        METRICS:      "/v1/ai/models/active",
    },
} as const;
