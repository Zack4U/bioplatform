/**
 * Centralized API route constants for the Administration Panel.
 *
 * All admin-related route strings in one place — eliminates magic strings.
 * Base path: /api (prepended by Axios baseURL from constants.ts)
 *
 * @module services/routes/admin-routes
 */

export const ADMIN_ROUTES = {
    /** Admin Dashboard metrics */
    DASHBOARD: {
        METRICS: "/admin/dashboard/metrics",
        REVENUE_CHART: "/admin/dashboard/revenue-chart",
        RECENT_ACTIVITY: "/admin/dashboard/recent-activity",
    },

    /** Admin Users management — extends CORE_ROUTES.USERS */
    USERS: {
        BASE: "/admin/users",
        BY_ID: (id: string) => `/admin/users/${id}` as const,
        TOGGLE_ACTIVE: (id: string) =>
            `/admin/users/${id}/toggle-active` as const,
        ASSIGN_ROLES: (id: string) =>
            `/admin/users/${id}/assign-roles` as const,
    },

    /** Admin Species management */
    SPECIES: {
        BASE: "/admin/species",
        BY_ID: (id: string) => `/admin/species/${id}` as const,
        TOGGLE_SENSITIVE: (id: string) =>
            `/admin/species/${id}/toggle-sensitive` as const,
    },

    /** Admin Images management */
    IMAGES: {
        BASE: "/admin/images",
        BY_ID: (id: string) => `/admin/images/${id}` as const,
        VALIDATE: (id: string) => `/admin/images/${id}/validate` as const,
        REJECT: (id: string) => `/admin/images/${id}/reject` as const,
    },

    /** Admin Products management */
    PRODUCTS: {
        BASE: "/admin/products",
        BY_ID: (id: string) => `/admin/products/${id}` as const,
        TOGGLE_ACTIVE: (id: string) =>
            `/admin/products/${id}/toggle-active` as const,
    },

    /** ABS Permits management */
    PERMITS: {
        BASE: "/admin/permits",
        BY_ID: (id: string) => `/admin/permits/${id}` as const,
        CHANGE_STATUS: (id: string) =>
            `/admin/permits/${id}/status` as const,
    },

    /** Requests / Solicitudes management */
    REQUESTS: {
        BASE: "/admin/requests",
        BY_ID: (id: string) => `/admin/requests/${id}` as const,
        APPROVE: (id: string) => `/admin/requests/${id}/approve` as const,
        REJECT: (id: string) => `/admin/requests/${id}/reject` as const,
    },

    /** CNN Model versions management */
    AI_MODELS: {
        BASE: "/admin/ai-models",
        BY_ID: (id: number) => `/admin/ai-models/${id}` as const,
        ACTIVATE: (id: number) => `/admin/ai-models/${id}/activate` as const,
        METRICS: (id: number) => `/admin/ai-models/${id}/metrics` as const,
    },

    /** Chatbot / RAG management */
    CHATBOT: {
        SESSIONS: "/admin/chatbot/sessions",
        SESSION_BY_ID: (id: string) =>
            `/admin/chatbot/sessions/${id}` as const,
        SESSION_MESSAGES: (id: string) =>
            `/admin/chatbot/sessions/${id}/messages` as const,
        RAG_DOCUMENTS: "/admin/chatbot/rag-documents",
        RAG_DOCUMENT_BY_ID: (id: string) =>
            `/admin/chatbot/rag-documents/${id}` as const,
    },

    /** Orders management */
    ORDERS: {
        BASE: "/admin/orders",
        BY_ID: (id: string) => `/admin/orders/${id}` as const,
        UPDATE_STATUS: (id: string) =>
            `/admin/orders/${id}/status` as const,
    },

    /** Reviews management */
    REVIEWS: {
        BASE: "/admin/reviews",
        BY_ID: (id: string) => `/admin/reviews/${id}` as const,
        FLAG: (id: string) => `/admin/reviews/${id}/flag` as const,
    },
} as const;
