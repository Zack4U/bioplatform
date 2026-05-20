/**
 * AI Admin Service — connects Next.js frontend to .NET AI administration endpoints
 * and FastAPI AI microservice endpoints for model uploading and pre-activation validation.
 *
 * @module services/ai-admin-service
 */

import apiClient from "@/lib/axios";
import { aiClient } from "@/services/classification-service";
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

// ─── .NET Backend Admin Endpoints (via apiClient) ──────────────────────────

/**
 * GET /api/v1/ai/hardware
 * Fetch GPU/VRAM hardware availability and training authorization.
 */
export async function getAiHardwareStatus(): Promise<AiHardwareStatus> {
    const { data } = await apiClient.get<AiHardwareStatus>("v1/ai/hardware");
    return data;
}

/**
 * GET /api/v1/ai/models
 * List all versioned models in the database.
 */
export async function getAiModelVersions(): Promise<CnnModelVersion[]> {
    const { data } = await apiClient.get<CnnModelVersion[]>("v1/ai/models");
    return data;
}

/**
 * GET /api/v1/ai/models/active
 * Fetch metrics summary of the currently active model.
 */
export async function getActiveModelMetrics(): Promise<ActiveModelMetrics> {
    const { data } = await apiClient.get<ActiveModelMetrics>("v1/ai/models/active");
    return data;
}

/**
 * POST /api/v1/ai/models/{id}/activate
 * Activate a model version. Triggers hot-reload on the AI service.
 */
export async function activateModelVersion(id: number): Promise<ActivateModelVersionResponse> {
    const { data } = await apiClient.post<ActivateModelVersionResponse>(`v1/ai/models/${id}/activate`);
    return data;
}

/**
 * POST /api/v1/ai/models/{id}/deactivate
 * Deactivate a model version. Triggers suspension reload on the AI service.
 */
export async function deactivateModelVersion(id: number): Promise<{ success: boolean; message: string }> {
    const { data } = await apiClient.post<{ success: boolean; message: string }>(`v1/ai/models/${id}/deactivate`);
    return data;
}

/**
 * GET /api/v1/ai/training/jobs
 * Fetch list of recent training jobs (automatic fine-tuning history).
 */
export async function getRecentTrainingJobs(count = 10): Promise<AiTrainingJob[]> {
    const { data } = await apiClient.get<AiTrainingJob[]>("v1/ai/training/jobs", {
        params: { count },
    });
    return data;
}

/**
 * POST /api/v1/ai/training/start
 * Trigger an automatic server-side fine-tuning job on the AI microservice.
 */
export async function startFineTuning(params: {
    epochs?: number;
    learningRate?: number;
    replayBufferRatio?: number;
}): Promise<StartFineTuningResponse> {
    const { data } = await apiClient.post<StartFineTuningResponse>("v1/ai/training/start", {
        epochs: params.epochs,
        learningRate: params.learningRate,
        replayBufferRatio: params.replayBufferRatio,
    });
    return data;
}

// ─── FastAPI Backend Registry Endpoints (via aiClient) ─────────────────────────

/**
 * POST /api/v1/model/upload
 * Multi-part upload of locally trained model weights, configuration, and evaluation metrics.
 * Runs DVC push asynchronously.
 */
export async function uploadManualModel(
    weightsFile: File,
    configFile: File,
    metricsFile: File,
    notes?: string,
): Promise<ModelUploadResponse> {
    const formData = new FormData();
    formData.append("weights_file", weightsFile);
    formData.append("config_file", configFile);
    formData.append("metrics_file", metricsFile);
    if (notes) {
        formData.append("notes", notes);
    }

    const { data } = await aiClient.post<ModelUploadResponse>("/model/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000, // Large file uploads might require more time
    });
    return data;
}

/**
 * POST /api/v1/model/validate
 * Run pre-activation validation check on candidate model.
 */
export async function validateModel(version: string): Promise<ModelValidateResponse> {
    const { data } = await aiClient.post<ModelValidateResponse>("/model/validate", null, {
        params: { version },
    });
    return data;
}
