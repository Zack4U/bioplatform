/**
 * Camera / Species Identification Screen.
 *
 * Composes subcomponents:
 * - CameraViewfinder: full-screen viewfinder with corner guides + CNN status
 * - CameraActions: bottom action bar (Gallery, Capture, History)
 * - ClassificationLoader: full-screen overlay during CNN processing
 * - ResultsDrawer: BottomSheet with predictions
 * - HistoryDrawer: BottomSheet with recent identifications
 *
 * Real image capture via expo-image-picker, classified by AI backend.
 * Health check blocks capture/gallery if CNN model is not loaded.
 */

import { CameraActions } from "@/components/camera/CameraActions";
import { CameraViewfinder } from "@/components/camera/CameraViewfinder";
import { ClassificationLoader } from "@/components/camera/ClassificationLoader";
import { HistoryDrawer } from "@/components/camera/HistoryDrawer";
import { ResultsDrawer } from "@/components/camera/ResultsDrawer";
import { useClassifyImage, useHealthCheck } from "@/hooks/useClassification";
import { notificationService } from "@/lib/notifications";
import type { ClassificationResponse } from "@/types";
import * as ImagePicker from "expo-image-picker";
import { useRouter, type Href } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";

export default function CameraScreen() {
    const router = useRouter();
    const { mutateAsync: classify, isPending } = useClassifyImage();
    const { data: health, isLoading: isHealthChecking } = useHealthCheck();

    const isModelActive = health?.modelLoaded ?? false;
    const isBusy = isPending;

    const [result, setResult] = useState<ClassificationResponse | null>(null);
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    /** Guard — prevent capture/gallery when CNN is down. */
    const guardModelActive = (): boolean => {
        if (!isModelActive) {
            notificationService.warning(
                "El modelo de IA no está disponible. Intenta más tarde.",
            );
            return false;
        }
        return true;
    };

    /** Classify an image asset and show results. */
    const classifyAsset = async (asset: ImagePicker.ImagePickerAsset) => {
        try {
            setCapturedUri(asset.uri);
            const response = await classify({
                imageUri: asset.uri,
                fileName: asset.fileName ?? "capture.jpg",
            });
            setResult(response);
            setShowResults(true);
        } catch {
            // Error already handled by AI client interceptor (Sonner toast).
        }
    };

    /** Launch camera, classify the captured image. */
    const handleCapture = async () => {
        if (!guardModelActive()) return;

        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            notificationService.warning(
                "Se necesita acceso a la cámara para identificar especies.",
            );
            return;
        }

        const photo = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
        });
        if (photo.canceled || !photo.assets?.[0]) return;

        await classifyAsset(photo.assets[0]);
    };

    /** Pick image from gallery and classify. */
    const handlePickImage = async () => {
        if (!guardModelActive()) return;

        const photo = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
        });
        if (photo.canceled || !photo.assets?.[0]) return;

        await classifyAsset(photo.assets[0]);
    };

    const handleRetake = () => {
        setShowResults(false);
        setResult(null);
        setCapturedUri(null);
    };

    /** Navigate to species detail screen using the top prediction's speciesId. */
    const handleViewDetails = () => {
        if (!result?.predictions?.length) return;
        const topPred = result.predictions[0];
        const speciesId = topPred.speciesData?.speciesId;
        if (speciesId) {
            setShowResults(false);
            router.push(`/species/${speciesId}` as Href);
        }
    };

    return (
        <View className="flex-1 bg-black">
            {/* Full-Screen Viewfinder */}
            <CameraViewfinder
                isModelActive={isModelActive}
                isChecking={isHealthChecking}
            />

            {/* Loading Overlay */}
            {isBusy && <ClassificationLoader />}

            {/* Bottom Action Bar */}
            <CameraActions
                onCapture={handleCapture}
                onPickImage={handlePickImage}
                onHistory={() => setShowHistory(true)}
                disabled={isBusy}
            />

            {/* Results Drawer */}
            <ResultsDrawer
                open={showResults}
                onClose={() => setShowResults(false)}
                result={result}
                imageUri={capturedUri}
                onRetake={handleRetake}
                onViewDetails={handleViewDetails}
            />

            {/* History Drawer */}
            <HistoryDrawer
                open={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </View>
    );
}

