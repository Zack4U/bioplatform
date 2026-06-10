"use client";

/**
 * AdminDashboardView — platform-wide metrics for ADMIN role.
 * Connected to real backend AdminDashboardDTO.
 */

import { StatCard } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, ORDER_STATUS_LABELS } from "@/lib/constants";
import type { AdminDashboardDTO } from "@/types/admin";
import {
    AlertTriangle, CheckCircle, DollarSign, Layers, Leaf,
    Package, ShoppingCart, Users,
} from "lucide-react";
import {
    Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
    ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const CHART_COLORS = [
    "oklch(0.437 0.124 149.214)",
    "oklch(0.588 0.158 241.966)",
    "oklch(0.75 0.183 55.934)",
    "oklch(0.646 0.222 41.116)",
    "oklch(0.627 0.265 303.9)",
];

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrador",
    RESEARCHER: "Investigador",
    ENTREPRENEUR: "Emprendedor",
    COMMUNITY: "Comunidad",
    BUYER: "Comprador",
    AUTHORITY: "Autoridad",
};

const TICK_STYLE = { fill: "oklch(0.5 0.01 120)", fontSize: 12, fontFamily: "inherit" };
const GRID_STROKE = "oklch(0.902 0.008 120)";
const TOOLTIP_STYLE = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    color: "var(--card-foreground)",
    fontSize: 13,
};

interface Props { metrics: AdminDashboardDTO; }

export function AdminDashboardView({ metrics }: Props) {
    const { users, marketplace, orders, compliance, community, topEntrepreneurs } = metrics;

    const ordersByStatus = orders.byStatus.map((s) => ({
        ...s,
        status: ORDER_STATUS_LABELS[s.status] ?? s.status,
    }));

    const usersByRole = users.byRole.map((r) => ({
        ...r,
        role: ROLE_LABELS[r.role] ?? r.role,
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard General</h1>
                <p className="text-muted-foreground">
                    Vista general de la plataforma BioCommerce Caldas · Actualizado{" "}
                    {new Date(metrics.generatedAt).toLocaleString("es-CO")}
                </p>
            </div>

            {/* KPI Cards row 1 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Usuarios Totales" value={users.totalUsers.toLocaleString("es-CO")}
                    icon={<Users className="h-5 w-5" />}
                    trend={{ value: 0, label: `${users.newUsersThisMonth} nuevos este mes` }} />
                <StatCard label="Productos Activos" value={marketplace.activeProducts.toLocaleString("es-CO")}
                    icon={<Package className="h-5 w-5" />}
                    trend={{ value: 0, label: `${marketplace.lowStockProducts} bajo stock` }} />
                <StatCard label="Ingresos del Mes" value={formatCurrency(orders.revenueThisMonth)}
                    icon={<DollarSign className="h-5 w-5" />}
                    trend={{ value: 0, label: `${orders.ordersThisMonth} órdenes este mes` }} />
                <StatCard label="Permisos ABS Activos" value={compliance.activeAbsPermits.toLocaleString("es-CO")}
                    icon={<CheckCircle className="h-5 w-5" />}
                    trend={{ value: 0, label: `${compliance.permitsExpiringIn30Days} vencen en 30d` }} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Orders by status */}
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle className="text-base">Órdenes por Estado</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ordersByStatus} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="gradAdminBar" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="oklch(0.437 0.124 149.214)" stopOpacity={0.9} />
                                            <stop offset="95%" stopColor="oklch(0.437 0.124 149.214)" stopOpacity={0.35} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                                    <XAxis dataKey="status" tick={TICK_STYLE} />
                                    <YAxis tick={TICK_STYLE} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Bar dataKey="count" fill="url(#gradAdminBar)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Users by role */}
                <Card>
                    <CardHeader><CardTitle className="text-base">Usuarios por Rol</CardTitle></CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <defs>
                                        {CHART_COLORS.map((color, i) => (
                                            <linearGradient key={i} id={`gradAdminPie${i}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={color} stopOpacity={0.95} />
                                                <stop offset="95%" stopColor={color} stopOpacity={0.55} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <Pie data={usersByRole} dataKey="count" nameKey="role" cx="50%" cy="50%"
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        outerRadius={90} label={(props: any) => `${props.role}: ${props.count}`}
                                        labelLine={{ stroke: GRID_STROKE }}
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        style={{ fontSize: 11, fontFamily: "inherit" } as any}>
                                        {usersByRole.map((_, i) => (
                                            <Cell key={i} fill={`url(#gradAdminPie${i % CHART_COLORS.length})`} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Órdenes Totales" value={orders.totalOrders.toLocaleString("es-CO")}
                    icon={<ShoppingCart className="h-5 w-5" />}
                    trend={{ value: 0, label: formatCurrency(orders.totalRevenue) + " total" }} />
                <StatCard label="Productos Totales" value={marketplace.totalProducts.toLocaleString("es-CO")}
                    icon={<Leaf className="h-5 w-5" />} />
                <StatCard label="Posts Comunidad" value={community.publishedPosts.toLocaleString("es-CO")}
                    icon={<Layers className="h-5 w-5" />}
                    trend={{ value: 0, label: `${community.totalConnections} conexiones` }} />
                <StatCard label="Permisos por Vencer" value={compliance.permitsExpiringIn30Days.toLocaleString("es-CO")}
                    icon={<AlertTriangle className="h-5 w-5" />}
                    trend={{ value: 0, label: `${compliance.expiredAbsPermits} expirados` }} />
            </div>

            {/* Top Entrepreneurs */}
            {topEntrepreneurs.length > 0 && (
                <Card>
                    <CardHeader><CardTitle className="text-base">Top Emprendedores</CardTitle></CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {topEntrepreneurs.map((e, i) => (
                                <div key={e.entrepreneurId} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="h-7 w-7 flex items-center justify-center rounded-full">
                                            {i + 1}
                                        </Badge>
                                        <div>
                                            <p className="text-sm font-medium">{e.fullName}</p>
                                            <p className="text-xs text-muted-foreground">{e.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{formatCurrency(e.totalRevenue)}</p>
                                        <p className="text-xs text-muted-foreground">{e.totalOrders} órdenes</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
