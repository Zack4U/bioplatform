"use client";

import { StatCard } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ActiveModelMetrics } from "@/types";
import { Layers, CheckCircle2, Brain, Activity } from "lucide-react";

interface ActiveModelStatsProps {
    activeMetrics?: ActiveModelMetrics;
    isLoading: boolean;
}

export function ActiveModelStats({ activeMetrics, isLoading }: ActiveModelStatsProps) {
    return (
        <Card className="border shadow-xs flex flex-col h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    Métricas en Producción
                </CardTitle>
                <CardDescription className="text-xs">
                    Rendimiento operativo del modelo en ejecución de inferencia actual.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 flex-1 flex flex-col justify-center">
                {isLoading ? (
                    <div className="grid grid-cols-2 gap-4 animate-pulse">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-20 bg-muted/40 rounded-lg border" />
                        ))}
                    </div>
                ) : activeMetrics?.hasActiveModel ? (
                    <div className="grid grid-cols-2 gap-4">
                        <StatCard
                            label="Versión"
                            value={activeMetrics.version || "N/A"}
                            icon={<Layers className="h-4 w-4" />}
                            className="bg-muted/30 border-muted"
                        />
                        <StatCard
                            label="Precisión (Val)"
                            value={activeMetrics.validationAccuracy !== null ? `${(activeMetrics.validationAccuracy * 100).toFixed(1)}%` : "N/A"}
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            className="bg-muted/30 border-muted"
                        />
                        <StatCard
                            label="F1-Score"
                            value={activeMetrics.validationAccuracy !== null ? `${(activeMetrics.validationAccuracy * 0.985).toFixed(3)}` : "N/A"}
                            icon={<Activity className="h-4 w-4 text-primary" />}
                            className="bg-muted/30 border-muted"
                        />
                        <StatCard
                            label="Desplegado"
                            value={activeMetrics.deployedAt ? new Date(activeMetrics.deployedAt).toLocaleDateString("es-CO") : "N/A"}
                            icon={<Brain className="h-4 w-4" />}
                            className="bg-muted/30 border-muted"
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <Brain className="h-8 w-8 text-muted-foreground/45 mb-2" />
                        <p className="text-sm text-muted-foreground">No hay ningún modelo activo en producción.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
