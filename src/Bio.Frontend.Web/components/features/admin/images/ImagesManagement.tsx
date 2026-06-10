"use client";
/**
 * ImagesManagement — species images with validate/reject. Scoped to species.
 * Accepts ?speciesId= and ?speciesName= from URL query params.
 * If no speciesId in URL, shows a species search combobox to select one.
 */
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { Image as ImageIcon, Check, Info, X, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useSpeciesImagesList, useValidateImage, useRejectImage } from "@/hooks/features/admin/useImagesManagement";
import { useHasRole } from "@/hooks/features/auth";
import { SpeciesSearchCombobox } from "@/components/features/admin/shared/SpeciesSearchCombobox";
import type { SpeciesImage } from "@/types/species";
import type { SpeciesAdminItem } from "@/types/admin";

export function ImagesManagement() {
    const searchParams = useSearchParams();
    const speciesIdParam = searchParams.get("speciesId");
    const speciesNameParam = searchParams.get("speciesName");
    const router = useRouter();

    const [selectedSpecies, setSelectedSpecies] = useState<SpeciesAdminItem | null>(null);
    const [validationFilter, setValidationFilter] = useState<"all" | "validated" | "pending">("all");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<SpeciesImage | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const pageSize = 12;

    const speciesId = speciesIdParam ?? selectedSpecies?.id ?? null;
    const speciesName = speciesNameParam ?? selectedSpecies?.scientificName ?? null;

    const onlyValidated = validationFilter === "validated" ? true : validationFilter === "pending" ? false : undefined;

    const { data, isLoading } = useSpeciesImagesList(speciesId, {
        onlyValidatedByExpert: onlyValidated,
        page,
        pageSize,
    });

    // Researchers, Admins, and Authorities can moderate images.
    const isAdmin = useHasRole("ADMIN");
    const isAuthority = useHasRole("AUTHORITY");
    const isResearcher = useHasRole("RESEARCHER");
    const canModerate = isAdmin || isAuthority || isResearcher;

    const validateImage = useValidateImage(speciesId ?? "");
    const rejectImage = useRejectImage(speciesId ?? "");

    const images = data?.items ?? [];
    const totalPages = data?.totalPages ?? 1;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-4">
                {speciesId && (
                    <Button variant="ghost" size="sm" onClick={() => {
                        if (speciesIdParam) { router.back(); } else { setSelectedSpecies(null); }
                    }}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                    </Button>
                )}
                <div className="flex-1">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestión de Imágenes</h1>
                    {speciesId ? (
                        <p className="text-muted-foreground italic">{decodeURIComponent(speciesName ?? speciesId)}</p>
                    ) : (
                        <p className="text-muted-foreground">Validación de imágenes por especie</p>
                    )}
                </div>
            </div>

            {/* Species selector when no speciesId from URL */}
            {!speciesIdParam && (
                <div className="max-w-md">
                    <p className="text-sm font-medium mb-1.5">Seleccionar especie</p>
                    <SpeciesSearchCombobox
                        value={selectedSpecies?.id ?? ""}
                        onChange={(id) => { if (!id) setSelectedSpecies(null); }}
                        onSpeciesSelect={(sp) => { setSelectedSpecies(sp); setPage(1); }}
                        placeholder="Buscar especie para ver imágenes..."
                        clearable
                    />
                </div>
            )}

            {/* No species selected */}
            {!speciesIdParam && !selectedSpecies && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Selecciona una especie para ver y gestionar sus imágenes.
                    </AlertDescription>
                </Alert>
            )}

            {/* Filters */}
            {speciesId && (
                <div className="flex items-center gap-3">
                    <Select value={validationFilter} onValueChange={(v) => { setValidationFilter(v as typeof validationFilter); setPage(1); }}>
                        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="validated">Validadas</SelectItem>
                            <SelectItem value="pending">Pendientes</SelectItem>
                        </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="ml-auto">
                        {data?.totalCount ?? 0} imágenes
                    </Badge>
                </div>
            )}

            {/* Loading skeleton */}
            {speciesId && isLoading && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-lg" />)}
                </div>
            )}

            {/* Empty state */}
            {speciesId && !isLoading && images.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center gap-4 p-12 text-center">
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        <p className="text-lg font-semibold">Sin imágenes</p>
                        <p className="text-sm text-muted-foreground">No hay imágenes {validationFilter !== "all" ? `con estado "${validationFilter}"` : ""} para esta especie.</p>
                    </CardContent>
                </Card>
            )}

            {/* Image grid */}
            {speciesId && !isLoading && images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <Card key={img.id} className="group overflow-hidden pt-0 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => { setSelected(img); setIsDetailOpen(true); }}>
                            <div className="relative aspect-[4/3] bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.imageUrl} alt={img.speciesId}
                                    className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                                <div className="absolute top-2 right-2">
                                    <StatusBadge
                                        label={img.isValidatedByExpert ? "Validada" : "Pendiente"}
                                        variant={img.isValidatedByExpert ? "success" : "warning"}
                                    />
                                </div>
                            </div>
                            <CardContent className="p-3">
                                <p className="text-xs text-muted-foreground truncate">{img.licenseType}</p>
                                <p className="text-xs text-muted-foreground">{new Date(img.createdAt).toLocaleDateString("es-CO")}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            {/* Detail dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Revisión de Imagen</DialogTitle>
                        <DialogDescription>Validar o rechazar imagen de especie</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4">
                            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={selected.imageUrl} alt="Imagen de especie"
                                    className="h-full w-full object-contain" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><p className="text-muted-foreground">Estado actual</p>
                                    <StatusBadge
                                        label={selected.isValidatedByExpert ? "Validada" : "Pendiente"}
                                        variant={selected.isValidatedByExpert ? "success" : "warning"}
                                    />
                                </div>
                                <div><p className="text-muted-foreground">Licencia</p><Badge variant="outline">{selected.licenseType}</Badge></div>
                                <div><p className="text-muted-foreground">Subida</p><p className="font-medium">{new Date(selected.createdAt).toLocaleDateString("es-CO")}</p></div>
                                <div><p className="text-muted-foreground">Principal</p><p className="font-medium">{selected.isPrimary ? "Sí" : "No"}</p></div>
                            </div>
                            <div className="flex justify-end gap-2">
                                {canModerate && !selected.isValidatedByExpert && (
                                    <Button
                                        onClick={async () => {
                                            await validateImage.mutateAsync(selected.id);
                                            setIsDetailOpen(false);
                                        }}
                                        disabled={validateImage.isPending}
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        {validateImage.isPending ? "Validando..." : "Validar imagen"}
                                    </Button>
                                )}
                                {/* Reject = un-validate (sets pending), never deletes the image. */}
                                {canModerate && selected.isValidatedByExpert && (
                                    <Button variant="outline"
                                        onClick={async () => {
                                            await rejectImage.mutateAsync(selected.id);
                                            setIsDetailOpen(false);
                                        }}
                                        disabled={rejectImage.isPending}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        {rejectImage.isPending ? "Rechazando..." : "Rechazar validación"}
                                    </Button>
                                )}
                                {!canModerate && (
                                    <p className="text-xs text-muted-foreground italic self-center mr-auto">
                                        Solo lectura — no tienes permisos para validar imágenes.
                                    </p>
                                )}
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
