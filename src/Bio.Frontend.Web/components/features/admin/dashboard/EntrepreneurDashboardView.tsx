"use client";

/**
 * EntrepreneurDashboard — sales & product metrics for ENTREPRENEUR role.
 */

import { StatCard } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/constants";
import type { EntrepreneurMetrics, RevenueChartPoint } from "@/types";
import { DollarSign, Package, ShoppingCart, Star } from "lucide-react";
import {
    Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

interface Props {
    metrics: EntrepreneurMetrics;
    revenueChart: RevenueChartPoint[];
}

export function EntrepreneurDashboardView({ metrics, revenueChart }: Props) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                    Dashboard de Emprendedor
                </h1>
                <p className="text-muted-foreground">
                    Rendimiento de tus productos y ventas
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Mis Productos"
                    value={metrics.myProducts}
                    icon={<Package className="h-5 w-5" />}
                    trend={{ value: metrics.productsGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Ventas Totales"
                    value={metrics.totalSales}
                    icon={<ShoppingCart className="h-5 w-5" />}
                    trend={{ value: metrics.salesGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Ingresos"
                    value={formatCurrency(metrics.totalRevenue)}
                    icon={<DollarSign className="h-5 w-5" />}
                    trend={{ value: metrics.revenueGrowthPercent, label: "vs mes anterior" }}
                />
                <StatCard
                    label="Calificacion Promedio"
                    value={metrics.averageRating.toFixed(1)}
                    icon={<Star className="h-5 w-5" />}
                    trend={{ value: metrics.ratingChangePercent, label: "vs mes anterior" }}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Revenue chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Tendencia de Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueChart}>
                                    <defs>
                                        <linearGradient id="colorRevenueEnt" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Ingresos"]} />
                                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" fill="url(#colorRevenueEnt)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top products */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Top Productos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            {metrics.topProducts.map((product, idx) => (
                                <li key={product.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatCurrency(product.revenue)} — {product.unitsSold} uds
                                        </p>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {product.rating.toFixed(1)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
