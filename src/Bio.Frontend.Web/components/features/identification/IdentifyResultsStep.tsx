/**
 * IdentifyResultsStep — Step 3 of the identification wizard.
 *
 * Displays classification results in a premium layout:
 * - Hero section with confidence ring + species name
 * - Alert banners for low confidence / DB issues
 * - Top 5 predictions with confidence bars
 * - Role-based action panels
 * - Navigation to catalog detail
 *
 * @module components/features/identification/IdentifyResultsStep
 */

"use client";

import { ConfidenceRing } from "@/components/features/identification/ConfidenceRing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/auth-store";
import type { ClassificationResponse, SpeciesPrediction, UserRoleName } from "@/types";
import {
    AlertTriangle,
    ArrowRight,
    BookOpen,
    Database,
    Download,
    ExternalLink,
    FileText,
    Leaf,
    MapPin,
    RefreshCw,
    Save,
    Shield,
    ShieldAlert,
    ShoppingBag,
} from "lucide-react";
import Link from "next/link";

interface IdentifyResultsStepProps {
    result: ClassificationResponse;
    previewUrl: string | null;
    onRetake: () => void;
    topPredictionSlug: string | null;
    topPredictionSpeciesId: string | null;
}

// ── Role-based panel config ──────────────────────────────────────────────────

interface RoleAction {
    label: string;
    icon: React.ReactNode;
    description: string;
    href?: string;
    disabled?: boolean;
    roles: UserRoleName[];
}

const ROLE_ACTIONS: RoleAction[] = [
    {
        label: "Solicitar Revision Taxonomica",
        icon: <BookOpen className="h-4 w-4" aria-hidden="true" />,
        description: "Enviar esta identificacion para revision por un experto taxonomo.",
        roles: ["ADMIN", "RESEARCHER"],
        disabled: true,
    },
    {
        label: "Exportar Datos",
        icon: <Download className="h-4 w-4" aria-hidden="true" />,
        description: "Descargar los datos completos de la prediccion en formato CSV/JSON.",
        roles: ["ADMIN", "RESEARCHER"],
        disabled: true,
    },
    {
        label: "Ver Productos Vinculados",
        icon: <ShoppingBag className="h-4 w-4" aria-hidden="true" />,
        description: "Explorar productos del marketplace derivados de esta especie.",
        href: "/marketplace",
        roles: ["ENTREPRENEUR"],
    },
    {
        label: "Generar Plan de Negocio",
        icon: <FileText className="h-4 w-4" aria-hidden="true" />,
        description: "Crear un plan de biocomercio basado en esta especie con IA generativa.",
        href: "/advisor",
        roles: ["ENTREPRENEUR"],
    },
    {
        label: "Reportar Datos Sensibles",
        icon: <ShieldAlert className="h-4 w-4" aria-hidden="true" />,
        description: "Reportar si esta especie requiere proteccion especial de coordenadas.",
        roles: ["AUTHORITY"],
        disabled: true,
    },
    {
        label: "Verificar Coordenadas",
        icon: <MapPin className="h-4 w-4" aria-hidden="true" />,
        description: "Revisar y validar las coordenadas geograficas de las observaciones.",
        roles: ["AUTHORITY"],
        disabled: true,
    },
];

// ── Component ────────────────────────────────────────────────────────────────

