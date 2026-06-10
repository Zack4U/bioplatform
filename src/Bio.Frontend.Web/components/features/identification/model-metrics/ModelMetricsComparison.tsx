/**
 * ModelMetricsComparison — Macro vs Weighted averages + Architecture card.
 *
 * Two-column layout (50/50 on lg):
 *   - Left: Precision / Recall / F1 comparison between macro and weighted avg.
 *   - Right: Model architecture details (name, classes, image size, device).
 *
 * @module components/features/identification/model-metrics/ModelMetricsComparison
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ModelInfoResponse, ModelMetricsResponse } from "@/types";
import { Brain, Cpu, Crosshair, Layers, Zap } from "lucide-react";

import { metricColor } from "./helpers";

interface ModelMetricsComparisonProps {
    metrics: ModelMetricsResponse;
    modelInfo: ModelInfoResponse | undefined;
}

export function ModelMetricsComparison({
    metrics,
    modelInfo,
}: ModelMetricsComparisonProps) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {/* ── Macro vs Weighted ────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <Crosshair className="h-4 w-4" />
                        Promedios Macro vs Ponderado
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div />
                        <p className="text-xs font-semibold text-muted-foreground">
                            Macro
                        </p>
                        <p className="text-xs font-semibold text-muted-foreground">
                            Ponderado
                        </p>

                        {(["precision", "recall", "f1Score"] as const).map(
                            (key) => {
                                const label =
                                    key === "f1Score"
                                        ? "F1-Score"
                                        : key.charAt(0).toUpperCase() +
                                          key.slice(1);
                                return (
                                    <div
                                        key={key}
                                        className="col-span-3 grid grid-cols-3 items-center gap-4"
                                    >
                                        <p className="text-left text-sm font-medium">
                                            {label}
                                        </p>
                                        <p
                                            className={cn(
                                                "text-lg font-bold",
                                                metricColor(
                                                    metrics.macroAvg[key],
                                                ),
                                            )}
                                        >
                                            {(
                                                metrics.macroAvg[key] * 100
                                            ).toFixed(1)}
                                            %
                                        </p>
                                        <p
                                            className={cn(
                                                "text-lg font-bold",
                                                metricColor(
                                                    metrics.weightedAvg[key],
                                                ),
                                            )}
                                        >
                                            {(
                                                metrics.weightedAvg[key] * 100
                                            ).toFixed(1)}
                                            %
                                        </p>
                                    </div>
                                );
                            },
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── Model Architecture ───────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <Brain className="h-4 w-4" />
                        Arquitectura del Modelo
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {modelInfo ? (
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem
                                icon={<Brain className="h-4 w-4" />}
                                label="Modelo"
                                value={modelInfo.modelName}
                            />
                            <InfoItem
                                icon={<Layers className="h-4 w-4" />}
                                label="Clases"
                                value={modelInfo.numClasses.toLocaleString()}
                            />
                            <InfoItem
                                icon={<Zap className="h-4 w-4" />}
                                label="Tamaño Imagen"
                                value={`${modelInfo.imageSize}×${modelInfo.imageSize} px`}
                            />
                            <InfoItem
                                icon={<Cpu className="h-4 w-4" />}
                                label="Dispositivo"
                                value={modelInfo.device.toUpperCase()}
                            />
                            <div className="col-span-2">
                                <Badge
                                    variant={
                                        modelInfo.isLoaded
                                            ? "default"
                                            : "destructive"
                                    }
                                    className="text-xs"
                                >
                                    {modelInfo.isLoaded
                                        ? "✓ Modelo cargado y listo"
                                        : "✕ Modelo no disponible"}
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Informacion del modelo no disponible.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// ── InfoItem (private) ───────────────────────────────────────────────────────

function InfoItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="text-muted-foreground">{icon}</div>
            <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <p className="text-sm font-semibold">{value}</p>
            </div>
        </div>
    );
}
