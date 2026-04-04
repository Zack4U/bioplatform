/**
 * SpeciesInfoCard — taxonomy and classification card for species detail.
 *
 * Displays full taxonomy in a grid layout with badges for conservation
 * status, legal status, and sensitivity information.
 *
 * UI ONLY — receives data via props.
 */

"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatConservationStatus } from "@/lib/formatters";
import type { SpeciesDetail } from "@/types/species";
import { Crown, FileCheck, Fingerprint, Scale, TreePine } from "lucide-react";

interface SpeciesInfoCardProps {
    species: SpeciesDetail;
}

/* ─── Taxonomy row component ──────────────────────────────────────────── */

function TaxonomyRow({
    label,
    value,
}: {
    label: string;
    value: string | null;
}) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            <span className="text-sm font-medium text-foreground">
                {value ?? "—"}
            </span>
        </div>
    );
}

export function SpeciesInfoCard({ species }: SpeciesInfoCardProps) {
    const taxonomy = species.taxonomy;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Fingerprint className="h-4 w-4 text-primary" />
                    Clasificación Taxonómica
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* ── Taxonomy grid ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <TaxonomyRow label="Reino" value={taxonomy?.kingdom ?? null} />
                    <TaxonomyRow label="Filo" value={taxonomy?.phylum ?? null} />
                    <TaxonomyRow label="Clase" value={taxonomy?.className ?? null} />
                    <TaxonomyRow label="Orden" value={taxonomy?.orderName ?? null} />
                    <TaxonomyRow label="Familia" value={taxonomy?.family ?? null} />
                    <TaxonomyRow label="Género" value={taxonomy?.genus ?? null} />
                </div>

                <Separator />

                {/* ── Status badges ───────────────────────────────────────── */}
                <div className="flex flex-wrap gap-3">
                    {species.conservationStatus && (
                        <div className="flex items-center gap-2">
                            <TreePine className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Estado de Conservación
                                </span>
                                <Badge variant="outline" className="mt-0.5 w-fit text-xs">
                                    {formatConservationStatus(species.conservationStatus)}
                                </Badge>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                Estatus Legal
                            </span>
                            <Badge
                                variant={species.legalStatus ? "default" : "secondary"}
                                className="mt-0.5 w-fit text-xs"
                            >
                                {species.legalStatus ? "Regulado" : "Sin regulación"}
                            </Badge>
                        </div>
                    </div>

                    {species.isSensitive && (
                        <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Sensibilidad
                                </span>
                                <Badge
                                    variant="destructive"
                                    className="mt-0.5 w-fit gap-1 text-xs"
                                >
                                    <FileCheck className="h-3 w-3" />
                                    Datos Protegidos
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
