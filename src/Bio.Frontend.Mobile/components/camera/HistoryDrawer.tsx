/**
 * HistoryDrawer — Bottom sheet showing recent identification history.
 */

import {
    BottomSheet,
    BottomSheetBody,
    BottomSheetHeader,
} from "@/components/ui/bottom-sheet";
import { Text } from "@/components/ui/text";
import { MOCK_RECENT_IDENTIFICATIONS } from "@/lib/mock-data";
import { THEME } from "@/lib/theme";
import {
    Camera as CameraIcon,
    ChevronRight,
    Clock,
    History,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";

interface HistoryDrawerProps {
    open: boolean;
    onClose: () => void;
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    return (
        <BottomSheet open={open} onClose={onClose} snapPoint={0.6}>
            <BottomSheetHeader>
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-info/15 items-center justify-center">
                        <History
                            size={20}
                            color={theme.info}
                            strokeWidth={1.5}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-foreground">
                            Historial de Capturas
                        </Text>
                        <Text className="text-xs text-muted-foreground">
                            {MOCK_RECENT_IDENTIFICATIONS.length} identificaciones
                            recientes
                        </Text>
                    </View>
                </View>
            </BottomSheetHeader>

            <BottomSheetBody>
                <ScrollView showsVerticalScrollIndicator={false}>
                    {MOCK_RECENT_IDENTIFICATIONS.map((item) => (
                        <Pressable
                            key={item.id}
                            className="active:opacity-70 mb-2"
                        >
                            <View className="flex-row items-center p-3 bg-card border border-border rounded-2xl gap-3">
                                <View className="w-12 h-12 rounded-xl bg-muted items-center justify-center">
                                    <CameraIcon
                                        size={18}
                                        color={theme.mutedForeground}
                                        strokeWidth={1.5}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-foreground">
                                        {item.speciesName}
                                    </Text>
                                    <View className="flex-row items-center gap-2 mt-0.5">
                                        <Text className="text-xs text-muted-foreground">
                                            {item.commonName}
                                        </Text>
                                        <Text className="text-[10px] font-bold text-primary">
                                            {(item.confidence * 100).toFixed(0)}%
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-1 mt-1">
                                        <Clock
                                            size={10}
                                            color={theme.mutedForeground}
                                            strokeWidth={1.5}
                                        />
                                        <Text className="text-[10px] text-muted-foreground">
                                            {new Date(
                                                item.timestamp,
                                            ).toLocaleDateString("es-CO", {
                                                day: "2-digit",
                                                month: "short",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </Text>
                                    </View>
                                </View>
                                <ChevronRight
                                    size={16}
                                    color={theme.mutedForeground}
                                />
                            </View>
                        </Pressable>
                    ))}

                    {MOCK_RECENT_IDENTIFICATIONS.length === 0 && (
                        <View className="items-center justify-center py-12">
                            <View className="w-14 h-14 rounded-2xl bg-muted items-center justify-center mb-3">
                                <CameraIcon
                                    size={24}
                                    color={theme.mutedForeground}
                                    strokeWidth={1.2}
                                />
                            </View>
                            <Text className="text-sm font-medium text-foreground">
                                Sin capturas recientes
                            </Text>
                            <Text className="text-xs text-muted-foreground mt-1">
                                Toma tu primera foto para identificar
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </BottomSheetBody>
        </BottomSheet>
    );
}
