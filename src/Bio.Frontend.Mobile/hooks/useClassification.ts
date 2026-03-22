/**
 * React Query hooks for CNN species classification.
 *
 * - useClassifyImage() — mutation to classify a captured image
 * - useModelInfo()     — query to fetch CNN model metadata
 * - useHealthCheck()   — query to check CNN + DB status
 * - useModelMetrics()  — query to fetch evaluation metrics (accuracy, F1, per-class)
 *
 * No mock fallback — connects directly to the AI FastAPI backend.
 *
 * @module hooks/useClassification
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
    /** Local file URI from Camera or ImagePicker */
    imageUri: string;
    /** Optional filename for FormData */
    fileName?: string;
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
 * const result = await classify({ imageUri: photo.uri });
 * ```
 */
export function useClassifyImage() {
    const queryClient = useQueryClient();

    return useMutation<ClassificationResponse, Error, ClassifyParams>({
        mutationFn: (params) =>
            classifyImage(
                params.imageUri,
                params.fileName,
                params.topK,
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["identifications"] });
        },
    });
}

// ── useModelInfo ─────────────────────────────────────────────────────────────

/**
 * Query hook to fetch CNN model metadata (architecture, classes, device, etc.).
 *
 * Usage:
 * ```ts
 * const { data: modelInfo, isLoading } = useModelInfo();
 * ```
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
 * Refetches every 30 seconds and on screen focus.
 *
 * Usage:
 * ```ts
 * const { data: health, isLoading } = useHealthCheck();
 * const isCnnActive = health?.modelLoaded ?? false;
 * ```
 */
export function useHealthCheck() {
    return useQuery<HealthResponse>({
        queryKey: CLASSIFICATION_KEYS.health,
        queryFn: checkHealth,
        staleTime: 30_000,       // 30s — re-fetch on screen focus after this
        refetchInterval: 30_000, // poll every 30s while screen is active
        retry: 1,                // only 1 retry if server is down
        retryDelay: 5_000,
    });
}

// ── useModelMetrics ──────────────────────────────────────────────────────────

/**
 * Query hook to fetch CNN model evaluation metrics (accuracy, F1, per-class).
 *
 * Usage:
 * ```ts
 * const { data: metrics } = useModelMetrics();
 * const accuracy = metrics?.accuracy;
 * ```
 */
export function useModelMetrics() {
    return useQuery<ModelMetricsResponse>({
        queryKey: CLASSIFICATION_KEYS.metrics,
        queryFn: getModelMetrics,
        staleTime: 10 * 60 * 1000, // 10 min — eval metrics rarely change
    });
}

