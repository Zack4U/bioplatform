/**
 * Global notification service — wraps Sonner toast.
 *
 * Provides a centralized, importable API for showing notifications
 * from anywhere (hooks, services, error handlers) without needing
 * React context or component mounting.
 *
 * WCAG 2.1 AA: all toasts include appropriate aria-live attributes
 * via Sonner's built-in accessibility support.
 */

import { toast, type ExternalToast } from "sonner";

type ToastOptions = ExternalToast;

/**
 * Centralized notification service.
 * Usage: `notificationService.success("Item saved!")`
 */
export const notificationService = {
    /** Success notification — green accent */
    success(message: string, options?: ToastOptions) {
        return toast.success(message, {
            duration: 4000,
            ...options,
        });
    },

    /** Error notification — red/destructive accent */
    error(message: string, options?: ToastOptions) {
        return toast.error(message, {
            duration: 6000,
            ...options,
        });
    },

    /** Warning notification — amber accent */
    warning(message: string, options?: ToastOptions) {
        return toast.warning(message, {
            duration: 5000,
            ...options,
        });
    },

    /** Info notification — blue accent */
    info(message: string, options?: ToastOptions) {
        return toast.info(message, {
            duration: 4000,
            ...options,
        });
    },

    /** Loading notification — returns ID for later dismissal */
    loading(message: string, options?: ToastOptions) {
        return toast.loading(message, options);
    },

    /** Promise-based notification — shows loading, then success/error */
    promise<T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: unknown) => string);
        },
    ) {
        return toast.promise(promise, messages);
    },

    /** Dismiss a specific toast by ID, or all toasts */
    dismiss(toastId?: string | number) {
        toast.dismiss(toastId);
    },
};
