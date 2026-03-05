/**
 * Axios HTTP Client — configured singleton for BioCommerce Caldas.
 *
 * Features:
 * - Base URL from environment variables
 * - JWT auth interceptor (attaches access token)
 * - Automatic token refresh on 401
 * - Global error handling with Sonner toast notifications
 * - Request/response logging in development
 *
 * @safety Never hardcode API keys. Use NEXT_PUBLIC_* env vars.
 */

import { API_BASE_URL } from "@/lib/constants";
import type { ApiErrorResponse } from "@/types";
import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from "axios";

/** Extended config to support retry flag */
interface RetryableConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

/**
 * Create the base Axios instance.
 */
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30_000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────

apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Attach JWT if available (client-side only)
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("accessToken");
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        // Dev logging
        if (process.env.NODE_ENV === "development") {
            console.debug(
                `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
            );
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError<ApiErrorResponse>) => {
        const originalRequest = error.config as RetryableConfig | undefined;

        // 401: attempt silent token refresh once
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (refreshToken) {
                    const { data } = await axios.post<{
                        accessToken: string;
                        refreshToken: string;
                    }>(`${API_BASE_URL}/auth/refresh`, { refreshToken });

                    localStorage.setItem("accessToken", data.accessToken);
                    localStorage.setItem("refreshToken", data.refreshToken);

                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    }
                    return apiClient(originalRequest);
                }
            } catch {
                // Refresh failed — clear tokens and redirect to login
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                if (typeof window !== "undefined") {
                    window.location.href = "/login";
                }
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
