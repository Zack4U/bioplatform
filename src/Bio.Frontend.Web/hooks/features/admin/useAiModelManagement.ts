/**
 * React Query hooks for AI model management and automatic/manual fine-tuning.
 *
 * - useAiHardwareStatus()    — query to fetch GPU/VRAM hardware availability
 * - useAiModelVersions()    — query to fetch all versioned models in DB
 * - useActiveModelMetrics() — query to fetch active model metrics
 * - useRecentTrainingJobs() — query to fetch recent training jobs history
 * - useStartFineTuning()    — mutation to start automatic server-side training
 * - useUploadManualModel()  — mutation to manually upload local weights + config + metrics
 * - useValidateModel()      — mutation to pre-evaluate candidate model on test subset
 * - useActivateModel()      — mutation to activate a version (triggers FastAPI hot-swap)
 *
 * @module hooks/features/admin/useAiModelManagement
 */

import {
    getAiHardwareStatus,
    getAiModelVersions,
    getActiveModelMetrics,
    activateModelVersion,
    deactivateModelVersion,
    deleteModelVersion,
    getRecentTrainingJobs,
    startFineTuning,
    uploadManualModel,
    validateModel,
    getNewObservationsSummary,
} from "@/services/ai-admin-service";
import type {
    AiHardwareStatus,
    ActiveModelMetrics,
    CnnModelVersion,
    AiTrainingJob,
    StartFineTuningResponse,
    ModelUploadResponse,
    ModelValidateResponse,
    ActivateModelVersionResponse,
    NewObservationsSummary,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ── Query Keys ───────────────────────────────────────────────────────────────

export const AI_ADMIN_KEYS = {
    all: ["ai-admin"] as const,
    hardware: ["ai-admin", "hardware"] as const,
    models: ["ai-admin", "models"] as const,
    active: ["ai-admin", "active"] as const,
    jobs: ["ai-admin", "jobs"] as const,
    observationsSummary: ["ai-admin", "observations-summary"] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────

/** Hook to fetch GPU/VRAM hardware availability and training capabilities */
export function useAiHardwareStatus() {
    return useQuery<AiHardwareStatus>({
        queryKey: AI_ADMIN_KEYS.hardware,
        queryFn: getAiHardwareStatus,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/** Hook to fetch all model versions registered in PostgreSQL */
export function useAiModelVersions() {
    return useQuery<CnnModelVersion[]>({
        queryKey: AI_ADMIN_KEYS.models,
        queryFn: getAiModelVersions,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/** Hook to fetch the currently active AI model version metrics */
export function useActiveModelMetrics() {
    return useQuery<ActiveModelMetrics>({
        queryKey: AI_ADMIN_KEYS.active,
        queryFn: getActiveModelMetrics,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/** Hook to fetch the recent automatic fine-tuning training jobs history */
export function useRecentTrainingJobs(count = 10) {
    return useQuery<AiTrainingJob[]>({
        queryKey: [...AI_ADMIN_KEYS.jobs, count],
        queryFn: () => getRecentTrainingJobs(count),
        staleTime: 10 * 1000, // 10 seconds
        refetchInterval: (query) => {
            const jobs = query.state.data;
            const hasActiveJob = jobs?.some(
                (j) => j.status === "Running" || j.status === "Pending"
            );
            return hasActiveJob ? 3000 : false;
        },
    });
}

/**
 * Hook to fetch count of new species images and affected species since
 * the active model was deployed. Used in the admin production metrics panel.
 */
export function useNewObservationsSummary() {
    return useQuery<NewObservationsSummary>({
        queryKey: AI_ADMIN_KEYS.observationsSummary,
        queryFn: getNewObservationsSummary,
        staleTime: 5 * 60 * 1000, // 5 minutes — this data changes rarely
    });
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Hook to trigger automatic server-side fine-tuning */
export function useStartFineTuning() {
    const queryClient = useQueryClient();

    return useMutation<
        StartFineTuningResponse,
        Error,
        { epochs?: number; learningRate?: number; replayBufferRatio?: number }
    >({
        mutationFn: startFineTuning,
        onSuccess: () => {
            toast.success("Trabajo de entrenamiento iniciado con éxito en el servidor.");
            queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.jobs });
        },
        onError: (error) => {
            toast.error(error.message || "Error al iniciar el entrenamiento automático.");
        },
    });
}

/** Hook to manually upload a locally trained CNN model version */
export function useUploadManualModel() {
    const queryClient = useQueryClient();

    return useMutation<
        ModelUploadResponse,
        Error,
        { weightsFile: File; configFile: File; metricsFile: File; notes?: string }
    >({
        mutationFn: ({ weightsFile, configFile, metricsFile, notes }) =>
            uploadManualModel(weightsFile, configFile, metricsFile, notes),
        onSuccess: () => {
            toast.success("Archivos del modelo subidos correctamente. Procesando e integrando en DVC...");
            queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.models });
            queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.jobs });
        },
        onError: (error) => {
            toast.error(error.message || "Error al subir los archivos del modelo.");
        },
    });
}

/** Hook to run pre-activation validation check on candidate version */
export function useValidateModel() {
    return useMutation<ModelValidateResponse, Error, { version: string }>({
        mutationFn: ({ version }) => validateModel(version),
        onSuccess: (data) => {
            if (data.isSafeToActivate) {
                toast.success(`Validación exitosa: precisión del ${Math.round(data.accuracy * 100)}% en subset de test.`);
            } else {
                toast.warning(`Advertencia: precisión degradada a ${Math.round(data.accuracy * 100)}% (caída de ${Math.round((data.accuracyDrop || 0) * -100)}%).`);
            }
        },
        onError: (error) => {
            toast.error(error.message || "Error al validar el modelo.");
        },
    });
}

/** Hook to deactivate (suspend) a model version */
export function useDeactivateModel() {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean; message: string }, Error, { id: number }>({
        mutationFn: ({ id }) => deactivateModelVersion(id),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Modelo apagado correctamente.");
                queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.models });
                queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.active });
            } else {
                toast.error(data.message || "Error al apagar el modelo.");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Error al apagar la versión del modelo.");
        },
    });
}

/** Hook to soft-delete a model version */
export function useDeleteModel() {
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean; message: string }, Error, { id: number }>({
        mutationFn: ({ id }) => deleteModelVersion(id),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Modelo eliminado correctamente.");
                queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.models });
                queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.active });
            } else {
                toast.error(data.message || "Error al eliminar el modelo.");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Error al eliminar la versión del modelo.");
        },
    });
}

/** Hook to activate a model version (runs Pointer Swap) */
export function useActivateModel() {
    const queryClient = useQueryClient();

    return useMutation<ActivateModelVersionResponse, Error, { id: number }>({
        mutationFn: ({ id }) => activateModelVersion(id),
        onSuccess: (data) => {
            if (data.success) {
                toast.success(data.message || "Modelo activado y recargado mediante Pointer Swap con cero caídas de servicio.");
                queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.models });
                queryClient.invalidateQueries({ queryKey: AI_ADMIN_KEYS.active });
            } else {
                toast.error(data.message || "Error en la activación del modelo.");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Error al activar la versión del modelo.");
        },
    });
}
