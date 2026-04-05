/**
 * Classification Service — AI backend (FastAPI).
 *
 * Communicates with the AI microservice at /api/v1.
 * Uses a dedicated Axios instance so requests hit the AI base URL
 * while still attaching the same JWT from localStorage.
 *
 * Mirrors the mobile classification-service patterns:
 * - Dev logging on every request
 * - JWT from localStorage
 * - Toast notifications for context-aware error messages
 * - snake_case → camelCase auto-conversion
 *
 * IMPORTANT: The Python backend returns snake_case JSON keys.
 * A response interceptor automatically converts them to camelCase
 * so TypeScript types (camelCase) work correctly.
 *
 * @module services/classification-service
 */

import { AI_API_BASE_URL } from "@/lib/constants";
import { AI_ROUTES } from "@/services/routes";
import type {
    ClassificationResponse,
    HealthResponse,
    ModelInfoResponse,
    ModelMetricsResponse,
} from "@/types";
import axios, {
    type AxiosError,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

// ── snake_case → camelCase deep converter ────────────────────────────────────

/** Convert a single snake_case string to camelCase. */
function snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter: string) =>
        letter.toUpperCase(),
    );
}

/**
 * Recursively convert all keys in a value from snake_case to camelCase.
 * Handles plain objects, arrays, and leaves primitives untouched.
 */
function snakeToCamelDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map(snakeToCamelDeep);
    }
    if (value !== null && typeof value === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            result[snakeToCamel(key)] = snakeToCamelDeep(val);
        }
        return result;
    }
    return value;
}

// ── AI-specific Axios client ─────────────────────────────────────────────────

const aiClient = axios.create({
    baseURL: AI_API_BASE_URL,
    timeout: 60_000, // CNN inference can be slow on CPU
    headers: { Accept: "application/json" },
});

// ─── Request Interceptor ──────────────────────────────────────────────

aiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Attach JWT if available (localStorage)
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        // Dev logging (matches CORE client pattern)
        if (process.env.NODE_ENV === "development") {
            console.debug(
                `[AI] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
            );
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────────

aiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        // Convert snake_case → camelCase for all successful responses
        if (response.data && typeof response.data === "object") {
            response.data = snakeToCamelDeep(response.data);
        }
        return response;
    },
    async (error: AxiosError) => {
        const status = error.response?.status;
        const detail =
            (error.response?.data as { detail?: string })?.detail ?? "";

        if (process.env.NODE_ENV === "development") {
            console.debug(
                `[AI] Error ${status ?? "NETWORK"} ${error.config?.url} — ${detail || error.message}`,
            );
        }

        // Context-aware error messages via Sonner
        switch (status) {
            case 401:
            case 403:
                toast.warning(
                    "Inicia sesion para usar el identificador de especies.",
                );
                break;
            case 413:
                toast.error(
                    "La imagen es demasiado grande. Maximo 10 MB.",
                );
                break;
            case 503:
                toast.warning(
                    "El modelo de IA aun no esta listo. Intenta en unos segundos.",
                );
                break;
            case 500:
                toast.error(
                    detail || "Error interno del servicio de IA.",
                );
                break;
            default:
                if (!status) {
                    toast.error(
                        "No se pudo conectar con el servicio de IA. Verifica tu conexion.",
                    );
                }
                break;
        }

        return Promise.reject(error);
    },
);

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Classify a species image via CNN model.
 *
 * @param file      File object from input[type=file] or drag-and-drop.
 * @param topK      Number of top predictions (1-20, default 5).
 */
export async function classifyImage(
    file: File,
    topK = 5,
): Promise<ClassificationResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await aiClient.post<ClassificationResponse>(
        AI_ROUTES.CLASSIFICATION.CLASSIFY,
        formData,
        {
            headers: { "Content-Type": "multipart/form-data" },
            params: { top_k: topK },
        },
    );
    return data;
}

/**
 * Fetch CNN model metadata (architecture, classes, device, etc.).
 * This endpoint is public — no JWT required.
 */
export async function getModelInfo(): Promise<ModelInfoResponse> {
    const { data } = await aiClient.get<ModelInfoResponse>(
        AI_ROUTES.CLASSIFICATION.MODEL_INFO,
    );
    return data;
}

/**
 * Fetch CNN model evaluation metrics (accuracy, F1, per-class stats).
 * This endpoint is public — no JWT required.
 */
export async function getModelMetrics(): Promise<ModelMetricsResponse> {
    const { data } = await aiClient.get<ModelMetricsResponse>(
        AI_ROUTES.CLASSIFICATION.METRICS,
    );
    return data;
}

/**
 * Check AI service health (CNN model status + DB connectivity).
 * Endpoint lives at `/health` (root level, not under /api/v1).
 * Public — no JWT required. Uses plain axios (no aiClient interceptors),
 * so we manually convert snake_case → camelCase.
 */
export async function checkHealth(): Promise<HealthResponse> {
    // Strip /api/v1 suffix to hit the root-level /health endpoint
    const rootUrl = AI_API_BASE_URL.replace(/\/api\/v1\/?$/, "");
    const { data } = await axios.get(`${rootUrl}/health`, { timeout: 5_000 });
    return snakeToCamelDeep(data) as HealthResponse;
}
