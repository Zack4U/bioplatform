/**
 * ResultsDrawer — Bottom sheet showing CNN classification results.
 *
 * Matches the reference design:
 * - Circular confidence indicator at top
 * - Species name + scientific name
 * - Origin + status badges
 * - Top 5 predictions list with confidence bars
 * - "Ver Ficha Completa" + "Guardar" actions
 * - "Volver a Tomar" footer
 */

import { Button } from "@/components/ui/button";
import {
    BottomSheet,
    BottomSheetBody,
    BottomSheetFooter,
} from "@/components/ui/bottom-sheet";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { THEME } from "@/lib/theme";
import type { ClassifyImageResponse } from "@/types";
import {
    ExternalLink,
    Leaf,
    MapPin,
    RotateCcw,
    Save,
    Shield,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { ScrollView, View } from "react-native";

interface ResultsDrawerProps {
    open: boolean;
    onClose: () => void;
    result: ClassifyImageResponse | null;
    onRetake: () => void;
    onViewDetails: () => void;
}

export function ResultsDrawer({
    open,
    onClose,
    result,
    onRetake,
    onViewDetails,
}: ResultsDrawerProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    if (!result) return null;

    const confidence = result.topPrediction.confidence * 100;

    return (
        <BottomSheet open={open} onClose={onClose} snapPoint={0.75}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <BottomSheetBody>
                    {/* ─── Circular Confidence Indicator ──────────── */}
                    <View className="items-center pt-2 pb-4">
                        <View
                            className="w-28 h-28 rounded-full items-center justify-center mb-1"
                            style={{
                                borderWidth: 5,
                                borderColor:
                                    confidence >= 80
                                        ? theme.success
                                        : confidence >= 50
                                          ? theme.warning
                                          : theme.destructive,
                            }}
                        >
                            <Text className="text-3xl font-bold text-foreground">
                                {confidence.toFixed(0)}%
                            </Text>
                            <Text className="text-[9px] text-muted-foreground uppercase tracking-widest">
                                Precisión
                            </Text>
                        </View>
                    </View>

                    {/* ─── Species Info ────────────────────────────── */}
                    <View className="items-center mb-4">
                        <Text className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">
                            Especie Identificada
                        </Text>
                        <Text className="text-xl font-bold text-foreground text-center">
                            {result.topPrediction.commonName ??
                                result.topPrediction.scientificName}
                        </Text>
                        <Text className="text-sm text-muted-foreground italic text-center">
                            {result.topPrediction.scientificName}
                        </Text>
                    </View>

                    {/* ─── Badges Row ──────────────────────────────── */}
                    <View className="flex-row items-center justify-center gap-3 mb-5">
                        <View className="flex-row items-center gap-1.5 bg-card border border-border px-3 py-2 rounded-xl">
                            <MapPin
                                size={14}
                                color={theme.primary}
                                strokeWidth={1.5}
                            />
                            <Text className="text-xs text-foreground font-medium">
                                Caldas, CO
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-1.5 bg-card border border-border px-3 py-2 rounded-xl">
                            <Shield
                                size={14}
                                color={theme.primary}
                                strokeWidth={1.5}
                            />
                            <Text className="text-xs text-foreground font-medium">
                                Endémica
                            </Text>
                        </View>
                    </View>

                    {/* ─── Top 5 Predictions ───────────────────────── */}
                    <Text className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        Top 5 Predicciones
                    </Text>
                    <View className="bg-card border border-border rounded-2xl p-3 mb-4">
                        {result.predictions.slice(0, 5).map((pred, i) => (
                            <View
                                key={`pred-${i}`}
                                className={`flex-row items-center gap-3 py-2.5 ${
                                    i < Math.min(result.predictions.length, 5) - 1
                                        ? "border-b border-border"
                                        : ""
                                }`}
                            >
                                <View
                                    className={`w-6 h-6 rounded-lg items-center justify-center ${
                                        i === 0 ? "bg-primary/15" : "bg-muted"
                                    }`}
                                >
                                    <Text
                                        className={`text-[10px] font-bold ${
                                            i === 0
                                                ? "text-primary"
                                                : "text-muted-foreground"
                                        }`}
                                    >
                                        {i + 1}
                                    </Text>
                                </View>
                                <Text
                                    className={`flex-1 text-sm ${
                                        i === 0
                                            ? "text-foreground font-semibold"
                                            : "text-foreground"
                                    }`}
                                    numberOfLines={1}
                                >
                                    {pred.class}
                                </Text>
                                <View className="w-14">
                                    <Progress
                                        value={pred.probability * 100}
                                        className="h-1.5"
                                    />
                                </View>
                                <Text className="text-xs text-muted-foreground w-11 text-right font-medium">
                                    {(pred.probability * 100).toFixed(1)}%
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* ─── Processing time ─────────────────────────── */}
                    <View className="items-center mb-2">
                        <Text className="text-[10px] text-muted-foreground">
                            ⚡ Procesado en {result.processingTimeMs}ms
                        </Text>
                    </View>
                </BottomSheetBody>

                {/* ─── Actions ─────────────────────────────────── */}
                <BottomSheetFooter>
                    <Button
                        className="rounded-2xl h-14 mb-3"
                        onPress={onViewDetails}
                    >
                        <ExternalLink
                            size={18}
                            color={theme.primaryForeground}
                            strokeWidth={1.8}
                        />
                        <Text className="font-bold text-primary-foreground ml-2 text-base">
                            Ver Ficha Completa →
                        </Text>
                    </Button>

                    <Button
                        variant="ghost"
                        className="rounded-2xl h-12 mb-2"
                        onPress={() => {}}
                    >
                        <Save
                            size={16}
                            color={theme.mutedForeground}
                            strokeWidth={1.5}
                        />
                        <Text className="text-muted-foreground ml-2">
                            Guardar para revisión experta
                        </Text>
                    </Button>

                    <Button
                        variant="outline"
                        className="rounded-2xl h-12"
                        onPress={onRetake}
                    >
                        <RotateCcw
                            size={16}
                            color={theme.foreground}
                            strokeWidth={1.8}
                        />
                        <Text className="font-semibold ml-2">
                            Volver a Tomar
                        </Text>
                    </Button>
                </BottomSheetFooter>
            </ScrollView>
        </BottomSheet>
    );
}
