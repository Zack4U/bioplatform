/**
 * /identify/model-info — Model Metrics Dashboard page.
 *
 * Composes feature components to display the CNN model's evaluation
 * metrics, architecture details, and per-species performance.
 *
 * Data sources:
 *   - useModelMetrics() → GET /api/v1/model-metrics
 *   - useModelInfo()    → GET /api/v1/model-info
 *
 * Architecture: Page composes components (copilot-instructions §2.2).
 * All logic and presentation delegated to feature components.
 *
 * @module app/identify/model-info/page
 */

"use client";

import { PageHeader } from "@/components/common/PageHeader";
import {
    ModelMetricsCharts,
    ModelMetricsComparison,
    ModelMetricsKpiCards,
    ModelMetricsSpeciesTable,
} from "@/components/features/identification/model-metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    useModelInfo,
    useModelMetrics,
} from "@/hooks/features/identification/useClassification";
import { ArrowLeft, FlaskConical } from "lucide-react";
import Link from "next/link";

// ── Shared breadcrumbs ───────────────────────────────────────────────────────

const BREADCRUMBS = [
    { label: "Inicio", href: "/" },
    { label: "Identificacion IA", href: "/identify" },
    { label: "Metricas" },
];

// ── Page Component ───────────────────────────────────────────────────────────

export default function ModelInfoPage() {
    const {
        data: metrics,
        isLoading: metricsLoading,
        error: metricsError,
    } = useModelMetrics();
    const { data: modelInfo, isLoading: modelLoading } = useModelInfo();

    // ── Loading ──────────────────────────────────────────────────────────────
    if (metricsLoading || modelLoading) {
        return (
            <main className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <PageHeader
                    title="Metricas del Modelo IA"
                    breadcrumbs={BREADCRUMBS}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-96 rounded-xl" />
            </main>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (metricsError || !metrics) {
        return (
            <main className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <PageHeader
                    title="Metricas del Modelo IA"
                    breadcrumbs={BREADCRUMBS}
                />
                <Card>
                    <CardContent className="flex flex-col items-center gap-4 py-12">
                        <FlaskConical className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">
                            No se pudieron cargar las metricas del modelo.
                            Verifica que el servicio de IA este activo.
                        </p>
                        <Button variant="outline" asChild>
                            <Link href="/identify">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al Identificador
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </main>
        );
    }

    // ── Success ──────────────────────────────────────────────────────────────
    return (
        <main className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <PageHeader
                title="Metricas del Modelo IA"
                description="Evaluacion completa del modelo CNN de clasificacion de especies. Metricas generadas sobre el conjunto de prueba."
                breadcrumbs={BREADCRUMBS}
                actions={
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">
                            Versión: {modelInfo?.version ?? "—"}
                        </Badge>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/identify">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Link>
                        </Button>
                    </div>
                }
            />

            <ModelMetricsKpiCards metrics={metrics} />

            <ModelMetricsCharts metrics={metrics} />

            <ModelMetricsComparison metrics={metrics} modelInfo={modelInfo} />

            <ModelMetricsSpeciesTable metrics={metrics} />
        </main>
    );
}
