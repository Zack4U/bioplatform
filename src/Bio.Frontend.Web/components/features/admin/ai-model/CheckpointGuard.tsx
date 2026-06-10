"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerFooter,
} from "@/components/ui/drawer";
import {
    useValidateModel,
    useActivateModel,
} from "@/hooks/features/admin/useAiModelManagement";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { CnnModelVersion } from "@/types";
import {
    Brain,
    Loader2,
    AlertTriangle,
    RefreshCw,
    ArrowDownRight,
    ArrowUpRight,
    ShieldAlert,
    CheckCircle2,
    Check,
} from "lucide-react";

interface CheckpointGuardProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedModel: CnnModelVersion | null;
    onSuccessActivation: () => void;
}

export function CheckpointGuard({
    isOpen,
    onOpenChange,
    selectedModel,
    onSuccessActivation,
}: CheckpointGuardProps) {
    const isMobile = useIsMobile();
    const [forceBypass, setForceBypass] = useState<boolean>(false);

    const validateMutation = useValidateModel();
    const activateMutation = useActivateModel();

    // Trigger validation when selected model is assigned and modal is opened
    useEffect(() => {
        if (isOpen && selectedModel) {
            setForceBypass(false);
            validateMutation.reset();
            activateMutation.reset();
            validateMutation.mutate({ version: selectedModel.version });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedModel]);

    // Check if accuracy degradation exceeds 5% threshold
    const isDegradationSevere = useMemo(() => {
        if (!validateMutation.data || validateMutation.data.accuracyDrop === null) return false;
        return validateMutation.data.accuracyDrop < -0.05;
    }, [validateMutation.data]);

    const isActivationDisabled = useMemo(() => {
        if (activateMutation.isPending || validateMutation.isPending) return true;
        if (!validateMutation.isSuccess) return true;
        if (isDegradationSevere && !forceBypass) return true;
        return false;
    }, [activateMutation.isPending, validateMutation.isPending, validateMutation.isSuccess, isDegradationSevere, forceBypass]);

    const handleConfirmActivation = () => {
        if (!selectedModel) return;

        activateMutation.mutate(
            { id: selectedModel.id },
            {
                onSuccess: (data) => {
                    if (data.success) {
                        onOpenChange(false);
                        onSuccessActivation();
                    }
                },
            }
        );
    };

    const handleRetryValidation = () => {
        if (selectedModel) {
            validateMutation.mutate({ version: selectedModel.version });
        }
    };

    // Render the internal details of Checkpoint Guard Comparison
    const renderCheckpointGuardBody = () => {
        if (validateMutation.isPending) {
            return (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div className="text-center space-y-1">
                        <p className="font-semibold text-foreground text-sm">Evaluando modelo candidato...</p>
                        <p className="text-xs text-muted-foreground max-w-sm">
                            Ejecutando inferencia sobre 50 imágenes balanceadas del subset de test. Por favor espere.
                        </p>
                    </div>
                    <Progress value={45} className="w-64 h-1 bg-muted animate-pulse" />
                </div>
            );
        }

        if (validateMutation.isError) {
            return (
                <div className="flex flex-col items-center justify-center py-8 space-y-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-semibold text-foreground text-sm">Error de Validación</p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                            No se pudo contactar al motor de IA o los archivos de validación están corruptos.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetryValidation}
                        className="mt-2"
                    >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Reintentar Validación
                    </Button>
                </div>
            );
        }

        if (validateMutation.isSuccess && validateMutation.data) {
            const data = validateMutation.data;
            const accuracyPercent = Math.round(data.accuracy * 100);
            const activeAccPercent = data.currentActiveAccuracy ? Math.round(data.currentActiveAccuracy * 100) : null;
            const dropValue = data.accuracyDrop !== null ? data.accuracyDrop * 100 : 0;
            const hasDrop = dropValue < 0;

            return (
                <div className="space-y-5 py-2">
                    {/* Comparative accurate data blocks */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border bg-muted/20 text-center">
                            <span className="text-xs text-muted-foreground block mb-1">Modelo Activo</span>
                            <span className="text-2xl font-bold">
                                {activeAccPercent !== null ? `${activeAccPercent}%` : "N/A"}
                            </span>
                        </div>
                        <div className="p-4 rounded-lg border bg-primary/5 text-center">
                            <span className="text-xs text-primary block mb-1">Candidato ({data.version})</span>
                            <span className="text-2xl font-bold text-primary">
                                {accuracyPercent}%
                            </span>
                        </div>
                    </div>

                    {/* Change Indicator */}
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                        <span className="text-xs font-medium">Diferencia de Rendimiento:</span>
                        {data.accuracyDrop !== null ? (
                            <div className={`flex items-center font-bold text-xs px-2 py-0.5 rounded-full ${hasDrop ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600"}`}>
                                {hasDrop ? (
                                    <>
                                        <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
                                        {dropValue.toFixed(1)}%
                                    </>
                                ) : (
                                    <>
                                        <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
                                        +{dropValue.toFixed(1)}%
                                    </>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">Primer Modelo</span>
                        )}
                    </div>

                    {/* Checkpoint warnings */}
                    {isDegradationSevere ? (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
                            <div className="flex items-start gap-2.5">
                                <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-destructive">¡Alerta de Degradación Crítica!</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        La precisión de la versión candidata ha caído en más de un 5% respecto al modelo en producción.
                                        Activar este modelo puede causar fallos de clasificación y degradar la experiencia de usuario.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 pt-2 border-t border-destructive/10">
                                <Checkbox
                                    id="bypassCheck"
                                    checked={forceBypass}
                                    onCheckedChange={(checked) => setForceBypass(!!checked)}
                                    className="border-destructive/40 data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground animate-none"
                                />
                                <Label htmlFor="bypassCheck" className="text-xs text-muted-foreground font-medium cursor-pointer">
                                    Entiendo el riesgo y deseo forzar el despliegue del modelo candidato
                                </Label>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-emerald-600">Validación Aprobada</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                    El modelo candidato cumple con los estándares mínimos de consistencia. El despliegue de Pointer Swap se ejecutará en milisegundos con cero caídas de servicio.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    if (!isOpen || !selectedModel) return null;

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onOpenChange}>
                <DrawerContent className="p-6 space-y-6">
                    <DrawerHeader className="p-0 text-left">
                        <DrawerTitle className="text-base font-bold flex items-center gap-2">
                            <Brain className="h-4 w-4 text-primary" />
                            Validación de Checkpoint
                        </DrawerTitle>
                        <DrawerDescription className="text-xs text-muted-foreground">
                            Validando la versión del modelo candidato <span className="font-mono">{selectedModel.version}</span> antes de la activación de Pointer Swap.
                        </DrawerDescription>
                    </DrawerHeader>

                    {renderCheckpointGuardBody()}

                    <DrawerFooter className="p-0 gap-2 pt-4 border-t">
                        <Button
                            onClick={handleConfirmActivation}
                            disabled={isActivationDisabled}
                            className="w-full"
                        >
                            {activateMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Recargando Modelo...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Confirmar e Intercambiar Puntero
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full"
                        >
                            Cancelar
                        </Button>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        Validación de Checkpoint Pre-Activación
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Validando la precisión de la versión candidata <span className="font-mono">{selectedModel.version}</span> frente al modelo en producción.
                    </DialogDescription>
                </DialogHeader>

                {renderCheckpointGuardBody()}

                <DialogFooter className="gap-2 pt-3 border-t mt-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmActivation}
                        disabled={isActivationDisabled}
                    >
                        {activateMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Recargando Modelo...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Confirmar Activación
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
