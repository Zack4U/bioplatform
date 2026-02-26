/**
 * Global error handler for API and application errors.
 * Integrates with Sonner toast notifications.
 *
 * Provides consistent error messaging across the entire application.
 */

import { notificationService } from "@/lib/notifications";
import type { ApiErrorResponse } from "@/types";
import { type AxiosError, isAxiosError } from "axios";

/** Parsed error structure for UI consumption */
export interface ParsedError {
    title: string;
    detail: string;
    status: number;
    fieldErrors?: Record<string, string[]>;
}

/**
 * Parse any error into a consistent structure.
 */
export function parseError(error: unknown): ParsedError {
    // Axios error with API response body
    if (isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const response = axiosError.response;

        if (response?.data) {
            const apiError = response.data;
            return {
                title: apiError.title || getDefaultTitle(response.status),
                detail: apiError.detail || axiosError.message,
                status: response.status,
                fieldErrors: apiError.errors,
            };
        }

        // Network / timeout errors
        if (axiosError.code === "ECONNABORTED") {
            return {
                title: "Tiempo de espera agotado",
                detail: "El servidor no respondió a tiempo. Por favor, intenta de nuevo.",
                status: 408,
            };
        }

        if (!axiosError.response) {
            return {
                title: "Error de conexión",
                detail: "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
                status: 0,
            };
        }

        return {
            title: getDefaultTitle(axiosError.response.status),
            detail: axiosError.message,
            status: axiosError.response.status,
        };
    }

    // Standard JS Error
    if (error instanceof Error) {
        return {
            title: "Error inesperado",
            detail: error.message,
            status: 500,
        };
    }

    // Unknown
    return {
        title: "Error desconocido",
        detail: "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
        status: 500,
    };
}

/**
 * Handle error globally — parse and show toast.
 * Call this from React Query's `onError` or catch blocks.
 */
export function handleApiError(error: unknown): ParsedError {
    const parsed = parseError(error);

    // Show toast based on severity
    if (parsed.status === 401) {
        notificationService.warning(
            "Sesión expirada. Por favor, inicia sesión de nuevo.",
        );
    } else if (parsed.status === 403) {
        notificationService.error(
            "No tienes permisos para realizar esta acción.",
        );
    } else if (parsed.status === 404) {
        notificationService.warning("El recurso solicitado no fue encontrado.");
    } else if (parsed.status === 422 && parsed.fieldErrors) {
        const firstError = Object.values(parsed.fieldErrors)[0]?.[0];
        notificationService.error(firstError ?? parsed.detail);
    } else if (parsed.status >= 500) {
        notificationService.error(
            "Error interno del servidor. Nuestro equipo ha sido notificado.",
        );
    } else if (parsed.status === 0) {
        notificationService.error(parsed.detail);
    } else {
        notificationService.error(parsed.detail);
    }

    return parsed;
}

/** Map HTTP status to Spanish title */
function getDefaultTitle(status: number): string {
    const titles: Record<number, string> = {
        400: "Solicitud inválida",
        401: "No autenticado",
        403: "Acceso denegado",
        404: "No encontrado",
        408: "Tiempo agotado",
        409: "Conflicto",
        422: "Error de validación",
        429: "Demasiadas solicitudes",
        500: "Error del servidor",
        502: "Puerta de enlace incorrecta",
        503: "Servicio no disponible",
    };
    return titles[status] ?? "Error";
}
