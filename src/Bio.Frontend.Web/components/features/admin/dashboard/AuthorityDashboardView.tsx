"use client";

/**
 * AuthorityDashboardView — permits & compliance metrics for AUTHORITY role.
 * Connected to real backend AuthorityDashboardDTO.
 */

import { StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthorityDashboardDTO } from "@/types/admin";
import { AlertTriangle, CheckCircle, Clock, Shield, XCircle } from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const TICK_STYLE = { fill: "oklch(0.5 0.01 120)", fontSize: 12, fontFamily: "inherit" };
const GRID_STROKE = "oklch(0.902 0.008 120)";
const TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--card-foreground)", fontSize: 13 };

interface Props { metrics: AuthorityDashboardDTO; }

export function AuthorityDashboardView({ metrics }: Props) {
    const permitData = [
        { name: "Activo",     value: metrics.activePermits },
        { name: "Expirado",   value: metrics.expiredPermits },
        { name: "Suspendido", value: metrics.suspendedPermits },
        { name: "Revocado",   value: metrics.revokedPermits },
    ].filter(d => d.value > 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard Autoridad Ambiental</h1>
                <p className="text-muted-foreground">Permisos ABS, cumplimiento normativo — Protocolo de Nagoya</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Permisos Activos" value={metrics.activePermits.toLocaleString("es-CO")}
                    icon={<Shield className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.totalAbsPermits} totales` }} />
                <StatCard label="Próximos a Vencer (30d)" value={metrics.expiringIn30Days.length.toLocaleString("es-CO")}
                    icon={<Clock className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.expiringIn90Days.length} en 90 días` }} />
                <StatCard label="Certificaciones" value={metrics.totalCertifications.toLocaleString("es-CO")}
                    icon={<CheckCircle className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.certificationsExpiringSoon.length} por vencer` }} />
                <StatCard label="Productos sin Permiso" value={metrics.productsWithoutValidPermit.toLocaleString("es-CO")}
                    icon={<XCircle className="h-5 w-5" />} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Permits by status chart */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Permisos por Estado</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={permitData}>
                                    <defs>
                                        <linearGradient id="gradAuthBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.437 0.124 149.214)" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="oklch(0.437 0.124 149.214)" stopOpacity={0.35} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                                    <XAxis dataKey="name" tick={TICK_STYLE} />
                                    <YAxis tick={TICK_STYLE} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Bar dataKey="value" fill="url(#gradAuthBar)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Expiring soon alerts */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Permisos Próximos a Vencer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {metrics.expiringIn30Days.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No hay permisos próximos a vencer en los próximos 30 días ✓
                            </p>
                        ) : (
                            <ul className="space-y-3 max-h-[220px] overflow-y-auto">
                                {metrics.expiringIn30Days.map((p) => (
                                    <li key={p.permitId}
                                        className="flex items-center justify-between gap-3 border-b pb-3 last:border-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium font-mono">{p.resolutionNumber}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Vence: {new Date(p.expirationDate).toLocaleDateString("es-CO")}
                                            </p>
                                        </div>
                                        <Badge variant={p.daysUntilExpiry <= 7 ? "destructive" : "outline"}
                                            className="shrink-0">
                                            {p.daysUntilExpiry}d
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Certifications by type */}
            {metrics.certificationsByType.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Certificaciones por Tipo</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {metrics.certificationsByType.map((c) => (
                                <div key={c.type} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                                    <span className="text-sm font-medium">{c.type}</span>
                                    <Badge variant="secondary">{c.count}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
