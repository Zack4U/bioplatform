/**
 * ModelMetricsKpiCards — Row of 4 KPI summary cards.
 *
 * Displays: Accuracy, Top-5 Accuracy, Macro F1-Score, Species Count.
 * Uses gradient icon backgrounds with color-coded themes.
 *
 * @module components/features/identification/model-metrics/ModelMetricsKpiCards
 */

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ModelMetricsResponse } from "@/types";
import { Activity, Layers, Target, TrendingUp } from "lucide-react";

interface ModelMetricsKpiCardsProps {
    metrics: ModelMetricsResponse;
}

// ── Color map ────────────────────────────────────────────────────────────────

const KPI_COLOR_MAP = {
    emerald: "from-emerald-500/15 to-emerald-500/5 text-emerald-500",
    blue: "from-blue-500/15 to-blue-500/5 text-blue-500",
    violet: "from-violet-500/15 to-violet-500/5 text-violet-500",
    amber: "from-amber-500/15 to-amber-500/5 text-amber-500",
} as const;

type KpiColor = keyof typeof KPI_COLOR_MAP;

// ── Component ────────────────────────────────────────────────────────────────

export function ModelMetricsKpiCards({ metrics }: ModelMetricsKpiCardsProps) {
    return (
        <section
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Metricas principales"
        >
            <KpiCard
                title="Accuracy"
                value={`${(metrics.accuracy * 100).toFixed(1)}%`}
                subtitle="Prediccion correcta"
                icon={<Target className="h-5 w-5" />}
                color="emerald"
            />
            <KpiCard
                title="Top-5 Accuracy"
                value={`${(metrics.top5Accuracy * 100).toFixed(1)}%`}
                subtitle="Correcta en top 5"
                icon={<TrendingUp className="h-5 w-5" />}
                color="blue"
            />
            <KpiCard
                title="Macro F1-Score"
                value={`${(metrics.macroAvg.f1Score * 100).toFixed(1)}%`}
                subtitle="Promedio por especie"
                icon={<Activity className="h-5 w-5" />}
                color="violet"
            />
            <KpiCard
                title="Especies Evaluadas"
                value={metrics.totalEvaluatedSpecies.toLocaleString()}
                subtitle={`${metrics.totalSamples?.toLocaleString() ?? "—"} muestras de prueba`}
                icon={<Layers className="h-5 w-5" />}
                color="amber"
            />
        </section>
    );
}

// ── KpiCard (private) ────────────────────────────────────────────────────────

function KpiCard({
    title,
    value,
    subtitle,
    icon,
    color,
}: {
    title: string;
    value: string;
    subtitle: string;
    icon: React.ReactNode;
    color: KpiColor;
}) {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {title}
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                            {value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {subtitle}
                        </p>
                    </div>
                    <div
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br",
                            KPI_COLOR_MAP[color],
                        )}
                    >
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
