/**
 * ModelMetricsCharts — F1 Histogram + Support Distribution.
 *
 * Two-column layout (2/3 + 1/3 on lg):
 *   - Left: CSS bar chart showing F1-score distribution across 10 bins.
 *   - Right: Test-sample bucket breakdown with progress bars.
 *
 * No external charting library — pure CSS bars.
 *
 * @module components/features/identification/model-metrics/ModelMetricsCharts
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ModelMetricsResponse } from "@/types";
import { BarChart3, FlaskConical } from "lucide-react";

import { histogramBarColor } from "./helpers";

interface ModelMetricsChartsProps {
    metrics: ModelMetricsResponse;
}

export function ModelMetricsCharts({ metrics }: ModelMetricsChartsProps) {
    const maxCount = Math.max(...(metrics.f1Histogram?.counts ?? [1]));

    return (
        <div className="grid gap-4 lg:grid-cols-3">
            {/* ── F1 Histogram (2/3 width) ─────────────────────────── */}
            <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <BarChart3 className="h-4 w-4" />
                        Distribucion de F1-Score
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className="flex items-end gap-1.5"
                        style={{ height: 180 }}
                    >
                        {metrics.f1Histogram?.labels.map((label, i) => {
                            const count =
                                metrics.f1Histogram.counts[i] ?? 0;
                            const heightPct =
                                maxCount > 0
                                    ? (count / maxCount) * 100
                                    : 0;

                            return (
                                <div
                                    key={label}
                                    className="group relative flex flex-1 flex-col items-center"
                                    style={{ height: "100%" }}
                                >
                                    <div className="flex w-full flex-1 items-end">
                                        <div
                                            className={cn(
                                                "w-full rounded-t-md transition-all duration-500",
                                                histogramBarColor(
                                                    i,
                                                    metrics.f1Histogram.labels
                                                        .length,
                                                ),
                                            )}
                                            style={{
                                                height: `${Math.max(heightPct, 2)}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="mt-0.5 text-[10px] font-semibold text-foreground">
                                        {count}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground">
                                        {label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                        F1-Score por especie (rango 0 a 1.0)
                    </p>
                </CardContent>
            </Card>

            {/* ── Support Distribution (1/3 width) ─────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        <FlaskConical className="h-4 w-4" />
                        Muestras de Prueba
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {metrics.supportDistribution &&
                        Object.entries(metrics.supportDistribution).map(
                            ([bucket, count]) => (
                                <div key={bucket} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {bucket} muestras
                                        </span>
                                        <span className="font-semibold">
                                            {count} especies
                                        </span>
                                    </div>
                                    <Progress
                                        value={
                                            (count /
                                                metrics.totalEvaluatedSpecies) *
                                            100
                                        }
                                        className="h-2"
                                    />
                                </div>
                            ),
                        )}
                    <p className="pt-2 text-center text-xs text-muted-foreground">
                        Total: {metrics.totalSamples?.toLocaleString()} muestras
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
