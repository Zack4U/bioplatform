/**
 * Centralized API route constants for the Python AI microservice (FastAPI).
 *
 * Base path: /api/v1 (prepended by AI Axios client baseURL)
 *
 * @module services/routes/ai-routes
 */

export const AI_ROUTES = {
    /** Vision / CNN classification */
    CLASSIFICATION: {
        CLASSIFY: "/classify",
        HEALTH: "/health",
    },

    /** RAG-based assistant */
    RAG: {
        CHAT: "/rag/chat",
        SEARCH: "/rag/search",
    },
} as const;
