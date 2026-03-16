/**
 * Camera / Species Identification Screen — Full-Screen Redesign.
 *
 * Composes subcomponents:
 * - CameraViewfinder: full-screen viewfinder with corner guides
 * - CameraActions: bottom action bar (Gallery, Capture, History)
 * - ClassificationLoader: full-screen overlay during CNN processing
 * - ResultsDrawer: BottomSheet with Top 5 predictions
 * - HistoryDrawer: BottomSheet with recent identifications
 *
 * The CNN model is operational — connects to /vision/classify with mock fallback.
 */

import { CameraActions } from "@/components/camera/CameraActions";
import { CameraViewfinder } from "@/components/camera/CameraViewfinder";
import { ClassificationLoader } from "@/components/camera/ClassificationLoader";
import { HistoryDrawer } from "@/components/camera/HistoryDrawer";
import { ResultsDrawer } from "@/components/camera/ResultsDrawer";
import { useClassifyImage } from "@/hooks/useClassification";
import type { ClassifyImageResponse } from "@/types";
import React, { useState } from "react";
import { View } from "react-native";

export default function CameraScreen() {
    const { mutateAsync: classify, isPending } = useClassifyImage();

    const [result, setResult] = useState<ClassifyImageResponse | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const handleCapture = async () => {
        try {
            const response = await classify({
                imageUri: "file:///mock-capture.jpg",
                fileName: "capture.jpg",
            });
            setResult(response);
            setShowResults(true);
        } catch {
            // Error handled by React Query
        }
    };

    const handlePickImage = async () => {
        // Future: expo-image-picker. For now, simulates capture.
        handleCapture();
    };

    const handleRetake = () => {
        setShowResults(false);
        setResult(null);
    };

    return (
        <View className="flex-1 bg-black">
            {/* Full-Screen Viewfinder */}
            <CameraViewfinder />

            {/* Loading Overlay */}
            {isPending && <ClassificationLoader />}

            {/* Bottom Action Bar */}
            <CameraActions
                onCapture={handleCapture}
                onPickImage={handlePickImage}
                onHistory={() => setShowHistory(true)}
                disabled={isPending}
            />

            {/* Results Drawer */}
            <ResultsDrawer
                open={showResults}
                onClose={() => setShowResults(false)}
                result={result}
                onRetake={handleRetake}
                onViewDetails={() => {
                    // Future: navigate to species detail
                    setShowResults(false);
                }}
            />

            {/* History Drawer */}
            <HistoryDrawer
                open={showHistory}
                onClose={() => setShowHistory(false)}
            />
        </View>
    );
}
