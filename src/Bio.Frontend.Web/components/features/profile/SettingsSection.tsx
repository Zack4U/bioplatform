"use client";

/**
 * SettingsSection — settings tab in the profile page.
 *
 * Contains:
 * - Theme preference (links to ThemeToggle)
 * - Notification preferences (placeholder for future)
 * - Danger zone: delete account
 *
 * @module components/features/profile/SettingsSection
 */

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useDeleteAccount } from "@/hooks/features/auth";
import { useAuthStore } from "@/store/auth-store";
import { AlertTriangle, Bell, Loader2, Palette, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function SettingsSection() {
    const { user } = useAuthStore();
    const deleteMutation = useDeleteAccount();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");

    function handleDeleteAccount() {
        if (deleteConfirmation !== "ELIMINAR") return;
        deleteMutation.mutate(undefined, {
            onSuccess: () => {
                setShowDeleteDialog(false);
            },
        });
    }

    return (
        <div className="space-y-6">
            {/* ── Theme ────────────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette
                            className="h-5 w-5"
                            aria-hidden="true"
                        />
                        Apariencia
                    </CardTitle>
                    <CardDescription>
                        Personaliza como se ve la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Tema</p>
                            <p className="text-sm text-muted-foreground">
                                Selecciona entre claro, oscuro o
                                automatico del sistema.
                            </p>
                        </div>
                        <ThemeToggle />
                    </div>
                </CardContent>
            </Card>

            {/* ── Notifications ────────────────────────────────── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell
                            className="h-5 w-5"
                            aria-hidden="true"
                        />
                        Notificaciones
                    </CardTitle>
                    <CardDescription>
                        Gestiona tus preferencias de notificaciones.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Las preferencias de notificaciones estaran
                        disponibles proximamente.
                    </p>
                    <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() =>
                            toast.info(
                                "Por implementar: preferencias de notificaciones.",
                            )
                        }
                    >
                        Configurar notificaciones
                    </Button>
                </CardContent>
            </Card>

            {/* ── Danger Zone ──────────────────────────────────── */}
            <Card className="border-destructive/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle
                            className="h-5 w-5"
                            aria-hidden="true"
                        />
                        Zona de peligro
                    </CardTitle>
                    <CardDescription>
                        Acciones irreversibles relacionadas con tu cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Separator />
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                Eliminar cuenta
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Se eliminaran permanentemente todos tus
                                datos, pedidos e historial. Esta accion no
                                se puede deshacer.
                            </p>
                        </div>
                        <Button
                            id="delete-account-button"
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2
                                className="h-4 w-4"
                                aria-hidden="true"
                            />
                            Eliminar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Delete Confirmation Dialog ───────────────────── */}
            <Dialog
                open={showDeleteDialog}
                onOpenChange={(open) => {
                    setShowDeleteDialog(open);
                    if (!open) setDeleteConfirmation("");
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Eliminar cuenta permanentemente
                        </DialogTitle>
                        <DialogDescription>
                            Esta accion es irreversible. Se eliminara tu
                            cuenta ({user?.email}) y todos los datos
                            asociados.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-4">
                        <Label htmlFor="delete-confirmation">
                            Escribe ELIMINAR para confirmar
                        </Label>
                        <Input
                            id="delete-confirmation"
                            type="text"
                            placeholder="ELIMINAR"
                            value={deleteConfirmation}
                            onChange={(e) =>
                                setDeleteConfirmation(e.target.value)
                            }
                            autoComplete="off"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDeleteDialog(false);
                                setDeleteConfirmation("");
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            id="confirm-delete-account"
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={
                                deleteConfirmation !== "ELIMINAR" ||
                                deleteMutation.isPending
                            }
                        >
                            {deleteMutation.isPending && (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            )}
                            Eliminar mi cuenta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
