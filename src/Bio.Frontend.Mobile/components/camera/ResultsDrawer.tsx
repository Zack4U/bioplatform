/**
 * ResultsDrawer — Bottom sheet showing CNN classification results.
 *
 * Uses the new ClassificationResponse / SpeciesPrediction types
 * from the AI backend. Displays:
 * - Hero section with captured photo as darkened background
 * - Circular confidence indicator (top prediction)
 * - Species name + taxonomy info
 * - Conservation status + confidence alert badges
 * - Top 5 predictions list with confidence bars
 * - "Ver Detalles" navigates to species detail
 * - "Volver a Tomar" retakes photo
 */

import { SmartImageBackground } from "@/components/common/SmartImage";
import {
    BottomSheet,
    BottomSheetBody,
    BottomSheetFooter,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import {
    getClassificationAlerts,
    type ClassificationAlertTone,
} from "@/lib/classification-alerts";
import {
    formatConservationStatus,
    getConservationStatusBadgeStyle,
} from "@/lib/formatters";
import { THEME } from "@/lib/theme";
import type { ClassificationResponse, SpeciesPrediction } from "@/types";
import {
    AlertTriangle,
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
    result: ClassificationResponse | null;
    imageUri: string | null;
    onRetake: () => void;
    onViewDetails: () => void;
}

export function ResultsDrawer({
    open,
    onClose,
    result,
    imageUri,
    onRetake,
    onViewDetails,
}: ResultsDrawerProps) {
    const { colorScheme } = useColorScheme();
    const theme = colorScheme === "dark" ? THEME.dark : THEME.light;

    if (!result || !result.predictions.length) return null;

    const topPred: SpeciesPrediction = result.predictions[0];
    const confidence = topPred.confidence * 100;
    const alerts = getClassificationAlerts(result, topPred);
    const conservationBadgeStyle = getConservationStatusBadgeStyle(
        topPred.speciesData?.conservationStatus,
    );

    const alertStyles: Record<
        ClassificationAlertTone,
        {
            containerClass: string;
            iconColor: string;
            textClass: string;
        }
    > = {
        destructive: {
            containerClass: "bg-destructive/10 border border-destructive/30",
            iconColor: theme.destructive,
            textClass: "text-destructive",
        },
        warning: {
            containerClass: "bg-warning/10 border border-warning/30",
            iconColor: theme.warning,
            textClass: "text-warning",
        },
        info: {
            containerClass: "bg-muted border border-border",
            iconColor: theme.mutedForeground,
            textClass: "text-muted-foreground",
        },
    };

    return (
        <BottomSheet open={open} onClose={onClose} snapPoint={0.85}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ─── Hero Section: Photo Background + Confidence ─── */}
                <SmartImageBackground
                    source={imageUri ? { uri: imageUri } : undefined}
                    contentFit="cover"
                    className="overflow-hidden"
                    style={{
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                    }}
                >
                    {/* Dark overlay */}
                    <View
                        className="items-center px-4 pt-6 pb-5"
                        style={{ backgroundColor: "rgba(0, 0, 0, 0.65)" }}
                    >
                        {/* Circular Confidence Indicator */}
                        <View
                            className="w-28 h-28 rounded-full items-center justify-center mb-3"
                            style={{
                                borderWidth: 5,
                                borderColor:
                                    confidence >= 80
                                        ? theme.success
                                        : confidence >= 50
                                          ? theme.warning
                                          : theme.destructive,
                                backgroundColor: "rgba(0, 0, 0, 0.4)",
                            }}
                        >
                            <Text
                                className="text-3xl font-bold"
                                style={{ color: "#FFFFFF" }}
                            >
                                {confidence.toFixed(0)}%
                            </Text>
                            <Text
                                className="text-[9px] uppercase tracking-widest"
                                style={{ color: "rgba(255, 255, 255, 0.7)" }}
                            >
                                Precisión
                            </Text>
                        </View>

                        {/* Species Info */}
                        <Text
                            className="text-xs font-semibold uppercase tracking-wider mb-1"
                            style={{ color: theme.primary }}
                        >
                            Especie Identificada
                        </Text>
                        <Text
                            className="text-xl font-bold text-center"
                            style={{ color: "#FFFFFF" }}
                        >
                            {topPred.speciesData?.commonName ?? topPred.species}
                        </Text>
                        <Text
                            className="text-sm italic text-center"
                            style={{ color: "rgba(255, 255, 255, 0.7)" }}
                        >
                            {topPred.species}
                        </Text>

                        {/* Badges Row */}
                        <View className="flex-row items-center justify-center gap-2 mt-3 flex-wrap">
                            {topPred.taxonomy?.family && (
                                <View
                                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.15)",
                                    }}
                                >
                                    <Leaf
                                        size={12}
                                        color="#FFFFFF"
                                        strokeWidth={1.5}
                                    />
                                    <Text
                                        className="text-xs font-medium"
                                        style={{ color: "#FFFFFF" }}
                                    >
                                        {topPred.taxonomy.family}
                                    </Text>
                                </View>
                            )}
                            <View
                                className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                                style={{
                                    backgroundColor:
                                        "rgba(255, 255, 255, 0.15)",
                                }}
                            >
                                <MapPin
                                    size={12}
                                    color="#FFFFFF"
                                    strokeWidth={1.5}
                                />
                                <Text
                                    className="text-xs font-medium"
                                    style={{ color: "#FFFFFF" }}
                                >
                                    Caldas, CO
                                </Text>
                            </View>
                            {topPred.speciesData?.conservationStatus && (
                                <View
                                    className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-full ${conservationBadgeStyle.containerClass}`}
                                >
                                    <Shield
                                        size={12}
                                        color={theme.foreground}
                                        strokeWidth={1.5}
                                    />
                                    <Text
                                        className={`text-xs font-medium ${conservationBadgeStyle.textClass}`}
                                    >
                                        {formatConservationStatus(
                                            topPred.speciesData
                                                .conservationStatus,
                                        )}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </SmartImageBackground>

                <BottomSheetBody>
                    <View className="mt-4 mb-4">
                        <Button
                            className="rounded-2xl h-14"
                            onPress={onViewDetails}
                        >
                            <ExternalLink
                                size={18}
                                color={theme.primaryForeground}
                                strokeWidth={1.8}
                            />
                            <Text className="font-bold text-primary-foreground ml-2 text-base">
                                Ver Detalles →
                            </Text>
                        </Button>
                    </View>

                    {/* ─── Alerts (normalized + translated) ─────────── */}
                    {alerts.map((alert) => {
                        const style = alertStyles[alert.tone];
                        return (
                            <View
                                key={alert.id}
                                className={`flex-row items-center gap-2 rounded-xl px-3 py-2.5 mb-4 ${style.containerClass}`}
                            >
                                <AlertTriangle
                                    size={14}
                                    color={style.iconColor}
                                    strokeWidth={1.8}
                                />
                                <Text
                                    className={`text-xs flex-1 ${style.textClass}`}
                                >
                                    {alert.message}
                                </Text>
                            </View>
                        );
                    })}

                    {/* ─── Top 5 Predictions ───────────────────────── */}
                    <Text className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        Top {Math.min(result.predictions.length, 5)}{" "}
                        Predicciones
                    </Text>
                    <View className="bg-card border border-border rounded-2xl p-3 mb-4">
                        {result.predictions.slice(0, 5).map((pred, i) => (
                            <View
                                key={`pred-${pred.rank}`}
                                className={`flex-row items-center gap-3 py-2.5 ${
                                    i <
                                    Math.min(result.predictions.length, 5) - 1
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
                                        {pred.rank}
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
                                    {pred.species}
                                </Text>
                                <View className="w-14">
                                    <Progress
                                        value={pred.confidence * 100}
                                        className="h-1.5"
                                    />
                                </View>
                                <Text className="text-xs text-muted-foreground w-11 text-right font-medium">
                                    {(pred.confidence * 100).toFixed(1)}%
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* ─── Model info ──────────────────────────────── */}
                    <View className="items-center mb-2">
                        <Text className="text-[10px] text-muted-foreground">
                            🧠 Modelo: {result.model} · {result.numClasses}{" "}
                            clases
                        </Text>
                    </View>
                </BottomSheetBody>

                {/* ─── Actions ─────────────────────────────────── */}
                <BottomSheetFooter>
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
