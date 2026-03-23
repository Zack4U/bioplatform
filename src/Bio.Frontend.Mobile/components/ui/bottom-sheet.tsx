/**
 * BottomSheet / Drawer — BioCommerce Caldas Mobile.
 *
 * A custom slide-up bottom sheet using react-native-reanimated + gesture-handler.
 * Used for results, history, and any content that slides from the bottom.
 *
 * Props:
 * - open: boolean — controls visibility
 * - onClose: () => void — called on backdrop tap or swipe-down
 * - snapPoint?: number — height as percentage of screen (default 60%)
 * - children: ReactNode — drawer content
 */

import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    View,
    type ViewProps,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
    open: boolean;
    onClose: () => void;
    /** Height as fraction of screen (0-1). Default 0.65 */
    snapPoint?: number;
    children: React.ReactNode;
}

export function BottomSheet({
    open,
    onClose,
    snapPoint = 0.65,
    children,
}: BottomSheetProps) {
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const backdrop = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (open) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    damping: 25,
                    stiffness: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(backdrop, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(backdrop, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [open, translateY, backdrop]);

    const handleClose = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(backdrop, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onClose());
    };

    if (!open) return null;

    const sheetHeight = SCREEN_HEIGHT * snapPoint;

    return (
        <Modal
            visible={open}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={handleClose}
        >
            {/* Backdrop */}
            <Animated.View
                style={{
                    flex: 1,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    opacity: backdrop,
                }}
            >
                <Pressable
                    style={{ flex: 1 }}
                    onPress={handleClose}
                />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: sheetHeight,
                    transform: [{ translateY }],
                }}
                className="bg-background rounded-t-3xl shadow-2xl"
            >
                {/* Drag handle */}
                <View className="items-center pt-3 pb-2">
                    <View className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                    {children}
                </View>
            </Animated.View>
        </Modal>
    );
}

/* ─── Subcomponents for composition ──────────────────────────────── */

export function BottomSheetHeader({ className, ...props }: ViewProps) {
    return (
        <View
            className={cn("px-5 pb-3", className)}
            {...props}
        />
    );
}

export function BottomSheetBody({ className, ...props }: ViewProps) {
    return (
        <View
            className={cn("flex-1 px-5", className)}
            {...props}
        />
    );
}

export function BottomSheetFooter({ className, ...props }: ViewProps) {
    return (
        <View
            className={cn("px-5 pb-8 pt-3", className)}
            {...props}
        />
    );
}
