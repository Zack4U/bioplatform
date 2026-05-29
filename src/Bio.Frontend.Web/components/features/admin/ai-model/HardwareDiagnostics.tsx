"use client";

import { StatusBadge } from "@/components/common";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AiHardwareStatus } from "@/types";
import { Server, ServerCrash, Loader2 } from "lucide-react";

interface HardwareDiagnosticsProps {
    hardware?: AiHardwareStatus;
    isLoading: boolean;
    isError: boolean;
}

export function HardwareDiagnostics({ hardware, isLoading, isError }: HardwareDiagnosticsProps) {
    return (
        <Card className="border shadow-xs">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    Diagnóstico de Hardware
                </CardTitle>
                <CardDescription className="text-xs">
                    Capacidad y estado de GPU en el servidor AI.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground animate-pulse">Obteniendo telemetría...</span>
                    </div>
                ) : isError || !hardware ? (
                    <div className="flex items-start gap-2 text-destructive p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
                        <ServerCrash className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold">Servicio offline</p>
                            <p className="text-slate-400 mt-0.5">
                                No se puede obtener la telemetría del hardware. Asegúrate de que el microservicio FastAPI esté encendido.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Status header */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado de Entrenamiento</span>
                            <StatusBadge
                                label={hardware.canTrainModels ? "Habilitado" : "Inhabilitado"}
                                variant={hardware.canTrainModels ? "success" : "destructive"}
                            />
                        </div>

                        {/* GPU Name */}
                        <div className="py-2 px-3 rounded-lg border bg-muted/20 text-xs flex flex-col gap-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Dispositivo:</span>
                                <span className="font-semibold text-foreground">{hardware.gpuName || "CPU (Sin GPU acelerada)"}</span>
                            </div>
                            
                            {/* Detailed Characteristics */}
                            {(hardware.cudaVersion || hardware.computeCapability || hardware.multiprocessors) && (
                                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1.5 border-t border-muted/50">
                                    {hardware.computeCapability && (
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground">Arquitectura CUDA:</span>
                                            <span className="font-semibold font-mono text-foreground">v{hardware.computeCapability}</span>
                                        </div>
                                    )}
                                    {hardware.cudaVersion && (
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground">Toolkit CUDA:</span>
                                            <span className="font-semibold font-mono text-foreground">v{hardware.cudaVersion}</span>
                                        </div>
                                    )}
                                    {hardware.multiprocessors && (
                                        <div className="flex flex-col col-span-2 pt-1 border-t border-muted/20">
                                            <span className="text-muted-foreground">Procesadores Streaming:</span>
                                            <span className="font-semibold font-mono text-foreground">{hardware.multiprocessors} SMs activos</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* VRAM Progress */}
                        {hardware.hasGpu && hardware.vramTotalGb > 0 && (
                            <div className="space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Memoria VRAM Libre:</span>
                                    <span className="font-bold">
                                        {hardware.vramFreeGb.toFixed(1)} / {hardware.vramTotalGb.toFixed(1)} GB
                                    </span>
                                </div>
                                <Progress
                                    value={(hardware.vramFreeGb / hardware.vramTotalGb) * 100}
                                    className="h-2 bg-muted"
                                />
                            </div>
                        )}

                        {!hardware.canTrainModels && (
                            <p className="text-[11px] text-muted-foreground text-center pt-2 leading-relaxed italic">
                                * El entrenamiento automático se encuentra deshabilitado para evitar asfixiar el procesador por falta de GPU PyTorch CUDA.
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
