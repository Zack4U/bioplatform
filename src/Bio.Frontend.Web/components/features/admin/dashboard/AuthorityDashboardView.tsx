"use client";

/**
 * AuthorityDashboard — permits & requests metrics for AUTHORITY role.
 */

import { StatCard } from "@/components/common";
import { StatusBadge, getPermitStatusVariant } from "@/components/common/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ABS_PERMIT_STATUS_LABELS, REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS, translateLabel } from "@/lib/constants";
import type { AuthorityMetrics } from "@/types";
import { AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
    Active: "hsl(var(--chart-1))",
    Expired: "hsl(var(--chart-4))",
    Suspended: "hsl(var(--chart-3))",
    Revoked: "hsl(var(--chart-5))",
};

interface Props {
    metrics: AuthorityMetrics;
}

export function AuthorityDashboardView({ metrics }: Props) {
    const permitData = Object.entries(metrics.permitsByStatus).map(
        ([name, value]) => ({ name: translateLabel(ABS_PERMIT_STATUS_LABELS, name), value }),
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Dashboard de Autoridad Ambiental
                </h1>
                <p className="text-muted-foreground">
                    Permisos ABS, solicitudes y cumplimiento normativo
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Permisos Activos"
                    value={metrics.activePermits}
                    icon={<Shield className="h-5 w-5" />}
                    trend={{ value: metrics.permitsGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Solicitudes Pendientes"
                    value={metrics.pendingRequests}
                    icon={<Clock className="h-5 w-5" />}
                    trend={{ value: metrics.requestsGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Proximos a Vencer"
                    value={metrics.expiringSoon}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    trend={{ value: metrics.expiringGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Solicitudes Denegadas"
                    value={metrics.deniedRequests}
                    icon={<CheckCircle className="h-5 w-5" />}
                    trend={{ value: metrics.deniedGrowthPercent, label: "vs mes anterior" }}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Permits by status chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Permisos por Estado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={permitData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="name" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {permitData.map((entry) => (
                                            <Cell
                                                key={entry.name}
                                                fill={STATUS_COLORS[entry.name] ?? "hsl(var(--chart-1))"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent requests */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Solicitudes Recientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {metrics.recentRequests.map((req) => (
                                <li key={req.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{req.requesterName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {translateLabel(REQUEST_TYPE_LABELS, req.type)} — {new Date(req.createdAt).toLocaleDateString("es-CO")}
                                        </p>
                                    </div>
                                    <StatusBadge
                                        label={translateLabel(REQUEST_STATUS_LABELS, req.status)}
                                        variant={getPermitStatusVariant(
                                            req.status === "pending" ? "Suspended" :
                                            req.status === "approved" ? "Active" : "Expired"
                                        )}
                                    />
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
