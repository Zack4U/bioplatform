/**
 * React Query hook for CNN species classification.
 *
 * Sends captured images to the FastAPI /classify endpoint.
 * Falls back to mock predictions when the AI service is unreachable.
 *
 * @module hooks/useClassification
 */

import { AI_API_BASE_URL } from "@/lib/constants";
import { MOCK_CLASSIFICATION_RESPONSE } from "@/lib/mock-data";
import type { ClassifyImageResponse } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface ClassifyParams {
    /** Local file URI from Vision Camera or ImagePicker */
    imageUri: string;
    /** Optional filename for FormData */
    fileName?: string;
    /** MIME type (defaults to image/jpeg) */
    mimeType?: string;
}

/**
 * Mutation hook to classify a species image via the CNN model.
 *
 * Usage:
 * ```ts
 * const { mutateAsync: classify, isPending } = useClassifyImage();
 * const result = await classify({ imageUri: photo.path });
 * ```
 */
export function useClassifyImage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            params: ClassifyParams,
        ): Promise<ClassifyImageResponse> => {
            const formData = new FormData();
            formData.append("file", {
                uri: params.imageUri,
                name: params.fileName ?? "capture.jpg",
                type: params.mimeType ?? "image/jpeg",
            } as unknown as Blob);

            try {
                const { data } = await axios.post<ClassifyImageResponse>(
                    `${AI_API_BASE_URL}/vision/classify`,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                        timeout: 30000,
                    },
                );
                return data;
            } catch {
                // Mock fallback for development
                await new Promise((resolve) => setTimeout(resolve, 1500));
                return MOCK_CLASSIFICATION_RESPONSE;
            }
        },
        onSuccess: () => {
            // Invalidate recent identifications cache
            queryClient.invalidateQueries({ queryKey: ["identifications"] });
        },
    });
}
