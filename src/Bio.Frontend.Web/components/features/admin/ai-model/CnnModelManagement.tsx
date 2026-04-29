"use client";

/**
 * CnnModelManagement — AI model version administration.
 */

import { StatCard, StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mockCnnModels } from "@/lib/admin-mock";
import type { CnnModelVersion } from "@/types";
import { Brain, CheckCircle, Cpu, Layers } from "lucide-react";
import { useEffect, useState } from "react";

export function CnnModelManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [models, setModels] = useState<CnnModelVersion[]>([]);

    useEffect(() => { const t = setTimeout(() => { setModels(mockCnnModels()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const active = models.find((m) => m.isActive);

    const handleActivate = (id: number) => {
        setModels((prev) => prev.map((m) => ({ ...m, isActive: m.id === id })));
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><Brain className="h-8 w-8 animate-pulse text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Modelo CNN de Identificacion</h1>
                <p className="text-muted-foreground">Administracion de versiones del modelo de IA para identificacion de especies</p>
            </div>

            {/* Active model card */}
            {active && (
                <Card className="border-primary/30 bg-primary/5">
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" />Modelo Activo</CardTitle></CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <StatCard label="Modelo" value={active.modelName} icon={<Cpu className="h-5 w-5" />} />
                            <StatCard label="Version" value={active.version} icon={<Layers className="h-5 w-5" />} />
                            <StatCard label="Precision" value={`${(active.accuracyMetric * 100).toFixed(1)}%`} icon={<CheckCircle className="h-5 w-5" />} />
                            <StatCard label="Desplegado" value={new Date(active.deployedAt).toLocaleDateString("es-CO")} icon={<Brain className="h-5 w-5" />} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Version history */}
            <Card>
                <CardHeader><CardTitle className="text-base">Historial de Versiones</CardTitle></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Modelo</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Precision</TableHead>
                                <TableHead className="hidden md:table-cell">Desplegado</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {models.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">{m.modelName}</TableCell>
                                    <TableCell><Badge variant="outline">{m.version}</Badge></TableCell>
                                    <TableCell>{(m.accuracyMetric * 100).toFixed(1)}%</TableCell>
                                    <TableCell className="hidden md:table-cell">{new Date(m.deployedAt).toLocaleDateString("es-CO")}</TableCell>
                                    <TableCell><StatusBadge label={m.isActive ? "Activo" : "Inactivo"} variant={m.isActive ? "success" : "default"} /></TableCell>
                                    <TableCell>
                                        {!m.isActive && (
                                            <Button size="sm" variant="outline" onClick={() => handleActivate(m.id)}>Activar</Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {models.length === 0 && <p className="text-center py-8 text-muted-foreground">No hay versiones registradas</p>}
                </CardContent>
            </Card>
        </div>
    );
}
