/**
 * useIdentificationWizard — orchestrates the 3-step identification flow.
 *
 * Step 1: Upload photo (file input / drag-and-drop)
 * Step 2: Processing  (CNN inference in progress)
 * Step 3: Results     (top-5 predictions + catalog link)
 *
 * Handles file validation, preview URL lifecycle, classification mutation,
 * and persists results to the identification store.
 *
 * @module hooks/features/identification/useIdentificationWizard
 */

import { useClassifyImage } from "@/hooks/features/identification/useClassification";
import {
    ACCEPTED_IMAGE_TYPES,
    MAX_IMAGE_SIZE_MB,
} from "@/lib/constants";
import { useIdentificationStore } from "@/store/identification-store";
import type { ClassificationResponse } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

export type WizardStep = 1 | 2 | 3;

interface WizardState {
    /** Current wizard step */
    step: WizardStep;
    /** Selected file for classification */
    selectedFile: File | null;
    /** Object URL for image preview */
    previewUrl: string | null;
    /** Classification result */
    result: ClassificationResponse | null;
    /** Whether the classification mutation is running */
    isProcessing: boolean;
    /** Error message if classification failed */
    error: string | null;
}

export interface UseIdentificationWizardReturn extends WizardState {
    /** Handle file selection (from input or drag-and-drop) */
    handleFileSelect: (file: File) => void;
    /** Start the classification (transition from step 1 → 2 → 3) */
    handleClassify: () => Promise<void>;
    /** Reset to step 1 for a new identification */
    handleRetake: () => void;
    /** Get the catalog slug for the top prediction */
    getTopPredictionSlug: () => string | null;
    /** Get the species ID for the top prediction */
    getTopPredictionSpeciesId: () => string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useIdentificationWizard(): UseIdentificationWizardReturn {
    const { mutateAsync: classify, isPending } = useClassifyImage();
    const addRecord = useIdentificationStore((s) => s.addRecord);

    const [step, setStep] = useState<WizardStep>(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [result, setResult] = useState<ClassificationResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Track object URLs for cleanup
    const previewUrlRef = useRef<string | null>(null);

    // Clean up object URL on unmount or when it changes
    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    /** Validate and set the selected file */
    const handleFileSelect = useCallback((file: File) => {
        // Validate file type
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
            toast.error(
                `Formato no soportado: ${file.type || "desconocido"}. Usa JPEG, PNG o WebP.`,
            );
            return;
        }

        // Validate file size
        const maxBytes = MAX_IMAGE_SIZE_MB * 1024 * 1024;
        if (file.size > maxBytes) {
            toast.error(
                `La imagen es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximo ${MAX_IMAGE_SIZE_MB} MB.`,
            );
            return;
        }

        // Revoke previous preview URL
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
        }

        // Create preview
        const url = URL.createObjectURL(file);
        previewUrlRef.current = url;

        setSelectedFile(file);
        setPreviewUrl(url);
        setError(null);
        setResult(null);
        setStep(1);
    }, []);

    /** Run classification */
    const handleClassify = useCallback(async () => {
        if (!selectedFile) {
            toast.error("Selecciona una imagen primero.");
            return;
        }

        setStep(2);
        setError(null);

        try {
            const response = await classify({ file: selectedFile });
            setResult(response);
            setStep(3);

            // Save to local history
            if (previewUrl) {
                // Convert to base64 data URL for persistent storage
                const reader = new FileReader();
                reader.onload = () => {
                    const dataUrl = reader.result as string;
                    addRecord({
                        imagePreviewUrl: dataUrl,
                        result: response,
                    });
                };
                reader.readAsDataURL(selectedFile);
            }
        } catch {
            // Error already handled by classification-service interceptor (toast)
            setError("La clasificacion fallo. Intenta con otra imagen.");
            setStep(1);
        }
    }, [selectedFile, classify, previewUrl, addRecord]);

    /** Reset wizard to step 1 */
    const handleRetake = useCallback(() => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }
        setStep(1);
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setError(null);
    }, []);

    /** Get the catalog slug for the top prediction (uses speciesId as fallback) */
    const getTopPredictionSlug = useCallback((): string | null => {
        if (!result?.predictions?.length) return null;
        const topPred = result.predictions[0];
        // The species name could serve as a slug (lowercased, hyphenated)
        return topPred.species.toLowerCase().replace(/\s+/g, "-");
    }, [result]);

    /** Get the species ID for the top prediction */
    const getTopPredictionSpeciesId = useCallback((): string | null => {
        if (!result?.predictions?.length) return null;
        return result.predictions[0].speciesData?.speciesId ?? null;
    }, [result]);

    return {
        step,
        selectedFile,
        previewUrl,
        result,
        isProcessing: isPending,
        error,
        handleFileSelect,
        handleClassify,
        handleRetake,
        getTopPredictionSlug,
        getTopPredictionSpeciesId,
    };
}
