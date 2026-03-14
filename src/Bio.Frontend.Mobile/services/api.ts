/**
 * Base API service — typed wrappers around the Axios client.
 * All feature services extend these helpers.
 *
 * Adapted for React Native: imports from axios-client instead of axios.
 */

import apiClient from "@/lib/axios-client";
import type { ApiResponse, PaginatedResponse } from "@/types";

/** GET a single resource by URL */
export async function apiGet<T>(
    url: string,
    params?: Record<string, unknown>,
): Promise<T> {
    const { data } = await apiClient.get<ApiResponse<T>>(url, { params });
    return data.data;
}

/** GET a paginated list */
export async function apiGetPaginated<T>(
    url: string,
    params?: Record<string, unknown>,
): Promise<PaginatedResponse<T>> {
    const { data } = await apiClient.get<PaginatedResponse<T>>(url, { params });
    return data;
}

/** POST a resource */
export async function apiPost<TRequest, TResponse>(
    url: string,
    body: TRequest,
): Promise<TResponse> {
    const { data } = await apiClient.post<ApiResponse<TResponse>>(url, body);
    return data.data;
}

/** PUT (full update) a resource */
export async function apiPut<TRequest, TResponse>(
    url: string,
    body: TRequest,
): Promise<TResponse> {
    const { data } = await apiClient.put<ApiResponse<TResponse>>(url, body);
    return data.data;
}

/** PATCH (partial update) a resource */
export async function apiPatch<TRequest, TResponse>(
    url: string,
    body: Partial<TRequest>,
): Promise<TResponse> {
    const { data } = await apiClient.patch<ApiResponse<TResponse>>(url, body);
    return data.data;
}

/** DELETE a resource */
export async function apiDelete<T = void>(url: string): Promise<T> {
    const { data } = await apiClient.delete<ApiResponse<T>>(url);
    return data.data;
}

/** POST with multipart/form-data (file uploads) */
export async function apiUpload<T>(
    url: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
): Promise<T> {
    const { data } = await apiClient.post<ApiResponse<T>>(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
            if (onProgress && event.total) {
                onProgress(Math.round((event.loaded * 100) / event.total));
            }
        },
    });
    return data.data;
}
