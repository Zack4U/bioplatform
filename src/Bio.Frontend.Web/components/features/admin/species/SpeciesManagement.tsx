"use client";

/**
 * SpeciesManagement — admin page for species catalog management.
 */

import { StatusBadge } from "@/components/common";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TAXONOMY_KINGDOMS } from "@/lib/constants";
import { mockSpecies } from "@/lib/admin-mock";
import type { SpeciesAdminItem } from "@/types";
import { Eye, Leaf, Shield } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const columns: ColumnDef<SpeciesAdminItem>[] = [
    { key: "scientificName", header: "Nombre Cientifico", sortable: true, render: (s) => <span className="font-medium italic">{s.scientificName}</span> },
    { key: "commonName", header: "Nombre Comun", sortable: true, render: (s) => s.commonName ?? "-" },
    { key: "kingdom", header: "Reino", hideOnMobile: true, render: (s) => s.kingdom ?? "-" },
    { key: "family", header: "Familia", hideOnMobile: true, render: (s) => s.family ?? "-" },
    { key: "conservationStatus", header: "Conservacion", render: (s) => s.conservationStatus ? <Badge variant="outline">{s.conservationStatus}</Badge> : <span>-</span> },
    { key: "isSensitive", header: "Sensible", render: (s) => s.isSensitive ? <StatusBadge label="Si" variant="warning" /> : <StatusBadge label="No" variant="default" /> },
    { key: "imageCount", header: "Imagenes", hideOnMobile: true, render: (s) => s.imageCount },
];

export function SpeciesManagement() {
    const [isLoading, setIsLoading] = useState(true);
    const [species, setSpecies] = useState<SpeciesAdminItem[]>([]);
    const [search, setSearch] = useState("");
    const [kingdomFilter, setKingdomFilter] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("scientificName");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [selected, setSelected] = useState<SpeciesAdminItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    useEffect(() => { const t = setTimeout(() => { setSpecies(mockSpecies()); setIsLoading(false); }, 400); return () => clearTimeout(t); }, []);

    const filtered = useMemo(() => {
        let r = [...species];
        if (search) { const q = search.toLowerCase(); r = r.filter((s) => s.scientificName.toLowerCase().includes(q) || (s.commonName?.toLowerCase().includes(q) ?? false)); }
        if (kingdomFilter && kingdomFilter !== "all") r = r.filter((s) => s.kingdom === kingdomFilter);
        r.sort((a, b) => { const cmp = String((a as unknown as Record<string, unknown>)[sortBy] ?? "").localeCompare(String((b as unknown as Record<string, unknown>)[sortBy] ?? "")); return sortOrder === "asc" ? cmp : -cmp; });
        return r;
    }, [species, search, kingdomFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(filtered.length / 15);
    const paginated = filtered.slice((page - 1) * 15, page * 15);

    const handleSort = useCallback((key: string) => { setSortBy((p) => { if (p === key) { setSortOrder((o) => o === "asc" ? "desc" : "asc"); return p; } setSortOrder("asc"); return key; }); }, []);

    const actions: RowAction<SpeciesAdminItem>[] = [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (s) => { setSelected(s); setIsDetailOpen(true); } },
        { label: "Toggle sensibilidad", icon: <Shield className="h-4 w-4" />, onClick: (s) => setSpecies((prev) => prev.map((sp) => sp.id === s.id ? { ...sp, isSensitive: !sp.isSensitive } : sp)) },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Gestion de Especies</h1>
                <p className="text-muted-foreground">Catalogo de biodiversidad de Caldas</p>
            </div>
            <AdminDataTable
                data={paginated} columns={columns} actions={actions} keyExtractor={(s) => s.id}
                isLoading={isLoading} searchValue={search} onSearchChange={setSearch}
                searchPlaceholder="Buscar por nombre cientifico o comun..."
                sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}
                currentPage={page} totalPages={totalPages} onPageChange={setPage}
                emptyTitle="No hay especies" emptyIcon={<Leaf className="h-6 w-6" />}
                toolbar={
                    <Select value={kingdomFilter} onValueChange={setKingdomFilter}>
                        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Todos los reinos" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {TAXONOMY_KINGDOMS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                        </SelectContent>
                    </Select>
                }
            />
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalle de Especie</DialogTitle>
                        <DialogDescription>Informacion taxonomica y ecologica</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Nombre Cientifico</p><p className="font-medium italic">{selected.scientificName}</p></div>
                                <div><p className="text-muted-foreground">Nombre Comun</p><p className="font-medium">{selected.commonName ?? "-"}</p></div>
                                <div><p className="text-muted-foreground">Reino</p><p className="font-medium">{selected.kingdom ?? "-"}</p></div>
                                <div><p className="text-muted-foreground">Familia</p><p className="font-medium">{selected.family ?? "-"}</p></div>
                                <div><p className="text-muted-foreground">Conservacion</p>{selected.conservationStatus ? <Badge variant="outline">{selected.conservationStatus}</Badge> : "-"}</div>
                                <div><p className="text-muted-foreground">Sensible</p><StatusBadge label={selected.isSensitive ? "Si" : "No"} variant={selected.isSensitive ? "warning" : "default"} /></div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Imagenes</p><p className="font-medium">{selected.imageCount}</p></div>
                                <div><p className="text-muted-foreground">Distribuciones</p><p className="font-medium">{selected.distributionCount}</p></div>
                            </div>
                            <div className="flex justify-end"><Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button></div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
