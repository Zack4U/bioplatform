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
import { useIsFocused } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter, type Href } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";

export default function CameraScreen() {
    const router = useRouter();
    const isFocused = useIsFocused();
    const cameraRef = useRef<CameraView>(null);
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const hasCameraPermission = !!cameraPermission?.granted;

    const { mutateAsync: classify, isPending } = useClassifyImage();
    const { data: health, isLoading: isHealthChecking } = useHealthCheck();

    const isModelActive = health?.modelLoaded ?? false;
    const isBusy = isPending;

    const [result, setResult] = useState<ClassificationResponse | null>(null);
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (!cameraPermission?.granted) {
            void requestCameraPermission();
        }
    }, [cameraPermission?.granted, requestCameraPermission]);

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

    /** Classify a local image URI and show results. */
    const classifyImageUri = async (imageUri: string, fileName: string) => {
        try {
            setCapturedUri(imageUri);
            const response = await classify({
                imageUri,
                fileName,
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

        if (!hasCameraPermission) {
            const granted = await requestCameraPermission();
            if (!granted) {
                notificationService.warning(
                    "Se necesita acceso a la cámara para identificar especies.",
                );
                return;
            }
        }

        if (!cameraRef.current) {
            notificationService.warning(
                "No se pudo inicializar la cámara. Intenta nuevamente.",
            );
            return;
        }

        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.8,
                skipProcessing: true,
            });

            if (!photo?.uri) {
                notificationService.error(
                    "No se obtuvo una imagen de la cámara. Intenta de nuevo.",
                );
                return;
            }

            const photoUri =
                Platform.OS === "android"
                    ? photo.uri
                    : photo.uri.startsWith("file://")
                      ? photo.uri
                      : `file://${photo.uri}`;

            await classifyImageUri(photoUri, "capture.jpg");
        } catch {
            notificationService.error(
                "No se pudo tomar la foto. Verifica permisos e intenta de nuevo.",
            );
        }
    };

    /** Pick image from gallery and classify. */
    const handlePickImage = async () => {
        if (!guardModelActive()) return;

        const mediaPermission =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!mediaPermission.granted) {
            notificationService.warning(
                "Se necesita acceso a tus fotos para seleccionar una imagen.",
            );
            return;
        }

        const photo = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
        });
        if (photo.canceled || !photo.assets?.[0]) return;

        const asset = photo.assets[0];
        await classifyImageUri(asset.uri, asset.fileName ?? "gallery.jpg");
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
                cameraRef={cameraRef}
                hasCameraPermission={hasCameraPermission}
                isActive={isFocused && !isBusy}
                onRequestCameraPermission={() => {
                    void requestCameraPermission();
                }}
            />

            {/* Loading Overlay */}
            {isBusy && <ClassificationLoader />}

            {/* Bottom Action Bar */}
            <View className="absolute left-0 right-0 bottom-0">
                <CameraActions
                    onCapture={handleCapture}
                    onPickImage={handlePickImage}
                    onHistory={() => setShowHistory(true)}
                    disabled={isBusy}
                />
            </View>

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
