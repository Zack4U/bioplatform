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
    getRecentTrainingJobs,
    startFineTuning,
    uploadManualModel,
    validateModel,
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
};

// ── Queries ──────────────────────────────────────────────────────────────────

/** Hook to fetch GPU/VRAM hardware availability and training capabilities */
export function useAiHardwareStatus() {
    return useQuery<AiHardwareStatus>({
        queryKey: AI_ADMIN_KEYS.hardware,
        queryFn: getAiHardwareStatus,
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 30 * 1000, // Poll every 30 seconds to update GPU status in real time
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
        onSuccess: (data) => {
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
        onSuccess: (data) => {
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
