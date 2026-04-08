"use client";

/**
 * TwoFactorDialog — modal for entering a 6-digit TOTP code during login.
 *
 * Controlled externally via `open` prop. Uses React Hook Form + Zod
 * for validation. Renders inside a Shadcn Dialog.
 *
 * @module components/features/auth/TwoFactorDialog
 */

import { Button } from "@/components/ui/button";
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
import {
    twoFactorCodeSchema,
    type TwoFactorCodeFormValues,
} from "@/lib/validators/auth-validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

interface TwoFactorDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Temporary 2FA token from login response */
    twoFactorToken: string | null;
    /** Whether the 2FA confirmation request is in-flight */
    isPending: boolean;
    /** Called with the 6-digit code when the form is submitted */
    onSubmit: (code: string) => void;
    /** Called when the user cancels the 2FA challenge */
    onCancel: () => void;
}

export function TwoFactorDialog({
    open,
    twoFactorToken,
    isPending,
    onSubmit,
    onCancel,
}: TwoFactorDialogProps) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TwoFactorCodeFormValues>({
        resolver: zodResolver(twoFactorCodeSchema),
        defaultValues: { code: "" },
    });

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    function handleFormSubmit(values: TwoFactorCodeFormValues) {
        onSubmit(values.code);
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) onCancel();
            }}
        >
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck
                            className="h-5 w-5 text-primary"
                            aria-hidden="true"
                        />
                        Verificacion en dos pasos
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa el codigo de 6 digitos generado por tu
                        aplicacion de autenticacion.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="two-factor-form"
                    onSubmit={handleSubmit(handleFormSubmit)}
                    noValidate
                >
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="two-factor-code">
                                Codigo de verificacion
                            </Label>
                            <Input
                                id="two-factor-code"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="000000"
                                autoComplete="one-time-code"
                                autoFocus
                                className="text-center text-lg tracking-widest"
                                aria-invalid={!!errors.code}
                                aria-describedby={
                                    errors.code
                                        ? "two-factor-code-error"
                                        : undefined
                                }
                                {...register("code")}
                            />
                            {errors.code && (
                                <p
                                    id="two-factor-code-error"
                                    className="text-sm text-destructive"
                                    role="alert"
                                >
                                    {errors.code.message}
                                </p>
                            )}
                        </div>

                        {/* Hidden field to pass the token (not shown to user) */}
                        {twoFactorToken && (
                            <input
                                type="hidden"
                                value={twoFactorToken}
                                readOnly
                            />
                        )}
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            id="two-factor-cancel"
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isPending}
                        >
                            Cancelar
                        </Button>
                        <Button
                            id="two-factor-submit"
                            type="submit"
                            disabled={isPending}
                        >
                            {isPending ? (
                                <Loader2
                                    className="h-4 w-4 animate-spin"
                                    aria-hidden="true"
                                />
                            ) : (
                                <ShieldCheck
                                    className="h-4 w-4"
                                    aria-hidden="true"
                                />
                            )}
                            {isPending ? "Verificando..." : "Verificar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
