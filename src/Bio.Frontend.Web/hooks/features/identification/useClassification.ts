/**
 * React Query hooks for CNN species classification.
 *
 * - useClassifyImage() — mutation to classify an uploaded image
 * - useModelInfo()     — query to fetch CNN model metadata
 * - useHealthCheck()   — query to check CNN + DB status (polls every 30s)
 * - useModelMetrics()  — query to fetch evaluation metrics
 *
 * Connects to the AI FastAPI backend via classification-service.
 *
 * @module hooks/features/identification/useClassification
 */

import {
    checkHealth,
    classifyImage,
    getModelInfo,
    getModelMetrics,
} from "@/services/classification-service";
import type {
    ClassificationResponse,
    HealthResponse,
    ModelInfoResponse,
    ModelMetricsResponse,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Query keys ───────────────────────────────────────────────────────────────

export const CLASSIFICATION_KEYS = {
    all: ["classification"] as const,
    modelInfo: ["classification", "model-info"] as const,
    health: ["classification", "health"] as const,
    metrics: ["classification", "metrics"] as const,
};

// ── Types ────────────────────────────────────────────────────────────────────

interface ClassifyParams {
    /** File object from input or drag-and-drop */
    file: File;
    /** Number of top predictions (1-20, default 5) */
    topK?: number;
}

// ── useClassifyImage ─────────────────────────────────────────────────────────

/**
 * Mutation hook to classify a species image via the CNN model.
 *
 * Usage:
 * ```ts
 * const { mutateAsync: classify, isPending } = useClassifyImage();
 * const result = await classify({ file: selectedFile });
 * ```
 */
export function useClassifyImage() {
    const queryClient = useQueryClient();

    return useMutation<ClassificationResponse, Error, ClassifyParams>({
        mutationFn: (params) => classifyImage(params.file, params.topK),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["identifications"] });
        },
    });
}

// ── useModelInfo ─────────────────────────────────────────────────────────────

/**
 * Query hook to fetch CNN model metadata (architecture, classes, device, etc.).
 */
export function useModelInfo() {
    return useQuery<ModelInfoResponse>({
        queryKey: CLASSIFICATION_KEYS.modelInfo,
        queryFn: getModelInfo,
        staleTime: 5 * 60 * 1000, // 5 min — model info rarely changes
    });
}

// ── useHealthCheck ───────────────────────────────────────────────────────────

/**
 * Query hook to check the AI service health (CNN model + DB connectivity).
 * Refetches every 30 seconds.
 */
export function useHealthCheck() {
    return useQuery<HealthResponse>({
        queryKey: CLASSIFICATION_KEYS.health,
        queryFn: checkHealth,
        staleTime: 30_000,
        refetchInterval: 30_000,
        retry: 1,
        retryDelay: 5_000,
    });
}

// ── useModelMetrics ──────────────────────────────────────────────────────────

/**
 * Query hook to fetch CNN model evaluation metrics (accuracy, F1, per-class).
 */
export function useModelMetrics() {
    return useQuery<ModelMetricsResponse>({
        queryKey: CLASSIFICATION_KEYS.metrics,
        queryFn: getModelMetrics,
        staleTime: 10 * 60 * 1000, // 10 min — eval metrics rarely change
    });
}
