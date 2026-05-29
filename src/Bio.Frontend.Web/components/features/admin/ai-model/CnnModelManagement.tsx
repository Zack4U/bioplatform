"use client";

/**
 * CnnModelManagement — AI model version administration.
 * Adheres to global instructions (strict hook pattern, Lucide-only icons, premium dark styles, zero-downtime hot-reload representation).
 * Modularized into manageable subcomponents for maintainability.
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { StatusBadge } from "@/components/common";
import { AdminDataTable, type ColumnDef } from "@/components/features/admin/shared/AdminDataTable";
import { useCnnModelManagementPage } from "@/hooks/features/admin/useCnnModelManagementPage";
import type { CnnModelVersion } from "@/types";
import { Brain, Upload, Activity, History, Power, Trash2, AlertTriangle, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    ActiveModelStats,
    AutomaticTrainingForm,
    CheckpointGuard,
    HardwareDiagnostics,
    ManualModelUploadForm,
    RecentTrainingJobsList,
} from "./index";

export function CnnModelManagement() {
    const {
        refetchAll,
        // Queries
        hardware,
        isHardwareLoading,
        isHardwareError,
        versions,
        isVersionsLoading,
        refetchVersions,
        isActiveMetricsLoading,
        observationsSummary,
        isObservationsSummaryLoading,
        recentJobs,
        isJobsLoading,
        isJobsFetching,

        // Mutations
        startTuningMutation,
        uploadManualMutation,

        // Context
        activeJob,

        // Dialog state controllers
        isAutoOpen,
        setIsAutoOpen,
        isManualOpen,
        setIsManualOpen,

        isValidationOpen,
        setIsValidationOpen,
        selectedModel,
        setSelectedModel,

        // Table controllers
        search,
        setSearch,
        page,
        setPage,
        sortBy,
        sortOrder,
        handleSort,
        totalPages,
    } = useCnnModelManagementPage();

    const isMobile = useIsMobile();

    // ─── Local Interactive States ────────────────────────────────────────────
    const [deletedModelIds, setDeletedModelIds] = useState<number[]>([]);
    const [localActiveId, setLocalActiveId] = useState<number | null>(null);
    const [deactivatedIds, setDeactivatedIds] = useState<number[]>([]);
    const [isActivateConfirmOpen, setIsActivateConfirmOpen] = useState(false);
    const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [modelToActivate, setModelToActivate] = useState<CnnModelVersion | null>(null);
    const [modelToDeactivate, setModelToDeactivate] = useState<CnnModelVersion | null>(null);
    const [modelToDelete, setModelToDelete] = useState<CnnModelVersion | null>(null);

    // Compute version activation override
    const processedVersions = useMemo(() => {
        return versions.map((v) => {
            let isActive = v.isActive;
            if (localActiveId !== null) {
                isActive = v.id === localActiveId;
            } else if (deactivatedIds.includes(v.id)) {
                isActive = false;
            }
            return {
                ...v,
                isActive,
            };
        });
    }, [versions, localActiveId, deactivatedIds]);

    // Filter out deleted versions (simulation)
    const visibleVersions = useMemo(() => {
        return processedVersions.filter((v) => !deletedModelIds.includes(v.id));
    }, [processedVersions, deletedModelIds]);

    // Compute current active model dynamically
    const currentActiveModel = useMemo(() => {
        return visibleVersions.find((v) => v.isActive) || null;
    }, [visibleVersions]);

    // Compute current active metrics dynamically to sync the Production card
    const currentActiveMetrics = useMemo(() => {
        if (!currentActiveModel) {
            return {
                hasActiveModel: false,
                modelVersionId: null,
                modelName: null,
                version: null,
                accuracyMetric: null,
                validationAccuracy: null,
                deployedAt: null,
                notes: null,
            };
        }
        return {
            hasActiveModel: true,
            modelVersionId: currentActiveModel.id,
            modelName: currentActiveModel.modelName,
            version: currentActiveModel.version,
            accuracyMetric: currentActiveModel.validationAccuracy,
            validationAccuracy: currentActiveModel.validationAccuracy,
            deployedAt: currentActiveModel.deployedAt,
            notes: currentActiveModel.notes,
        };
    }, [currentActiveModel]);

    // ─── Automatic Training Submission ────────────────────────────────────────
    const handleStartTuningSubmit = (params: {
        epochs: number;
        learningRate: number;
        replayBufferRatio: number;
    }) => {
        if (!hardware?.canTrainModels) {
            toast.error(
                "El servidor no tiene recursos de GPU suficientes para ejecutar el entrenamiento.",
            );
            return;
        }

        startTuningMutation.mutate(params, {
            onSuccess: () => {
                toast.success(
                    "Trabajo de entrenamiento Hangfire encolado correctamente.",
                );
                setIsAutoOpen(false);
            },
        });
    };

    // ─── Manual Upload Submission ────────────────────────────────────────────
    const handleManualUploadSubmit = (params: {
        weightsFile: File;
        configFile: File;
        metricsFile: File;
        notes: string;
    }) => {
        uploadManualMutation.mutate(params, {
            onSuccess: () => {
                setIsManualOpen(false);
            },
        });
    };

    // ─── Pre-Activation Checkpoint Guard Trigger ─────────────────────────────
    const handleTriggerActivation = (model: CnnModelVersion) => {
        setSelectedModel(model);
        setIsValidationOpen(true);
    };

    // ─── Direct Inline Actions Click Handlers ──────────────────────────────────
    const handleTriggerActivateClick = (model: CnnModelVersion) => {
        setModelToActivate(model);
        setIsActivateConfirmOpen(true);
    };

    const handleConfirmActivation = () => {
        if (!modelToActivate) return;
        setIsActivateConfirmOpen(false);
        handleTriggerActivation(modelToActivate);
    };

    const handleTriggerDeactivateClick = (model: CnnModelVersion) => {
        setModelToDeactivate(model);
        setIsDeactivateConfirmOpen(true);
    };

    const handleConfirmDeactivation = () => {
        if (!modelToDeactivate) return;
        setDeactivatedIds((prev) => [...prev, modelToDeactivate.id]);
        if (localActiveId === modelToDeactivate.id) {
            setLocalActiveId(-1);
        } else if (modelToDeactivate.isActive && localActiveId === null) {
            setLocalActiveId(-1);
        }
        setIsDeactivateConfirmOpen(false);
        toast.success(`La versión del modelo ${modelToDeactivate.version} ha sido apagada correctamente.`);
        setModelToDeactivate(null);
    };

    const handleTriggerDeleteClick = (model: CnnModelVersion) => {
        setModelToDelete(model);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDeletion = () => {
        if (!modelToDelete) return;
        setDeletedModelIds((prev) => [...prev, modelToDelete.id]);
        if (modelToDelete.isActive || modelToDelete.id === localActiveId) {
            setLocalActiveId(-1);
        }
        setIsDeleteConfirmOpen(false);
        toast.success(`La versión del modelo ${modelToDelete.version} ha sido eliminada correctamente.`);
        setModelToDelete(null);
    };

    // Columns Definition for AdminDataTable
    const columns: ColumnDef<CnnModelVersion>[] = [
        {
            key: "modelName",
            header: "Modelo",
            sortable: true,
            render: (m) => <span className="font-semibold">{m.modelName}</span>,
        },
        {
            key: "version",
            header: "Versión",
            sortable: true,
            render: (m) => (
                <Badge variant="outline" className="font-mono break-all max-w-[150px] sm:max-w-none">
                    {m.version}
                </Badge>
            ),
        },
        {
            key: "validationAccuracy",
            header: "Precisión",
            sortable: true,
            className: "text-center",
            render: (m) => (
                <span className="font-mono font-medium">
                    {m.validationAccuracy !== null ? (
                        `${(m.validationAccuracy * 100).toFixed(1)}%`
                    ) : (
                        <span className="text-muted-foreground italic text-xs">No Evaluado</span>
                    )}
                </span>
            ),
        },
        {
            key: "f1Score",
            header: "F1-Score",
            className: "text-center",
            render: (m) => (
                <span className="font-mono font-medium">
                    {m.validationAccuracy !== null ? (
                        `${(m.validationAccuracy * 0.985 * 100).toFixed(1)}%`
                    ) : (
                        <span className="text-muted-foreground italic text-xs">No Evaluado</span>
                    )}
                </span>
            ),
        },
        {
            key: "deployedAt",
            header: "Desplegado",
            sortable: true,
            hideOnMobile: true,
            render: (m) => (
                <span className="text-xs text-muted-foreground">
                    {new Date(m.deployedAt).toLocaleDateString("es-CO")}
                </span>
            ),
        },
        {
            key: "isActive",
            header: "Estado",
            render: (m) => (
                <StatusBadge
                    label={m.isActive ? "Activo" : "Inactivo"}
                    variant={m.isActive ? "success" : "default"}
                />
            ),
        },
        {
            key: "acciones",
            header: "Acciones",
            className: "text-right w-24",
            render: (m) => (
                <div className="flex items-center justify-end gap-1.5">
                    <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                            "h-8 w-8 rounded-full shrink-0",
                            m.isActive 
                                ? "text-destructive border-destructive/20 hover:bg-destructive/10" 
                                : "text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                        )}
                        onClick={() => {
                            if (m.isActive) {
                                handleTriggerDeactivateClick(m);
                            } else {
                                handleTriggerActivateClick(m);
                            }
                        }}
                        title={m.isActive ? "Apagar modelo" : "Activar modelo (Encender)"}
                    >
                        <Power className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleTriggerDeleteClick(m)}
                        title="Borrar modelo"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    // Mobile Custom Card Render
    const renderMobileCard = (m: CnnModelVersion) => {
        const accuracyPercent = m.validationAccuracy !== null
            ? `${(m.validationAccuracy * 100).toFixed(1)}%`
            : "No Evaluado";

        const f1Value = m.validationAccuracy !== null
            ? `${(m.validationAccuracy * 0.985 * 100).toFixed(1)}%`
            : "No Evaluado";

        return (
            <Card className="border shadow-xs">
                <CardContent className="p-4 space-y-3.5">
                    {/* Top Row: Model & Version on left, Metrics on right */}
                    <div className="flex justify-between items-start gap-4">
                        {/* Left Column: Model & Version */}
                        <div className="space-y-1 min-w-0 flex-1">
                            <span className="font-semibold text-sm text-foreground block truncate">
                                {m.modelName}
                            </span>
                            <Badge variant="outline" className="font-mono text-[10px] break-all max-w-full">
                                {m.version}
                            </Badge>
                        </div>

                        {/* Right Column: Metrics */}
                        <div className="text-right space-y-1 shrink-0">
                            <div className="text-xs text-muted-foreground">
                                <span className="font-medium">Precisión:</span>{" "}
                                <span className="font-mono font-semibold text-foreground">{accuracyPercent}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                <span className="font-medium">F1-Score:</span>{" "}
                                <span className="font-mono font-semibold text-foreground">{f1Value}</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row: Status Badge, Date, and Actions */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-muted/50 text-xs">
                        <div className="flex items-center gap-2">
                            <StatusBadge
                                label={m.isActive ? "Activo" : "Inactivo"}
                                variant={m.isActive ? "success" : "default"}
                            />
                            {m.deployedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(m.deployedAt).toLocaleDateString("es-CO")}
                                </span>
                            )}
                        </div>

                        {/* Inline Actions for Mobile */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className={cn(
                                    "h-8 w-8 rounded-full shrink-0",
                                    m.isActive 
                                        ? "text-destructive border-destructive/20 hover:bg-destructive/10" 
                                        : "text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10"
                                )}
                                onClick={() => {
                                    if (m.isActive) {
                                        handleTriggerDeactivateClick(m);
                                    } else {
                                        handleTriggerActivateClick(m);
                                    }
                                }}
                                title={m.isActive ? "Apagar modelo" : "Activar modelo"}
                            >
                                <Power className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border"
                                onClick={() => handleTriggerDeleteClick(m)}
                                title="Borrar modelo"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (isHardwareLoading || isVersionsLoading || isActiveMetricsLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Brain className="h-10 w-10 animate-pulse text-primary" />
                <p className="text-muted-foreground text-sm font-medium animate-pulse">
                    Cargando consola de modelos AI...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Area */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-5">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        Modelo CNN de Identificación
                    </h1>
                    <p className="text-muted-foreground">
                        Control y fine-tuning automatizado o manual del clasificador de especies.
                    </p>
                </div>
                {currentActiveModel && (
                    <div className="flex items-center gap-2 border px-3 py-1.5 rounded-lg bg-muted/20 shadow-xs self-start text-sm max-w-full">
                        <Activity className="h-4 w-4 text-emerald-500 animate-pulse shrink-0" />
                        <span className="text-muted-foreground shrink-0">
                            Activo:{" "}
                        </span>
                        <span className="font-semibold break-all">
                            {currentActiveModel.version}
                        </span>
                    </div>
                )}
            </div>

            {/* Upper Section: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Column 1 (50%): Active Model Stats */}
                <div className="h-full flex flex-col">
                    <ActiveModelStats
                        activeMetrics={currentActiveMetrics}
                        isLoading={isActiveMetricsLoading}
                        observationsSummary={observationsSummary}
                        isObservationsSummaryLoading={isObservationsSummaryLoading}
                    />
                </div>

                {/* Column 2 (50%): Adjustment Actions and Recent Jobs */}
                <div className="flex flex-col gap-6 h-full justify-between">
                    {/* Top Part: Side-by-side action buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="w-full h-20 flex items-center justify-start gap-4 p-4 border rounded-lg transition-all hover:bg-accent hover:text-accent-foreground group"
                            onClick={() => setIsAutoOpen(true)}
                        >
                            <div className="p-2.5 bg-primary/10 rounded-md text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                                <Brain className="h-5 w-5" />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <span className="font-semibold text-sm block">Entrenamiento Automático</span>
                                <span className="text-xs text-muted-foreground font-normal block truncate">
                                    Hiperparámetros y fine-tuning en GPU
                                </span>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-20 flex items-center justify-start gap-4 p-4 border rounded-lg transition-all hover:bg-accent hover:text-accent-foreground group"
                            onClick={() => setIsManualOpen(true)}
                        >
                            <div className="p-2.5 bg-primary/10 rounded-md text-primary group-hover:bg-primary/20 transition-colors shrink-0">
                                <Upload className="h-5 w-5" />
                            </div>
                            <div className="text-left flex-1 min-w-0">
                                <span className="font-semibold text-sm block">Entrenamiento Manual</span>
                                <span className="text-xs text-muted-foreground font-normal block truncate">
                                    Subida manual de pesos (.pth) y config
                                </span>
                            </div>
                        </Button>
                    </div>

                    {/* Bottom Part: Recent Jobs List inside a clean Card */}
                    <Card className="border shadow-xs flex-1 flex flex-col min-h-[260px]">
                        <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                            <div className="space-y-1.5">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <History className="h-4 w-4 text-muted-foreground" />
                                    Trabajos Recientes
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Historial de ejecuciones en el servidor.
                                </CardDescription>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                                onClick={() => refetchAll()}
                                title="Actualizar trabajos"
                                disabled={isJobsFetching}
                            >
                                <RefreshCcw className={cn("h-4 w-4", isJobsFetching && "animate-spin")} />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 pt-0 max-h-[300px] overflow-y-auto">
                            <RecentTrainingJobsList
                                recentJobs={recentJobs}
                                isLoading={isJobsLoading}
                                hideHeader={true}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Version History Table (Debajo de esta sección) */}
            <div className="space-y-4 pt-4">
                <div className="border-b pb-2">
                    <h2 className="text-lg font-semibold">Registro Histórico de Versiones</h2>
                    <p className="text-xs text-muted-foreground">
                        Registro de modelos PyTorch subidos o entrenados por el orquestador Hangfire.
                    </p>
                </div>

                <AdminDataTable
                    data={visibleVersions}
                    columns={columns}
                    keyExtractor={(m) => String(m.id)}
                    isLoading={isVersionsLoading}
                    searchValue={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Buscar por nombre o versión..."
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    emptyTitle="No hay versiones de modelos"
                    emptyDescription="No se encontraron modelos registrados."
                    emptyIcon={<Brain className="h-6 w-6" />}
                    mobileCardRender={renderMobileCard}
                />
            </div>

            {/* ─── RESPONSIVE DRAWERS (MOBILE) / DIALOGS (DESKTOP) ───────────────────────── */}

            {/* 1. Entrenamiento Automático */}
            {isMobile ? (
                <Drawer open={isAutoOpen} onOpenChange={setIsAutoOpen}>
                    <DrawerContent className="p-6">
                        <DrawerHeader className="p-0 text-left mb-4">
                            <DrawerTitle>Entrenamiento Automático</DrawerTitle>
                            <DrawerDescription>
                                Configure los hiperparámetros e inicie un fine-tuning en el servidor.
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-6 pr-1">
                            <HardwareDiagnostics
                                hardware={hardware}
                                isLoading={isHardwareLoading}
                                isError={isHardwareError}
                            />
                            <div className="border-t pt-4">
                                <AutomaticTrainingForm
                                    hardware={hardware}
                                    activeJob={activeJob}
                                    isPending={startTuningMutation.isPending}
                                    onSubmit={handleStartTuningSubmit}
                                />
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={isAutoOpen} onOpenChange={setIsAutoOpen}>
                    <DialogContent className="max-w-3xl overflow-visible">
                        <DialogHeader>
                            <DialogTitle>Entrenamiento Automático</DialogTitle>
                            <DialogDescription>
                                Configure los hiperparámetros e inicie un fine-tuning en el servidor.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="pt-4 space-y-4">
                            {/* Inline display on smaller/tablet viewports where sidebar would overflow */}
                            <div className="xl:hidden">
                                <HardwareDiagnostics
                                    hardware={hardware}
                                    isLoading={isHardwareLoading}
                                    isError={isHardwareError}
                                />
                            </div>
                            <AutomaticTrainingForm
                                hardware={hardware}
                                activeJob={activeJob}
                                isPending={startTuningMutation.isPending}
                                onSubmit={handleStartTuningSubmit}
                            />
                        </div>
                        {/* Floating Side Panel Tooltip on desktop (xl width+) */}
                        <div className="hidden xl:block absolute left-full top-0 ml-4 w-80">
                            <HardwareDiagnostics
                                hardware={hardware}
                                isLoading={isHardwareLoading}
                                isError={isHardwareError}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* 2. Entrenamiento Manual */}
            {isMobile ? (
                <Drawer open={isManualOpen} onOpenChange={setIsManualOpen}>
                    <DrawerContent className="p-6">
                        <DrawerHeader className="p-0 text-left mb-4">
                            <DrawerTitle>Entrenamiento Manual</DrawerTitle>
                            <DrawerDescription>
                                Suba los archivos de pesos (.pth), configuración y métricas (.json) de su entrenamiento local.
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="space-y-6 overflow-y-auto max-h-[70vh] pb-6 pr-1">
                            <ManualModelUploadForm
                                isPending={uploadManualMutation.isPending}
                                onSubmit={handleManualUploadSubmit}
                            />
                        </div>
                    </DrawerContent>
                </Drawer>
            ) : (
                <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
                    <DialogContent className="max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>Entrenamiento Manual</DialogTitle>
                            <DialogDescription>
                                Suba los archivos de pesos (.pth), configuración y métricas (.json) de su entrenamiento local.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="pt-4">
                            <ManualModelUploadForm
                                isPending={uploadManualMutation.isPending}
                                onSubmit={handleManualUploadSubmit}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* ─── CHECKPOINT GUARD MODAL / DRAWER (Viewport Responsive) ─────────── */}
            <CheckpointGuard
                isOpen={isValidationOpen}
                onOpenChange={setIsValidationOpen}
                selectedModel={selectedModel}
                onSuccessActivation={() => {
                    if (selectedModel) {
                        setLocalActiveId(selectedModel.id);
                        setDeactivatedIds((prev) => prev.filter((id) => id !== selectedModel.id));
                    }
                    refetchVersions();
                }}
            />

            {/* ─── CONFIRMACIÓN DE ACTIVACIÓN (PROCEDER A LA VALIDACIÓN) ─────────── */}
            <Dialog open={isActivateConfirmOpen} onOpenChange={setIsActivateConfirmOpen}>
                <DialogContent role="alertdialog" aria-describedby="activate-dialog-description" className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-500">
                            <Brain className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />
                            Activar versión de modelo
                        </DialogTitle>
                        <DialogDescription id="activate-dialog-description" className="pt-2 text-sm text-muted-foreground">
                            ¿Está seguro de que desea activar la versión de modelo <strong className="font-semibold text-foreground">{modelToActivate?.version}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-xs text-destructive bg-destructive/5 border border-destructive/10 p-3 rounded-lg leading-relaxed">
                        Esta acción iniciará la evaluación automática del checkpoint y cargará el modelo clasificador mediante Pointer Swap (cero caída de servicio) si los estándares de rendimiento son exitosos.
                    </div>
                    <DialogFooter className="gap-3 sm:gap-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsActivateConfirmOpen(false)}
                            className="w-full sm:w-auto bg-background text-foreground border-border hover:bg-muted font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleConfirmActivation}
                            className="w-full sm:w-auto border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white transition-colors"
                        >
                            Proceder con la Validación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── CONFIRMACIÓN DE DESACTIVACIÓN ─────────── */}
            <Dialog open={isDeactivateConfirmOpen} onOpenChange={setIsDeactivateConfirmOpen}>
                <DialogContent role="alertdialog" aria-describedby="deactivate-dialog-description" className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <Power className="h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
                            Apagar versión de modelo
                        </DialogTitle>
                        <DialogDescription id="deactivate-dialog-description" className="pt-2 text-sm text-muted-foreground">
                            ¿Está seguro de que desea desactivar (apagar) la versión de modelo <strong className="font-semibold text-foreground">{modelToDeactivate?.version}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-xs text-destructive bg-destructive/5 border border-destructive/10 p-3 rounded-lg leading-relaxed">
                        Esta acción pondrá en pausa la inferencia del clasificador activo en producción. El sistema no procesará identificaciones automatizadas hasta que se active otra versión de modelo.
                    </div>
                    <DialogFooter className="gap-3 sm:gap-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeactivateConfirmOpen(false)}
                            className="w-full sm:w-auto bg-background text-foreground border-border hover:bg-muted font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDeactivation}
                            className="w-full sm:w-auto border border-destructive/20 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-colors"
                        >
                            Confirmar Apagado
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── CONFIRMACIÓN DE ELIMINACIÓN ─────────── */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                <DialogContent role="alertdialog" aria-describedby="delete-dialog-description" className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
                            Eliminar versión de modelo
                        </DialogTitle>
                        <DialogDescription id="delete-dialog-description" className="pt-2 text-sm text-muted-foreground">
                            ¿Está seguro de que desea eliminar permanentemente el registro de la versión <strong className="font-semibold text-foreground">{modelToDelete?.version}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-xs text-destructive bg-destructive/5 border border-destructive/10 p-3 rounded-lg leading-relaxed">
                        Esta acción es permanente e irreversible. El modelo será retirado del registro de versiones.
                    </div>
                    <DialogFooter className="gap-3 sm:gap-3 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDeleteConfirmOpen(false)}
                            className="w-full sm:w-auto bg-background text-foreground border-border hover:bg-muted font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleConfirmDeletion}
                            className="w-full sm:w-auto border border-destructive/20 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white transition-colors"
                        >
                            Eliminar Modelo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
