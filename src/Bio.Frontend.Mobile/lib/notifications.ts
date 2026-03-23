// Servicio global de notificaciones para Sonner-native
// Permite mostrar toasts desde cualquier parte de la app
// WCAG 2.1 AA: Sonner-native ya incluye accesibilidad

import { toast } from "sonner-native";

export const notificationService = {
    success(message: string, options?: object) {
        toast.success(message, {
            duration: 4000,
            ...options,
        });
    },
    error(message: string, options?: object) {
        toast.error(message, {
            duration: 6000,
            ...options,
        });
    },
    warning(message: string, options?: object) {
        toast.warning(message, {
            duration: 5000,
            ...options,
        });
    },
    info(message: string, options?: object) {
        toast.info(message, {
            duration: 4000,
            ...options,
        });
    },
    loading(message: string, options?: object) {
        return toast.loading(message, options);
    },
    promise<T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: (data: T) => string;
            error: (error: unknown) => string;
        },
    ) {
        return toast.promise(promise, messages);
    },
    dismiss(toastId?: string | number) {
        toast.dismiss(toastId);
    },
};
