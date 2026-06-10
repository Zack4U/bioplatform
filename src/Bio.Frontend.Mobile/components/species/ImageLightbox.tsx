/**
 * ImageLightbox — full-screen species image viewer.
 *
 * Features:
 * - Horizontal swipe between images (paged FlatList)
 * - Pinch-to-zoom + pan on each image (gesture-handler + reanimated)
 * - Double-tap to toggle zoom
 * - Expert-validation badge + image counter
 *
 * Swipe is disabled while an image is zoomed so panning does not fight the pager.
 *
 * @module components/species/ImageLightbox
 */

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { normalizeImageUrl } from "@/lib/image-url";
import type { SpeciesImage } from "@/types";
import { Image as ExpoImage } from "expo-image";
import { ShieldCheck, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    FlatList,
    Modal,
    Pressable,
    View,
    type ViewStyle,
    type ViewToken,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;

interface ImageLightboxProps {
    images: SpeciesImage[];
    initialIndex: number;
    visible: boolean;
    onClose: () => void;
}

interface ZoomablePageProps {
    uri: string | null;
    isActive: boolean;
    onZoomChange: (zoomed: boolean) => void;
}

function ZoomablePage({ uri, isActive, onZoomChange }: ZoomablePageProps) {
    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    // Local mirror of zoom state drives pan.enabled (recreated on change).
    const [zoomed, setZoomed] = useState(false);

    const reset = () => {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
    };

    const applyZoomState = (next: boolean) => {
        setZoomed(next);
        onZoomChange(next);
    };

    // Reset zoom when this page is swiped away.
    useEffect(() => {
        if (!isActive && zoomed) {
            reset();
            applyZoomState(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive]);

    const pinch = Gesture.Pinch()
        .onUpdate((e) => {
            const next = savedScale.value * e.scale;
            scale.value = Math.min(Math.max(next, 1), MAX_ZOOM);
        })
        .onEnd(() => {
            savedScale.value = scale.value;
            if (scale.value <= 1) {
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
                scale.value = withTiming(1);
                savedScale.value = 1;
                runOnJS(applyZoomState)(false);
            } else {
                runOnJS(applyZoomState)(true);
            }
        });

    const pan = Gesture.Pan()
        .enabled(zoomed)
        .onUpdate((e) => {
            translateX.value = savedTranslateX.value + e.translationX;
            translateY.value = savedTranslateY.value + e.translationY;
        })
        .onEnd(() => {
            savedTranslateX.value = translateX.value;
            savedTranslateY.value = translateY.value;
        });

    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (scale.value > 1) {
                translateX.value = withTiming(0);
                translateY.value = withTiming(0);
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
                scale.value = withTiming(1);
                savedScale.value = 1;
                runOnJS(applyZoomState)(false);
            } else {
                scale.value = withTiming(DOUBLE_TAP_ZOOM);
                savedScale.value = DOUBLE_TAP_ZOOM;
                runOnJS(applyZoomState)(true);
            }
        });

    const composed = Gesture.Race(
        doubleTap,
        Gesture.Simultaneous(pinch, pan),
    );

    const animatedStyle = useAnimatedStyle(() => {
        const transform: ViewStyle["transform"] = [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { scale: scale.value },
        ];
        return { transform };
    });

    const normalized = normalizeImageUrl(uri);

    return (
        <View style={{ width: SCREEN_W, height: SCREEN_H }} className="items-center justify-center">
            <GestureDetector gesture={composed}>
                <Animated.View style={animatedStyle}>
                    <ExpoImage
                        source={normalized ? { uri: normalized } : undefined}
                        style={{ width: SCREEN_W, height: SCREEN_H * 0.8 }}
                        contentFit="contain"
                        transition={150}
                        cachePolicy="memory-disk"
                    />
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

export function ImageLightbox({
    images,
    initialIndex,
    visible,
    onClose,
}: ImageLightboxProps) {
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const [scrollEnabled, setScrollEnabled] = useState(true);

    // Sync the starting index whenever the lightbox (re)opens.
    useEffect(() => {
        if (visible) {
            setActiveIndex(initialIndex);
            setScrollEnabled(true);
        }
    }, [visible, initialIndex]);

    const onViewableItemsChanged = React.useRef(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            const first = viewableItems[0];
            if (first?.index != null) {
                setActiveIndex(first.index);
                setScrollEnabled(true);
            }
        },
    ).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 60,
    }).current;

    if (!images.length) return null;

    const current = images[activeIndex];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <GestureHandlerRootView className="flex-1 bg-black">
                {/* Header */}
                <View className="absolute top-0 left-0 right-0 z-10 flex-row items-center justify-between px-4 pt-14 pb-3">
                    <View className="flex-row items-center gap-2">
                        <Text className="text-sm font-semibold text-white">
                            {activeIndex + 1} / {images.length}
                        </Text>
                        {current?.isValidatedByExpert && (
                            <Badge className="bg-emerald-500/20 border-0 px-2 py-0.5 flex-row items-center gap-1">
                                <ShieldCheck size={11} color="#10b981" />
                                <Text className="text-[10px] text-emerald-400 font-medium">
                                    Validada
                                </Text>
                            </Badge>
                        )}
                    </View>
                    <Pressable
                        onPress={onClose}
                        accessibilityLabel="Cerrar galería"
                        className="w-10 h-10 rounded-full bg-white/15 items-center justify-center active:opacity-70"
                    >
                        <X size={20} color="#FFFFFF" strokeWidth={2} />
                    </Pressable>
                </View>

                <FlatList
                    data={images}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    scrollEnabled={scrollEnabled}
                    initialScrollIndex={initialIndex}
                    showsHorizontalScrollIndicator={false}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_W,
                        offset: SCREEN_W * index,
                        index,
                    })}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    renderItem={({ item, index }) => (
                        <ZoomablePage
                            uri={item.imageUrl}
                            isActive={index === activeIndex}
                            onZoomChange={(zoomed) => setScrollEnabled(!zoomed)}
                        />
                    )}
                />

                {/* License footer */}
                {current?.licenseType && (
                    <View className="absolute bottom-0 left-0 right-0 items-center pb-10">
                        <Text className="text-[11px] text-white/60">
                            Licencia: {current.licenseType}
                        </Text>
                    </View>
                )}
            </GestureHandlerRootView>
        </Modal>
    );
}
