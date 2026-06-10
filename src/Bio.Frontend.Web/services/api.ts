/**
 * Base API service — typed wrappers around the Axios client.
 * All feature services extend these helpers.
 */

import apiClient from "@/lib/axios";
import type { ApiResponse, PaginatedResponse } from "@/types";

/** GET a single resource by URL */
export async function apiGet<T>(
    url: string,
    params?: Record<string, unknown>,
): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(url, { params });
    return response.data && response.data.data !== undefined
        ? response.data.data
        : (response.data as T);
}

/** GET a paginated list */
export async function apiGetPaginated<T>(
    url: string,
    params?: Record<string, unknown>,
): Promise<PaginatedResponse<T>> {
    const response = await apiClient.get<PaginatedResponse<T>>(url, { params });
    return response.data;
}

/** POST a resource */
export async function apiPost<TRequest, TResponse>(
    url: string,
    body: TRequest,
): Promise<TResponse> {
    const response = await apiClient.post<ApiResponse<TResponse>>(url, body);
    return response.data && response.data.data !== undefined
        ? response.data.data
        : (response.data as TResponse);
}

/** PUT (full update) a resource */
export async function apiPut<TRequest, TResponse>(
    url: string,
    body: TRequest,
): Promise<TResponse> {
    const response = await apiClient.put<ApiResponse<TResponse>>(url, body);
    return response.data && response.data.data !== undefined
        ? response.data.data
        : (response.data as TResponse);
}

/** PATCH (partial update) a resource */
export async function apiPatch<TRequest, TResponse>(
    url: string,
    body: Partial<TRequest>,
): Promise<TResponse> {
    const response = await apiClient.patch<ApiResponse<TResponse>>(url, body);
    return response.data && response.data.data !== undefined
        ? response.data.data
        : (response.data as TResponse);
}

/** DELETE a resource */
export async function apiDelete<T>(url: string): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(url);
    return response.data && response.data.data !== undefined
        ? response.data.data
        : (response.data as T);
}

/** POST with multipart/form-data (file uploads) */
export async function apiUpload<T>(
    url: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
            if (onProgress && event.total) {
                onProgress(Math.round((event.loaded * 100) / event.total));
            }
        },
    });
    return response.data && response.data.data !== undefined
        ? response.data.data
        : (response.data as T);
}
