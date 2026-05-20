"use client";

import { StatusBadge } from "@/components/common";
import type { AiTrainingJob } from "@/types";
import { History, Loader2 } from "lucide-react";

interface RecentTrainingJobsListProps {
    recentJobs?: AiTrainingJob[];
    isLoading: boolean;
    hideHeader?: boolean;
}

export function RecentTrainingJobsList({ recentJobs, isLoading, hideHeader = false }: RecentTrainingJobsListProps) {
    return (
        <div className="space-y-4">
            {!hideHeader && (
                <div className="border-b pb-2">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                        <History className="h-4 w-4 text-muted-foreground" />
                        Trabajos Recientes
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Historial de ejecuciones en el servidor.
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground animate-pulse">Cargando historial...</span>
                </div>
            ) : (
                <div className="divide-y divide-border/60">
                    {recentJobs && recentJobs.length > 0 ? (
                        recentJobs.map((job) => (
                            <div key={job.id} className="py-3 first:pt-0 last:pb-0 hover:bg-muted/5 transition-colors space-y-1.5">
                                <div className="flex items-center justify-between text-xs font-medium">
                                    <span className="font-mono text-muted-foreground">#{job.id.substring(0, 8)}</span>
                                    <StatusBadge
                                        label={
                                            job.status === "Completed" ? "Completado" :
                                            job.status === "Running" ? "En Curso" :
                                            job.status === "Pending" ? "Pendiente" :
                                            job.status === "Failed" ? "Fallido" : "Interrumpido"
                                        }
                                        variant={
                                            job.status === "Completed" ? "success" :
                                            job.status === "Running" ? "warning" :
                                            job.status === "Pending" ? "default" :
                                            job.status === "Failed" ? "destructive" : "default"
                                        }
                                    />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-muted-foreground gap-2">
                                    <span>Iniciado: {new Date(job.startedAt).toLocaleDateString("es-CO")}</span>
                                    {job.resultingVersion && (
                                        <span className="font-semibold text-foreground break-all text-right max-w-[150px]">
                                            Ver: {job.resultingVersion}
                                        </span>
                                    )}
                                </div>
                                {job.statusMessage && (
                                    <p 
                                        className="text-[10px] text-muted-foreground bg-muted/40 border border-muted-foreground/10 p-2 rounded-md font-mono mt-1 block leading-normal break-words line-clamp-2 overflow-hidden text-ellipsis cursor-help"
                                        title={job.statusMessage}
                                    >
                                        {job.statusMessage}
                                    </p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-xs text-muted-foreground">
                            No hay historial de ejecuciones.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
