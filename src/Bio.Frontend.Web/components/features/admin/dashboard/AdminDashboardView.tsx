"use client";

/**
 * AdminDashboard — platform-wide metrics for ADMIN role.
 */

import { StatCard } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { AdminPlatformMetrics, RecentActivityItem, RevenueChartPoint } from "@/types";
import { DollarSign, Leaf, Package, ShoppingCart, Users } from "lucide-react";
import {
    Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface Props {
    metrics: AdminPlatformMetrics;
    revenueChart: RevenueChartPoint[];
    recentActivity: RecentActivityItem[];
}

export function AdminDashboardView({ metrics, revenueChart, recentActivity }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Dashboard General
                </h1>
                <p className="text-muted-foreground">
                    Vista general de la plataforma BioCommerce Caldas
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Usuarios Totales"
                    value={metrics.totalUsers.toLocaleString("es-CO")}
                    icon={<Users className="h-5 w-5" />}
                    trend={{ value: metrics.userGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Especies Registradas"
                    value={metrics.totalSpecies.toLocaleString("es-CO")}
                    icon={<Leaf className="h-5 w-5" />}
                    trend={{ value: metrics.speciesGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Productos Activos"
                    value={metrics.totalProducts.toLocaleString("es-CO")}
                    icon={<Package className="h-5 w-5" />}
                />
                <StatCard
                    label="Ingresos Totales"
                    value={formatCurrency(metrics.totalRevenue)}
                    icon={<DollarSign className="h-5 w-5" />}
                    trend={{ value: metrics.revenueGrowthPercent, label: "vs mes anterior" }}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Revenue chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Ingresos Mensuales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChart}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis
                                        className="text-xs"
                                        tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatCurrency(Number(value)), "Ingresos"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="hsl(var(--chart-1))"
                                        fill="url(#colorRevenue)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {recentActivity.map((activity) => (
                                <li key={activity.id} className="flex flex-col gap-0.5 border-b pb-3 last:border-0">
                                    <p className="text-sm font-medium">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {activity.userName} — {new Date(activity.createdAt).toLocaleDateString("es-CO")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    label="Ordenes Totales"
                    value={metrics.totalOrders.toLocaleString("es-CO")}
                    icon={<ShoppingCart className="h-5 w-5" />}
                    trend={{ value: metrics.ordersGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Permisos Activos"
                    value={metrics.activePermits.toLocaleString("es-CO")}
                    icon={<Package className="h-5 w-5" />}
                />
                <StatCard
                    label="Validaciones Pendientes"
                    value={metrics.pendingValidations.toLocaleString("es-CO")}
                    icon={<Leaf className="h-5 w-5" />}
                />
            </div>
        </div>
    );
}
