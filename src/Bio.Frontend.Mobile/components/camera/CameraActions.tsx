/**
 * CameraActions — Bottom action bar with 3 buttons: Gallery, Capture, History.
 */

import { THEME } from "@/lib/theme";
import { Camera as CameraIcon, History, ImagePlus } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

interface CameraActionsProps {
    onCapture: () => void;
    onPickImage: () => void;
    onHistory: () => void;
    disabled?: boolean;
}

export function CameraActions({
    onCapture,
    onPickImage,
    onHistory,
    disabled = false,
}: CameraActionsProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <View className="bg-black pb-10 pt-6 px-8">
            <View className="flex-row items-center justify-between">
                {/* Gallery */}
                <Pressable
                    onPress={onPickImage}
                    disabled={disabled}
                    className="items-center active:opacity-70"
                >
                    <View className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 items-center justify-center mb-1.5">
                        <ImagePlus
                            size={24}
                            color="rgba(255,255,255,0.8)"
                            strokeWidth={1.5}
                        />
                    </View>
                    <Text className="text-[10px] text-white/60 font-medium">
                        Galería
                    </Text>
                </Pressable>

                {/* Main Capture */}
                <Pressable
                    onPress={onCapture}
                    disabled={disabled}
                    className="active:opacity-80 -mt-8"
                >
                    <View
                        className="w-24 h-24 rounded-full bg-white/10 items-center justify-center"
                        style={{
                            elevation: 12,
                            shadowColor: theme.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.4,
                            shadowRadius: 12,
                        }}
                    >
                        <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
                            <View className="w-16 h-16 rounded-full border-[3px] border-white/30 items-center justify-center">
                                <CameraIcon size={30} color="white" strokeWidth={2} />
                            </View>
                        </View>
                    </View>
                </Pressable>

                {/* History */}
                <Pressable
                    onPress={onHistory}
                    disabled={disabled}
                    className="items-center active:opacity-70"
                >
                    <View className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 items-center justify-center mb-1.5">
                        <History
                            size={24}
                            color="rgba(255,255,255,0.8)"
                            strokeWidth={1.5}
                        />
                    </View>
                    <Text className="text-[10px] text-white/60 font-medium">
                        Historial
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
