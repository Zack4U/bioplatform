"use client";
/**
 * AuditLogManagement — activity log viewer. Connected to real API.
 * Shows ActivityLogResponseDTO from /v1/activity-logs.
 */
import { useState, useCallback } from "react";
import { AdminDataTable, type ColumnDef } from "@/components/features/admin/shared/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, Eye } from "lucide-react";
import { useAuditLogs } from "@/hooks/features/admin/useAuditLogManagement";
import type { ActivityLogResponseDTO } from "@/types/admin";
import {
    AUDIT_ACTION_LABELS, AUDIT_TARGET_LABELS, AUDIT_IMPACT_LABELS,
    AUDIT_ACTOR_LABELS, translateLabel,
} from "@/lib/constants";

const IMPACT_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Critical: "destructive",
    High:     "destructive",
    Medium:   "default",
    Low:      "secondary",
    Info:     "outline",
};

const columns: ColumnDef<ActivityLogResponseDTO>[] = [
    {
        key: "actionType", header: "Acción",
        render: (e) => <span className="text-xs">{translateLabel(AUDIT_ACTION_LABELS, e.actionType)}</span>,
    },
    {
        key: "targetType", header: "Entidad", hideOnMobile: true,
        render: (e) => <Badge variant="outline">{translateLabel(AUDIT_TARGET_LABELS, e.targetType)}</Badge>,
    },
    {
        key: "summary", header: "Resumen",
        render: (e) => <span className="truncate max-w-[220px] inline-block text-sm">{e.summary}</span>,
    },
    {
        key: "impactLevel", header: "Impacto", hideOnMobile: true,
        render: (e) => <Badge variant={IMPACT_VARIANT[e.impactLevel] ?? "outline"}>{translateLabel(AUDIT_IMPACT_LABELS, e.impactLevel)}</Badge>,
    },
    {
        key: "actorType", header: "Actor", hideOnMobile: true,
        render: (e) => <span className="text-sm">{translateLabel(AUDIT_ACTOR_LABELS, e.actorType)}</span>,
    },
    {
        key: "createdAt", header: "Fecha",
        render: (e) => <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleString("es-CO")}</span>,
    },
];

const ACTION_TYPES = [
    "Login", "Logout", "Create", "Update", "Delete",
    "Activate", "Deactivate", "Validate", "Reject", "Upload",
];
const IMPACT_LEVELS = ["Critical", "High", "Medium", "Low", "Info"];
const ACTOR_TYPES   = ["User", "System", "Admin", "Anonymous"];
const TARGET_TYPES  = [
    "User", "Species", "SpeciesImage", "Product", "Order",
    "AbsPermit", "Review", "CnnModel", "Post",
];

export function AuditLogManagement() {
    const [actorType,  setActorType]  = useState("");
    const [actionType, setActionType] = useState("");
    const [impactLevel,setImpactLevel]= useState("");
    const [targetType, setTargetType] = useState("");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<ActivityLogResponseDTO | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const { data, isLoading } = useAuditLogs({
        actorType:   actorType   && actorType   !== "all" ? actorType   : undefined,
        actionType:  actionType  && actionType  !== "all" ? actionType  : undefined,
        impactLevel: impactLevel && impactLevel !== "all" ? impactLevel : undefined,
        targetType:  targetType  && targetType  !== "all" ? targetType  : undefined,
        page,
        pageSize: 20,
    });

    const items = data?.items ?? [];
    const totalPages = data?.totalPages ?? 1;

    const buildActions = useCallback(() => [
        { label: "Ver detalle", icon: <Eye className="h-4 w-4" />, onClick: (e: ActivityLogResponseDTO) => { setSelected(e); setIsDetailOpen(true); } },
    ], []);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Registro de Auditoría</h1>
                <p className="text-muted-foreground">Historial completo de actividad en la plataforma</p>
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap gap-2">
                {[
                    { value: actorType,   setter: setActorType,   items: ACTOR_TYPES,   placeholder: "Actor",   labelMap: AUDIT_ACTOR_LABELS },
                    { value: actionType,  setter: setActionType,  items: ACTION_TYPES,  placeholder: "Acción",  labelMap: AUDIT_ACTION_LABELS },
                    { value: impactLevel, setter: setImpactLevel, items: IMPACT_LEVELS, placeholder: "Impacto", labelMap: AUDIT_IMPACT_LABELS },
                    { value: targetType,  setter: setTargetType,  items: TARGET_TYPES,  placeholder: "Entidad", labelMap: AUDIT_TARGET_LABELS },
                ].map(({ value, setter, items: opts, placeholder, labelMap }) => (
                    <Select key={placeholder} value={value} onValueChange={(v) => { setter(v); setPage(1); }}>
                        <SelectTrigger className="w-[140px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            {opts.map((o) => <SelectItem key={o} value={o}>{translateLabel(labelMap, o)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ))}
            </div>

            <AdminDataTable
                data={items}
                columns={columns}
                actions={buildActions()}
                keyExtractor={(e) => e.id}
                isLoading={isLoading}
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                emptyTitle="Sin registros de auditoría"
                emptyIcon={<ClipboardList className="h-6 w-6" />}
            />

            {/* Detail dialog */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detalle del Evento</DialogTitle>
                        <DialogDescription>Información completa del registro de auditoría</DialogDescription>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-muted-foreground">Acción</p><p className="text-sm font-medium">{translateLabel(AUDIT_ACTION_LABELS, selected.actionType)}</p></div>
                                <div><p className="text-muted-foreground">Impacto</p><Badge variant={IMPACT_VARIANT[selected.impactLevel] ?? "outline"}>{translateLabel(AUDIT_IMPACT_LABELS, selected.impactLevel)}</Badge></div>
                                <div><p className="text-muted-foreground">Entidad</p><Badge variant="outline">{translateLabel(AUDIT_TARGET_LABELS, selected.targetType)}{selected.targetId ? ` #${selected.targetId.slice(0, 8)}…` : ""}</Badge></div>
                                <div><p className="text-muted-foreground">Actor</p><p>{translateLabel(AUDIT_ACTOR_LABELS, selected.actorType)}{selected.actorUserId ? ` (${selected.actorUserId.slice(0, 8)}…)` : ""}</p></div>
                                <div className="col-span-2"><p className="text-muted-foreground">Resumen</p><p className="font-medium">{selected.summary}</p></div>
                                {selected.ipAddress && <div><p className="text-muted-foreground">IP</p><p className="font-mono text-xs">{selected.ipAddress}</p></div>}
                                <div><p className="text-muted-foreground">Fecha</p><p>{new Date(selected.createdAt).toLocaleString("es-CO")}</p></div>
                            </div>

                            {selected.changeSet && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-muted-foreground mb-2 font-medium">Cambios registrados</p>
                                        <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-48">
                                            {(() => { try { return JSON.stringify(JSON.parse(selected.changeSet), null, 2); } catch { return selected.changeSet; } })()}
                                        </pre>
                                    </div>
                                </>
                            )}

                            {selected.metadata && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-muted-foreground mb-2 font-medium">Metadata</p>
                                        <pre className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-32">
                                            {(() => { try { return JSON.stringify(JSON.parse(selected.metadata), null, 2); } catch { return selected.metadata; } })()}
                                        </pre>
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end">
                                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
