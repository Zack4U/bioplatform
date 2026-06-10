"use client";

/**
 * ResearcherDashboardView — species & validation metrics for RESEARCHER role.
 * Connected to real backend ResearcherDashboardDTO.
 */

import { StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResearcherDashboardDTO } from "@/types/admin";
import { CheckCircle, Image as ImageIcon, Leaf, MapPin, TrendingUp } from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const PIE_COLORS = [
    "oklch(0.437 0.124 149.214)",
    "oklch(0.588 0.158 241.966)",
    "oklch(0.75 0.183 55.934)",
    "oklch(0.646 0.222 41.116)",
    "oklch(0.627 0.265 303.9)",
];
const TICK_STYLE = { fill: "oklch(0.5 0.01 120)", fontSize: 12, fontFamily: "inherit" };
const GRID_STROKE = "oklch(0.902 0.008 120)";
const TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--card-foreground)", fontSize: 13 };

interface Props { metrics: ResearcherDashboardDTO; }

export function ResearcherDashboardView({ metrics }: Props) {
    const conservationData = metrics.byConservationStatus.map(
        (s) => ({ name: s.status || "N/D", value: s.count }),
    );
    const kingdomData = metrics.byKingdom.map(
        (k) => ({ name: k.kingdom || "N/D", value: k.count }),
    );
    const validationPct = metrics.totalImages > 0
        ? Math.round((metrics.validatedImages / metrics.totalImages) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard de Investigación</h1>
                <p className="text-muted-foreground">Métricas de especies, validaciones e imágenes</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Especies Registradas" value={metrics.totalSpecies.toLocaleString("es-CO")}
                    icon={<Leaf className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.sensitiveSpecies} sensibles` }} />
                <StatCard label="Pendientes de Validación" value={metrics.pendingValidationImages.toLocaleString("es-CO")}
                    icon={<CheckCircle className="h-5 w-5" />}
                    trend={{ value: 0, label: `${validationPct}% validadas` }} />
                <StatCard label="Imágenes Validadas por Mí" value={metrics.imagesValidatedByMe.toLocaleString("es-CO")}
                    icon={<ImageIcon className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.imagesUploadedThisMonth} subidas este mes` }} />
                <StatCard label="Registros Geográficos" value={metrics.geographicRecordsCount.toLocaleString("es-CO")}
                    icon={<MapPin className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.municipalitiesWithRecords} municipios` }} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Conservation status pie */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Especies por Estado de Conservación</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        {PIE_COLORS.map((color, i) => (
                                            <linearGradient key={i} id={`gradResPie${i}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={color} stopOpacity={0.95} />
                                                <stop offset="95%" stopColor={color} stopOpacity={0.55} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <Pie data={conservationData} cx="50%" cy="50%"
                                        innerRadius={60} outerRadius={100}
                                        dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                                        {conservationData.map((_, idx) => (
                                            <Cell key={idx} fill={`url(#gradResPie${idx % PIE_COLORS.length})`} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Kingdom bar chart */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Especies por Reino</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={kingdomData}>
                                    <defs>
                                        <linearGradient id="gradResBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.437 0.124 149.214)" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="oklch(0.437 0.124 149.214)" stopOpacity={0.35} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                                    <XAxis dataKey="name" tick={TICK_STYLE} />
                                    <YAxis tick={TICK_STYLE} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Bar dataKey="value" fill="url(#gradResBar)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Imágenes Totales" value={metrics.totalImages.toLocaleString("es-CO")}
                    icon={<ImageIcon className="h-5 w-5" />} />
                <StatCard label="Imágenes Validadas" value={metrics.validatedImages.toLocaleString("es-CO")}
                    icon={<CheckCircle className="h-5 w-5" />}
                    trend={{ value: 0, label: `${validationPct}% del total` }} />
                <StatCard label="Especies con Permisos ABS" value={metrics.speciesWithActiveAbsPermits.toLocaleString("es-CO")}
                    icon={<TrendingUp className="h-5 w-5" />} />
            </div>

            {/* Top Families */}
            {metrics.topFamilies.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Top Familias Taxonómicas</CardTitle></CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {metrics.topFamilies.slice(0, 5).map((f, i) => (
                                <div key={f.family} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="h-6 w-6 flex items-center justify-center rounded-full text-xs">
                                            {i + 1}
                                        </Badge>
                                        <p className="text-sm font-medium italic">{f.family}</p>
                                    </div>
                                    <Badge variant="secondary">{f.count} spp.</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
