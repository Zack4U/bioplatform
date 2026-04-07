/**
 * Axios HTTP Client — Expo/React Native compatible for BioCommerce Caldas Mobile.
 *
 * Features:
 * - Base URL from environment variables (EXPO_PUBLIC_API_BASE_URL)
 * - JWT auth interceptor (attaches access token)
 * - Automatic token refresh on 401 (sends both accessToken + refreshToken)
 * - Global error handling with Sonner-native
 * - Request/response logging in development
 *
 * @safety Never hardcode API keys. Use EXPO_PUBLIC_* env vars.
 */

import { API_BASE_URL } from "@/lib/constants";
import { notificationService } from "@/lib/notifications";
import { CORE_ROUTES } from "@/services/routes";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, {
    type AxiosError,
    type AxiosInstance,
    type AxiosResponse,
    type InternalAxiosRequestConfig,
} from "axios";
import { router } from "expo-router";

interface RetryableConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// ─── Request Interceptor ──────────────────────────────────────────────
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        // Attach JWT if available (AsyncStorage)
        const token = await AsyncStorage.getItem("accessToken");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
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

// ─── Response Interceptor ─────────────────────────────────────────────
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableConfig | undefined;
        // 401: attempt silent token refresh once
        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            try {
                const refreshToken =
                    await AsyncStorage.getItem("refreshToken");
                const accessToken =
                    await AsyncStorage.getItem("accessToken");
                if (refreshToken && accessToken) {
                    // Matches RefreshRequestDTO { AccessToken, RefreshToken }
                    const { data } = await axios.post<{
                        accessToken: string;
                        refreshToken: string;
                    }>(`${API_BASE_URL}${CORE_ROUTES.AUTH.REFRESH}`, {
                        accessToken,
                        refreshToken,
                    });
                    await AsyncStorage.setItem(
                        "accessToken",
                        data.accessToken,
                    );
                    await AsyncStorage.setItem(
                        "refreshToken",
                        data.refreshToken,
                    );
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    }
                    return apiClient(originalRequest);
                }
            } catch {
                // Refresh failed — clear tokens and redirect to login
                await AsyncStorage.removeItem("accessToken");
                await AsyncStorage.removeItem("refreshToken");
                notificationService.warning(
                    "Sesion expirada. Por favor, inicia sesion de nuevo.",
                );
                router.replace("/login");
            }
        }

        return Promise.reject(error);
    },
);

export default apiClient;
