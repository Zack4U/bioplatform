"use client";
/**
 * SpeciesManagement — admin species catalog. Connected to real API.
 */
import { useState, useCallback } from "react";
import { StatusBadge } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TAXONOMY_KINGDOMS } from "@/lib/constants";
import type { SpeciesAdminItem } from "@/types";
import {
    Eye, Images, Leaf, Plus, Pencil, Shield, Trash2,
} from "lucide-react";
import {
    useDeleteSpecies, useSpeciesList, useUpdateSpecies,
} from "@/hooks/features/admin/useSpeciesManagement";
import { useHasRole } from "@/hooks/features/auth";
import { SpeciesFormDialog } from "./SpeciesFormDialog";
import { useRouter } from "next/navigation";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const columns: ColumnDef<SpeciesAdminItem>[] = [
    { key: "scientificName", header: "Nombre Científico", sortable: true, render: (s) => <span className="font-medium italic">{s.scientificName}</span> },
    { key: "commonName", header: "Nombre Común", sortable: true, render: (s) => s.commonName ?? "-" },
    { key: "kingdom", header: "Reino", hideOnMobile: true, render: (s) => s.kingdom ?? "-" },
    { key: "family", header: "Familia", hideOnMobile: true, render: (s) => s.family ?? "-" },
    { key: "conservationStatus", header: "Conservación", render: (s) => s.conservationStatus ? <Badge variant="outline">{s.conservationStatus}</Badge> : <span>-</span> },
    { key: "isSensitive", header: "Sensible", render: (s) => s.isSensitive ? <StatusBadge label="Sí" variant="warning" /> : <StatusBadge label="No" variant="default" /> },
    { key: "imageCount", header: "Imágenes", hideOnMobile: true, render: (s) => s.imageCount ?? 0 },
    { key: "distributionCount", header: "Distribuciones", hideOnMobile: true, render: (s) => s.distributionCount ?? 0 },
];

export function SpeciesManagement() {
    const [search, setSearch] = useState("");
    const [kingdomFilter, setKingdomFilter] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("scientificName");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [selected, setSelected] = useState<SpeciesAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<SpeciesAdminItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SpeciesAdminItem | null>(null);

    const router = useRouter();
    const pageSize = 15;
    const isAdmin = useHasRole("ADMIN");

    const { data, isLoading } = useSpeciesList({
        query: search || undefined,
        kingdom: kingdomFilter && kingdomFilter !== "all" ? kingdomFilter : undefined,
        sortBy,
        sortOrder,
        page,
        pageSize,
    });

    const deleteSpecies = useDeleteSpecies();
    const updateSpecies = useUpdateSpecies();

    const handleSort = useCallback((key: string) => {
        setSortBy((prev) => {
            if (prev === key) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); return prev; }
            setSortOrder("asc"); return key;
        });
    }, []);

    const handleToggleSensitive = useCallback((s: SpeciesAdminItem) => {
        updateSpecies.mutate({ id: s.id, data: { isSensitive: !s.isSensitive } });
    }, [updateSpecies]);

    const actions: RowAction<SpeciesAdminItem>[] = [
        {
            label: "Ver detalle",
            icon: <Eye className="h-4 w-4" />,
            onClick: (s) => { setSelected(s); setIsDetailOpen(true); },
        },
        {
            label: "Ver Imagenes",
            icon: <Images className="h-4 w-4" />,
            onClick: (s) => router.push(`/admin/images?speciesId=${s.id}&speciesName=${encodeURIComponent(s.scientificName)}`),
        },
        {
            label: "Editar",
            icon: <Pencil className="h-4 w-4" />,
            onClick: (s) => { setEditTarget(s); setIsFormOpen(true); },
        },
        {
            label: "Toggle sensibilidad",
            icon: <Shield className="h-4 w-4" />,
            onClick: handleToggleSensitive,
        },
        ...(isAdmin ? [{
            label: "Eliminar",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: (s: SpeciesAdminItem) => setDeleteTarget(s),
            className: "text-destructive",
        }] : []),
    ];

    const items = data?.items ?? [];
    const totalPages = data?.totalPages ?? 1;

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Especies</h1>
                    <p className="text-muted-foreground">Catalogo de biodiversidad de Caldas</p>
                </div>
                {isAdmin && (
                    <Button onClick={() => { setEditTarget(null); setIsFormOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Nueva Especie
                    </Button>
                )}
            </div>

            <AdminDataTable
                data={items} columns={columns} actions={actions} keyExtractor={(s) => s.id}
                isLoading={isLoading} searchValue={search} onSearchChange={(v) => { setSearch(v); setPage(1); }}
                searchPlaceholder="Buscar por nombre científico o común..."
                sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay especies" emptyIcon={<Leaf className="h-6 w-6" />}
                toolbar={
                    <Select value={kingdomFilter} onValueChange={(v) => { setKingdomFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Todos los reinos" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {TAXONOMY_KINGDOMS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                        </SelectContent>
                    </Select>
                }
            />

            {/* Detail Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalle de Especie</DialogTitle>
                        <DialogDescription>Información taxonómica y ecológica</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Nombre Científico</p><p className="font-medium italic">{selected.scientificName}</p></div>
                                <div><p className="text-muted-foreground">Nombre Común</p><p className="font-medium">{selected.commonName ?? "-"}</p></div>
                                <div><p className="text-muted-foreground">Reino</p><p className="font-medium">{selected.kingdom ?? "-"}</p></div>
                                <div><p className="text-muted-foreground">Familia</p><p className="font-medium">{selected.family ?? "-"}</p></div>
                                <div><p className="text-muted-foreground">Conservación</p>{selected.conservationStatus ? <Badge variant="outline">{selected.conservationStatus}</Badge> : "-"}</div>
                                <div><p className="text-muted-foreground">Sensible</p><StatusBadge label={selected.isSensitive ? "Sí" : "No"} variant={selected.isSensitive ? "warning" : "default"} /></div>
                                <div><p className="text-muted-foreground">Estado Legal</p><StatusBadge label={selected.legalStatus ? "Legal" : "Sin estado"} variant={selected.legalStatus ? "success" : "default"} /></div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Imágenes</p><p className="font-medium">{selected.imageCount ?? 0}</p></div>
                                <div><p className="text-muted-foreground">Distribuciones</p><p className="font-medium">{selected.distributionCount ?? 0}</p></div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    setIsDetailOpen(false);
                                    router.push(`/admin/images?speciesId=${selected.id}&speciesName=${encodeURIComponent(selected.scientificName)}`);
                                }}>
                                    <Images className="mr-2 h-4 w-4" />Ver Imágenes
                                </Button>
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create/Edit Dialog — create restricted to Admin; edit open to Researcher */}
            {(isAdmin || editTarget !== null) && (
                <SpeciesFormDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    species={editTarget}
                />
            )}

            {/* Delete Confirm — Admin only */}
            <AlertDialog open={isAdmin && !!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar esta especie?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará <span className="font-semibold italic">{deleteTarget?.scientificName}</span> del catálogo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => { if (deleteTarget) { deleteSpecies.mutate(deleteTarget.id); setDeleteTarget(null); } }}
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
