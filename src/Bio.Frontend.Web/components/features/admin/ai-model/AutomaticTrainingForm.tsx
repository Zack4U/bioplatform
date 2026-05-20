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
                <div className="p-3.5 rounded-lg border bg-yellow-500/10 text-yellow-600 dark:text-yellow-555 flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    <div className="text-xs">
                        <p className="font-semibold">Entrenamiento en Curso</p>
                        <p className="text-muted-foreground mt-0.5">
                            Existe un trabajo con ID <span className="font-mono">{activeJob.id.substring(0, 8)}</span> en estado <span className="font-semibold">{activeJob.status}</span>. Espere a que termine.
                        </p>
                    </div>
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
