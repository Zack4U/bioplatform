"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AiHardwareStatus, AiTrainingJob } from "@/types";
import { Play, Loader2 } from "lucide-react";

interface AutomaticTrainingFormProps {
    hardware?: AiHardwareStatus;
    activeJob?: AiTrainingJob;
    isPending: boolean;
    onSubmit: (params: { epochs: number; learningRate: number; replayBufferRatio: number }) => void;
}

export function AutomaticTrainingForm({ hardware, activeJob, isPending, onSubmit }: AutomaticTrainingFormProps) {
    const [epochs, setEpochs] = useState<number>(15);
    const [learningRate, setLearningRate] = useState<number>(0.001);
    const [replayBufferRatio, setReplayBufferRatio] = useState<number>(0.15);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ epochs, learningRate, replayBufferRatio });
    };

    const isSubmitDisabled = isPending || !hardware?.canTrainModels || !!activeJob;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Play className="h-4 w-4 text-primary" />
                    Configuración de Fine-Tuning
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Ajuste los parámetros del clasificador PyTorch. El orquestador iniciará un warm-start con el estado de Adam y aplicará Replay Buffer.
                </p>
            </div>

            {activeJob && (
                <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 flex flex-col gap-3.5 shadow-xs">
                    <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 animate-spin shrink-0 text-amber-500" />
                        <div className="text-xs">
                            <p className="font-semibold text-foreground">Entrenamiento Automático en Curso</p>
                            <p className="text-muted-foreground mt-0.5">
                                Identificador del trabajo: <span className="font-mono bg-muted/60 px-1 py-0.5 rounded text-[10px]">#{activeJob.id.substring(0, 8)}</span>
                            </p>
                        </div>
                    </div>
                    {activeJob.statusMessage && (
                        <div className="text-[11px] font-mono leading-relaxed bg-black/40 border border-amber-500/10 p-2.5 rounded-md text-slate-300">
                            <span className="text-[9px] font-semibold text-amber-500 block uppercase tracking-wider mb-1">PROGRESO ACTUAL:</span>
                            <span className="inline-block animate-pulse mr-1">▶</span> {activeJob.statusMessage}
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="epochs" className="text-xs font-medium text-foreground uppercase tracking-wider">
                            Épocas de Entrenamiento
                        </Label>
                        <Input
                            id="epochs"
                            type="number"
                            min={1}
                            max={200}
                            value={epochs}
                            onChange={(e) => setEpochs(parseInt(e.target.value) || 15)}
                            className="bg-background border-input"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Recomendado: 10 - 25 épocas para warm-start.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="learningRate" className="text-xs font-medium text-foreground uppercase tracking-wider">
                            Tasa de Aprendizaje (LR)
                        </Label>
                        <select
                            id="learningRate"
                            value={learningRate}
                            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
                        >
                            <option value={0.01}>0.01</option>
                            <option value={0.005}>0.005</option>
                            <option value={0.001}>0.001 (Predeterminado)</option>
                            <option value={0.0005}>0.0005</option>
                            <option value={0.0001}>0.0001</option>
                        </select>
                        <p className="text-[10px] text-muted-foreground">
                            Tasas altas pueden generar pérdida catastrófica. Tasas bajas demoran convergencia.
                        </p>
                    </div>

                    <div className="space-y-2 col-span-1 sm:col-span-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="replayBuffer" className="text-xs font-medium text-foreground uppercase tracking-wider">
                                Proporción de Replay Buffer (Anti-Olvido)
                            </Label>
                            <span className="text-xs font-bold font-mono">
                                {Math.round(replayBufferRatio * 100)}%
                            </span>
                        </div>
                        <Input
                            id="replayBuffer"
                            type="range"
                            min={0.05}
                            max={0.50}
                            step={0.05}
                            value={replayBufferRatio}
                            onChange={(e) => setReplayBufferRatio(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            Porcentaje de muestras históricas mezcladas con nuevas imágenes para prevenir el olvido de clases previas.
                        </p>
                    </div>
                </div>

                <div className="pt-2 border-t flex justify-end">
                    <Button
                        type="submit"
                        disabled={isSubmitDisabled}
                        className="w-full sm:w-auto"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Encolando en Hangfire...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Lanzar Fine-Tuning Automático
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
