"use client";

/**
 * EntrepreneurDashboardView — sales & product metrics for ENTREPRENEUR role.
 * Connected to real backend SellerDashboardEnhancedDTO.
 */

import { StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/constants";
import type { SellerDashboardEnhancedDTO } from "@/types/admin";
import { AlertTriangle, DollarSign, Package, ShoppingCart, Star } from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
const TICK_STYLE = { fill: "oklch(0.5 0.01 120)", fontSize: 12, fontFamily: "inherit" };
const GRID_STROKE = "oklch(0.902 0.008 120)";
const TOOLTIP_STYLE = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--card-foreground)", fontSize: 13 };

interface Props { metrics: SellerDashboardEnhancedDTO; }

export function EntrepreneurDashboardView({ metrics }: Props) {
    const revenueByCategory = metrics.revenueByCategory.slice(0, 6).map((c) => ({
        name: c.categoryName,
        revenue: c.revenue,
    }));

    const maxRatingCount = Math.max(...metrics.ratingDistribution.map((r) => r.count), 1);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard de Emprendedor</h1>
                <p className="text-muted-foreground">Rendimiento de tus productos y ventas</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Mis Productos" value={`${metrics.activeProducts}/${metrics.totalProducts}`}
                    icon={<Package className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.lowStockProducts.length} bajo stock` }} />
                <StatCard label="Órdenes del Mes" value={metrics.totalOrdersThisMonth.toLocaleString("es-CO")}
                    icon={<ShoppingCart className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.ordersPendingShipment} pendientes envío` }} />
                <StatCard label="Ingresos del Mes" value={formatCurrency(metrics.totalSalesThisMonth)}
                    icon={<DollarSign className="h-5 w-5" />}
                    trend={{ value: 0, label: `${formatCurrency(metrics.revenueLastMonth)} mes pasado` }} />
                <StatCard label="Calificación Promedio" value={metrics.averageRating.toFixed(1)}
                    icon={<Star className="h-5 w-5" />}
                    trend={{ value: 0, label: `${metrics.totalReviews} reseñas` }} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Revenue by category */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">Ingresos por Categoría</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueByCategory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="gradEntrBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.437 0.124 149.214)" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="oklch(0.437 0.124 149.214)" stopOpacity={0.35} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                                    <XAxis dataKey="name" tick={TICK_STYLE} />
                                    <YAxis tick={TICK_STYLE} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatCurrency(Number(v)), "Ingresos"]} />
                                    <Bar dataKey="revenue" fill="url(#gradEntrBar)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Top products */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Top Productos</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {metrics.topProducts.slice(0, 5).map((p, idx) => (
                                <li key={p.productId} className="flex items-start gap-3 border-b pb-3 last:border-0">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{p.productName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatCurrency(p.totalRevenue)} · {p.unitsSold} uds.
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Rating distribution */}
            {metrics.ratingDistribution.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Distribución de Calificaciones</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[5, 4, 3, 2, 1].map((stars) => {
                                const found = metrics.ratingDistribution.find((r) => r.stars === stars);
                                const count = found?.count ?? 0;
                                const pct = Math.round((count / maxRatingCount) * 100);
                                return (
                                    <div key={stars} className="flex items-center gap-3">
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground w-8">
                                            {stars} <Star className="h-3 w-3 fill-amber-400 stroke-amber-400" />
                                        </span>
                                        <Progress value={pct} className="flex-1 h-2" />
                                        <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Low stock alert */}
            {metrics.lowStockProducts.length > 0 && (
                <Card className="border-amber-500/40">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            Productos con Bajo Stock
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {metrics.lowStockProducts.map((p) => (
                                <Badge key={p.productId} variant="outline" className="border-amber-400 text-amber-700">
                                    {p.productName} — {p.stockQuantity} uds.
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
