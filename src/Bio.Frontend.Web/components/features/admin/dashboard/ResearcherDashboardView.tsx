"use client";

/**
 * ResearcherDashboard — species & validation metrics for RESEARCHER role.
 */

import { StatCard } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivityItem, ResearcherMetrics } from "@/types";
import { CheckCircle, Image, Leaf, TrendingUp } from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const PIE_COLORS = [
    "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))",
    "hsl(var(--chart-4))", "hsl(var(--chart-5))",
];

interface Props {
    metrics: ResearcherMetrics;
    recentActivity: RecentActivityItem[];
}

export function ResearcherDashboardView({ metrics, recentActivity }: Props) {
    const conservationData = Object.entries(metrics.speciesByConservation).map(
        ([key, value]) => ({ name: key, value }),
    );
    const kingdomData = Object.entries(metrics.speciesByKingdom).map(
        ([name, value]) => ({ name, value }),
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Dashboard de Investigacion
                </h1>
                <p className="text-muted-foreground">
                    Metricas de especies, validaciones e imagenes
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Especies Registradas"
                    value={metrics.speciesRegistered}
                    icon={<Leaf className="h-5 w-5" />}
                    trend={{ value: metrics.speciesGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Validaciones Pendientes"
                    value={metrics.pendingValidations}
                    icon={<CheckCircle className="h-5 w-5" />}
                    trend={{ value: metrics.validationsGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Imagenes Validadas"
                    value={metrics.imagesValidated}
                    icon={<Image className="h-5 w-5" />}
                    trend={{ value: metrics.imagesGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Contribuciones del Mes"
                    value={metrics.contributionsThisMonth}
                    icon={<TrendingUp className="h-5 w-5" />}
                    trend={{ value: metrics.contributionsGrowthPercent, label: "vs mes anterior" }}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Conservation status pie chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Especies por Estado de Conservacion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={conservationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {conservationData.map((_, idx) => (
                                            <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Kingdom bar chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Especies por Reino</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={kingdomData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent activity */}
            {recentActivity.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {recentActivity.map((a) => (
                                <li key={a.id} className="flex flex-col gap-0.5 border-b pb-3 last:border-0">
                                    <p className="text-sm font-medium">{a.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {a.userName} — {new Date(a.createdAt).toLocaleDateString("es-CO")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
