/**
 * CameraViewfinder — Full-screen camera viewfinder with corner guides.
 * Renders the dark background, header overlay, and animated crosshair.
 * Displays real-time CNN model status (active/inactive/checking).
 */

import { Text } from "@/components/ui/text";
import { CameraView } from "expo-camera";
import { Focus } from "lucide-react-native";
import React, { useEffect, useRef, type RefObject } from "react";
import { ActivityIndicator, Animated, Pressable, View } from "react-native";

interface CameraViewfinderProps {
    /** Whether the CNN model is loaded and ready for inference. */
    isModelActive?: boolean;
    /** Whether the health check is still loading. */
    isChecking?: boolean;
    /** Vision Camera ref used by parent screen to capture photos. */
    cameraRef: RefObject<CameraView | null>;
    /** Current camera permission status. */
    hasCameraPermission: boolean;
    /** Whether camera stream should be active (screen focused, etc). */
    isActive: boolean;
    /** Trigger camera permission request from UI fallback. */
    onRequestCameraPermission: () => void;
}

export function CameraViewfinder({
    isModelActive = false,
    isChecking = false,
    cameraRef,
    hasCameraPermission,
    isActive,
    onRequestCameraPermission,
}: CameraViewfinderProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.15,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ]),
        );
        pulse.start();
        return () => pulse.stop();
    }, [pulseAnim]);

    // CNN status badge configuration
    const badgeLabel = isChecking
        ? "Verificando…"
        : isModelActive
          ? "CNN Activa"
          : "CNN Inactiva";

    const badgeDotColor = isChecking
        ? undefined
        : isModelActive
          ? "bg-green-400"
          : "bg-red-400";

    return (
        <View className="flex-1 relative">
            {hasCameraPermission ? (
                <CameraView
                    ref={cameraRef}
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                    }}
                    facing="back"
                    active={isActive}
                />
            ) : (
                <View className="absolute inset-0 items-center justify-center px-8">
                    <View className="bg-black/55 rounded-2xl px-5 py-4 border border-white/15">
                        <Text className="text-center text-white text-sm font-semibold">
                            Debes permitir acceso a la cámara
                        </Text>
                        <Pressable
                            onPress={onRequestCameraPermission}
                            className="mt-3 self-center rounded-xl bg-primary px-4 py-2 active:opacity-80"
                        >
                            <Text className="text-primary-foreground text-xs font-semibold">
                                Conceder permiso
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}

            {/* Header overlay */}
            <View className="absolute top-0 left-0 right-0 z-10 pt-14 pb-4 px-5">
                <View className="flex-row items-center justify-between">
                    <View>
                        <Text className="text-xl font-bold text-white">
                            Identificar
                        </Text>
                        <Text className="text-xs text-white/60">
                            Apunta hacia la especie
                        </Text>
                    </View>
                    <View className="bg-white/10 rounded-full px-3 py-1.5 flex-row items-center gap-1.5">
                        {isChecking ? (
                            <ActivityIndicator size={8} color="white" />
                        ) : (
                            <View
                                className={`w-1.5 h-1.5 rounded-full ${badgeDotColor}`}
                            />
                        )}
                        <Text className="text-[10px] text-white/80 font-medium">
                            {badgeLabel}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Viewfinder center */}
            <View className="flex-1 items-center justify-center">
                <View className="w-72 h-72 relative">
                    {/* Corner guides */}
                    <View className="absolute top-0 left-0 w-12 h-12 border-l-[3px] border-t-[3px] border-white/50 rounded-tl-2xl" />
                    <View className="absolute top-0 right-0 w-12 h-12 border-r-[3px] border-t-[3px] border-white/50 rounded-tr-2xl" />
                    <View className="absolute bottom-0 left-0 w-12 h-12 border-l-[3px] border-b-[3px] border-white/50 rounded-bl-2xl" />
                    <View className="absolute bottom-0 right-0 w-12 h-12 border-r-[3px] border-b-[3px] border-white/50 rounded-br-2xl" />

                    {/* Center crosshair */}
                    <View className="flex-1 items-center justify-center">
                        <Animated.View
                            style={{ transform: [{ scale: pulseAnim }] }}
                        >
                            <Focus
                                size={56}
                                color="rgba(255,255,255,0.3)"
                                strokeWidth={0.8}
                            />
                        </Animated.View>
                    </View>
                </View>
            </View>
        </View>
    );
}
