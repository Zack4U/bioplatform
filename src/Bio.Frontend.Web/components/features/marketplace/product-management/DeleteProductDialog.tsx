"use client";

/**
 * DeleteProductDialog — confirmation dialog for product deletion.
 *
 * Built with Shadcn Dialog (AlertDialog is not currently installed).
 * Shows the product name and an irreversibility warning before confirming.
 *
 * UI ONLY — all state is controlled by the parent page via props.
 *
 * WCAG 2.1 AA:
 *  - Dialog role="alertdialog" for destructive confirmations.
 *  - Destructive action button is focused last (Tab order).
 *  - aria-describedby links warning text to the dialog.
 *
 * @module components/features/marketplace/product-management/DeleteProductDialog
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
import { Loader2, TriangleAlert } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DeleteProductDialogProps {
  productId: string | null;
  productName?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeleteProductDialog({
  productName,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteProductDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        role="alertdialog"
        aria-describedby="delete-dialog-description"
        showCloseButton={!isDeleting}
        className="sm:max-w-md"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" />
            Eliminar producto
          </DialogTitle>
          <DialogDescription
            id="delete-dialog-description"
            className="space-y-2 pt-1"
          >
            {productName ? (
              <>
                Estas a punto de eliminar el producto{" "}
                <strong className="font-semibold text-foreground">
                  &quot;{productName}&quot;
                </strong>
                .
              </>
            ) : (
              "Estas a punto de eliminar este producto."
            )}
          </DialogDescription>
        </DialogHeader>

        {/* ── Warning banner ─────────────────────────────────────────── */}
        <div
          role="alert"
          className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3"
        >
          <TriangleAlert
            className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-sm text-destructive">
            Esta accion es permanente e irreversible. El producto sera removido
            del marketplace y no podra ser recuperado.
          </p>
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            aria-label={
              productName
                ? `Confirmar eliminacion de ${productName}`
                : "Confirmar eliminacion"
            }
          >
            {isDeleting ? (
              <>
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
                Eliminando...
              </>
            ) : (
              "Eliminar producto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