export function IdentifyResultsStep({
    result,
    previewUrl,
    onRetake,
    topPredictionSlug,
    topPredictionSpeciesId,
}: IdentifyResultsStepProps) {
    const { user, isAuthenticated } = useAuthStore();
    const userRoles = user?.roles ?? [];

    const topPred: SpeciesPrediction = result.predictions[0];
    const hasDbData = topPred.speciesData?.foundInDb ?? false;

    // Filter role actions visible to the current user
    const visibleActions = isAuthenticated
        ? ROLE_ACTIONS.filter((action) =>
              action.roles.some((role) => userRoles.includes(role)),
          )
        : [];

    // Build catalog link
    const catalogHref = topPredictionSlug
        ? `/catalog/${topPredictionSlug}`
        : topPredictionSpeciesId
          ? `/catalog/${topPredictionSpeciesId}`
          : null;

    return (
        <div className="mx-auto w-full max-w-4xl space-y-6">
            {/* ── Hero Section ─────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl border bg-card">
                {/* Background image */}
                {previewUrl && (
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-15"
                        style={{ backgroundImage: `url(${previewUrl})` }}
                    />
                )}

                <div className="relative flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8">
                    {/* Confidence ring */}
                    <ConfidenceRing
                        value={topPred.confidence}
                        size={140}
                        strokeWidth={7}
                        className="shrink-0"
                    />

                    {/* Species info */}
                    <div className="flex flex-1 flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                                Especie Identificada
                            </p>
                            <h2 className="mt-1 text-2xl font-bold">
                                {topPred.speciesData?.commonName ?? topPred.species}
                            </h2>
                            <p className="text-base italic text-muted-foreground">
                                {topPred.species}
                            </p>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            {topPred.taxonomy?.family && (
                                <Badge variant="secondary" className="gap-1.5">
                                    <Leaf
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                    />
                                    {topPred.taxonomy.family}
                                </Badge>
                            )}
                            {topPred.taxonomy?.kingdom && (
                                <Badge variant="outline" className="gap-1.5">
                                    {topPred.taxonomy.kingdom}
                                </Badge>
                            )}
                            <Badge variant="outline" className="gap-1.5">
                                <MapPin
                                    className="h-3 w-3"
                                    aria-hidden="true"
                                />
                                Caldas, CO
                            </Badge>
                            {topPred.speciesData?.conservationStatus && (
                                <Badge variant="secondary" className="gap-1.5">
                                    <Shield
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                    />
                                    {topPred.speciesData.conservationStatus}
                                </Badge>
                            )}
                            {hasDbData && (
                                <Badge
                                    variant="outline"
                                    className="gap-1.5 border-green-500/50 text-green-600 dark:text-green-400"
                                >
                                    <Database
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                    />
                                    En base de datos
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Alerts ───────────────────────────────────────────────── */}
            {result.confidenceAlert && (
                <div
                    className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
                    role="alert"
                >
                    <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                        aria-hidden="true"
                    />
                    <p className="text-sm text-destructive">
                        {result.confidenceAlert}
                    </p>
                </div>
            )}

            {topPred.lowConfidenceAlert && !result.confidenceAlert && (
                <div
                    className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3"
                    role="alert"
                >
                    <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                        aria-hidden="true"
                    />
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                        {topPred.lowConfidenceAlert}
                    </p>
                </div>
            )}

            {topPred.speciesData?.dbAlert && (
                <div className="flex items-start gap-3 rounded-xl border bg-muted px-4 py-3">
                    <AlertTriangle
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                    />
                    <p className="text-sm text-muted-foreground">
                        {topPred.speciesData.dbAlert}
                    </p>
                </div>
            )}

            {/* ── Action Buttons (below header for accessibility) ────── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                {catalogHref && (
                    <Button
                        size="lg"
                        className="gap-3 rounded-xl px-8"
                        asChild
                    >
                        <Link href={catalogHref}>
                            <ExternalLink
                                className="h-5 w-5"
                                aria-hidden="true"
                            />
                            Ver en Catalogo
                        </Link>
                    </Button>
                )}

                <Button
                    size="lg"
                    variant="outline"
                    className="gap-3 rounded-xl px-8"
                    disabled
                >
                    <Save className="h-5 w-5" aria-hidden="true" />
                    Guardar para revision
                </Button>

                <Button
                    size="lg"
                    variant="ghost"
                    className="gap-3 rounded-xl px-8"
                    onClick={onRetake}
                >
                    <RefreshCw className="h-5 w-5" aria-hidden="true" />
                    Nueva Identificacion
                </Button>
            </div>

            {/* ── Top 5 Predictions ────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Top {Math.min(result.predictions.length, 5)} Predicciones
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 pb-4">
                    {result.predictions.slice(0, 5).map((pred, i) => (
                        <div
                            key={`pred-${pred.rank}`}
                            className={`flex items-center gap-4 py-3 ${
                                i < Math.min(result.predictions.length, 5) - 1
                                    ? "border-b"
                                    : ""
                            }`}
                        >
                            {/* Rank badge */}
                            <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                    i === 0
                                        ? "bg-primary/15 text-primary"
                                        : "bg-muted text-muted-foreground"
                                }`}
                            >
                                {pred.rank}
                            </div>

                            {/* Species name */}
                            <span
                                className={`min-w-0 flex-1 truncate text-sm ${
                                    i === 0
                                        ? "font-semibold"
                                        : ""
                                }`}
                            >
                                {pred.species}
                            </span>

                            {/* Confidence bar + percentage */}
                            <div className="flex w-28 items-center gap-2 sm:w-40">
                                <Progress
                                    value={pred.confidence * 100}
                                    className="h-1.5 flex-1"
                                />
                                <span className="w-12 text-right text-xs font-medium text-muted-foreground">
                                    {(pred.confidence * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* ── Role-Based Actions ───────────────────────────────────── */}
            {visibleActions.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            Acciones Avanzadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                        {visibleActions.map((action) => (
                            <div
                                key={action.label}
                                className="flex flex-col gap-2 rounded-xl border p-4"
                            >
                                <div className="flex items-center gap-2">
                                    {action.icon}
                                    <span className="text-sm font-medium">
                                        {action.label}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {action.description}
                                </p>
                                {action.href ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        asChild
                                        className="mt-1 self-start"
                                    >
                                        <Link href={action.href}>
                                            Ir
                                            <ArrowRight
                                                className="ml-1 h-3 w-3"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={action.disabled}
                                        className="mt-1 self-start"
                                    >
                                        {action.disabled
                                            ? "Proximamente"
                                            : action.label}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* ── Model Info Footer ────────────────────────────────────── */}
            <div className="text-center">
                <p className="text-xs text-muted-foreground">
                    Modelo: {result.model} - {result.numClasses} clases disponibles
                </p>
            </div>
        </div>
    );
}
