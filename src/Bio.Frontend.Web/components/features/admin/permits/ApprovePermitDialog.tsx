"use client";
/**
 * ApprovePermitDialog — Admin/Authority reviews a Pending ABS permit request
 * and approves it directly. The resolution data is read-only since it was filled in by the entrepreneur.
 */
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, ExternalLink, ShieldCheck } from "lucide-react";
import { useApproveAbsPermit } from "@/hooks/features/admin/usePermitsManagement";
import type { PermitAdminItem } from "@/types/admin";

interface Props {
    permit: PermitAdminItem | null;
    onOpenChange: (open: boolean) => void;
}

export function ApprovePermitDialog({ permit, onOpenChange }: Props) {
    const approve = useApproveAbsPermit();

    const handleApprove = async () => {
        if (!permit) return;
        await approve.mutateAsync({
            id: permit.id,
            data: {
                resolutionNumber: permit.resolutionNumber,
                emissionDate: permit.emissionDate,
                expirationDate: permit.expirationDate,
                grantingAuthority: permit.grantingAuthority,
                legalFramework: permit.legalFramework || undefined,
                documentUrl: permit.documentUrl || undefined,
            },
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={!!permit} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-success" />
                        Aprobar Permiso ABS
                    </DialogTitle>
                    <DialogDescription>
                        Revisa los datos del permiso proporcionados por el emprendedor. Al aprobar, el permiso cambiará a estado &quot;Activo&quot;.
                    </DialogDescription>
                </DialogHeader>

                {permit && (
                    <div className="space-y-4 text-sm mt-2">
                        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/20 p-3">
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground">Emprendedor</p>
                                <p className="font-semibold">{permit.entrepreneurName}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-muted-foreground">Especie</p>
                                <p className="font-medium italic">{permit.speciesName ?? permit.speciesId}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Número de Resolución</p>
                                <p className="font-mono font-medium">{permit.resolutionNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Autoridad Otorgante</p>
                                <p className="font-medium">{permit.grantingAuthority}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Fecha de Emisión</p>
                                <p className="font-medium">{new Date(permit.emissionDate).toLocaleDateString("es-CO")}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Fecha de Vencimiento</p>
                                <p className="font-medium">{new Date(permit.expirationDate).toLocaleDateString("es-CO")}</p>
                            </div>
                            {permit.legalFramework && (
                                <div className="col-span-2">
                                    <p className="text-xs text-muted-foreground">Marco Legal</p>
                                    <p className="font-medium">{permit.legalFramework}</p>
                                </div>
                            )}
                        </div>

                        {permit.justification && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Justificación del Emprendedor</p>
                                <p className="rounded-md border bg-muted/40 p-2 text-xs italic">{permit.justification}</p>
                            </div>
                        )}

                        {permit.documentUrl && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1.5">Documento PDF Adjunto</p>
                                <a href={permit.documentUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <FileText className="mr-2 h-4 w-4 text-destructive" />
                                        Ver documento legal
                                        <ExternalLink className="ml-auto h-3 w-3" />
                                    </Button>
                                </a>
                            </div>
                        )}

                        <Separator />

                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleApprove} disabled={approve.isPending}>
                                {approve.isPending ? "Aprobando..." : "Confirmar y Aprobar"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
