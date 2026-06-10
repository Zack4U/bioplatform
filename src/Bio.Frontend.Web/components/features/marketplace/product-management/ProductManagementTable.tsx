"use client";

import { EmptyState, StatusBadge } from "@/components/common";
import { SmartImage } from "@/components/common/SmartImage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ManageProductListItem } from "@/types";
import { cn } from "@/lib/utils";
import { Check, ExternalLink, ImageIcon, Package, Pencil, Power, PowerOff, RotateCcw, Star, Trash2, X } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductManagementTableProps {
  products: ManageProductListItem[];
  isLoading: boolean;
  isFetching: boolean;
  isAdmin?: boolean;
  onEdit: (product: ManageProductListItem) => void;
  onDelete: (productId: string) => void;
  onManageImages: (product: ManageProductListItem) => void;
  onActivate?: (productId: string) => void;
  onDeactivate?: (productId: string) => void;
  onApprove?: (productId: string) => void;
  onReject?: (productId: string) => void;
  onUnapprove?: (productId: string) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function EntrepreneurSkeletonRow() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-12 w-12 rounded-md" /></TableCell>
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      </TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}

function AdminSkeletonRow() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-36" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
    </TableRow>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductManagementTable({
  products,
  isLoading,
  isFetching,
  isAdmin = false,
  onEdit,
  onDelete,
  onManageImages,
  onActivate,
  onDeactivate,
  onApprove,
  onReject,
  onUnapprove,
}: ProductManagementTableProps) {
  const showSkeleton = isLoading;
  const showEmpty = !isLoading && products.length === 0;

  if (showEmpty) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8" aria-hidden="true" />}
        title={isAdmin ? "No hay productos en la plataforma" : "No tienes productos publicados"}
        description={isAdmin ? "No se encontraron productos con los filtros actuales." : "Crea tu primer producto haciendo clic en el boton 'Nuevo Producto'."}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border transition-opacity duration-300",
        isFetching && !isLoading ? "opacity-60" : "opacity-100",
      )}
      aria-busy={isFetching}
    >
      <Table aria-label="Tabla de productos">
        <TableCaption className="sr-only">
          {isAdmin ? "Lista global de productos" : "Lista de productos del emprendedor"}
        </TableCaption>

        <TableHeader>
          {isAdmin ? (
            <TableRow>
              <TableHead scope="col">Producto</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">Emprendedor</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">Categoria</TableHead>
              <TableHead scope="col">Estado</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">Creado</TableHead>
              <TableHead scope="col" className="text-right">Acciones</TableHead>
            </TableRow>
          ) : (
            <TableRow>
              <TableHead scope="col" className="w-[64px]">Imagen</TableHead>
              <TableHead scope="col">Producto</TableHead>
              <TableHead scope="col" className="hidden md:table-cell">Categoria</TableHead>
              <TableHead scope="col">Precio</TableHead>
              <TableHead scope="col" className="hidden sm:table-cell">Stock</TableHead>
              <TableHead scope="col">Estado</TableHead>
              <TableHead scope="col" className="hidden lg:table-cell">Calificacion</TableHead>
              <TableHead scope="col" className="text-right">Acciones</TableHead>
            </TableRow>
          )}
        </TableHeader>

        <TableBody aria-busy={showSkeleton}>
          {showSkeleton
            ? Array.from({ length: 5 }).map((_, i) =>
                isAdmin ? <AdminSkeletonRow key={i} /> : <EntrepreneurSkeletonRow key={i} />
              )
            : products.map((product) =>
                isAdmin ? (
                  <AdminProductRow
                    key={product.id}
                    product={product}
                    onActivate={onActivate}
                    onDeactivate={onDeactivate}
                    onApprove={onApprove}
                    onReject={onReject}
                    onUnapprove={onUnapprove}
                  />
                ) : (
                  <EntrepreneurProductRow
                    key={product.id}
                    product={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onManageImages={onManageImages}
                  />
                )
              )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Admin product row ────────────────────────────────────────────────────────

interface AdminProductRowProps {
  product: ManageProductListItem;
  onActivate?: (productId: string) => void;
  onDeactivate?: (productId: string) => void;
  onApprove?: (productId: string) => void;
  onReject?: (productId: string) => void;
  onUnapprove?: (productId: string) => void;
}

function AdminProductRow({ product, onActivate, onDeactivate, onApprove, onReject, onUnapprove }: AdminProductRowProps) {
  // A product not yet approved is a pending "Solicitud".
  const pending = !product.isApproved;
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="max-w-[220px] truncate font-medium leading-snug text-sm">
            {product.name}
          </span>
          <span className="text-xs text-muted-foreground font-mono">{product.slug}</span>
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <span className="text-sm">
          {product.entrepreneurName ?? (
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {shortId(product.entrepreneurId)}
            </span>
          )}
        </span>
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <span className="text-sm text-muted-foreground">
          {product.categoryName ?? "-"}
        </span>
      </TableCell>

      <TableCell>
        {pending ? (
          product.rejectionReason ? (
            <div title={product.rejectionReason}>
              <StatusBadge label="Rechazado" variant="destructive" />
            </div>
          ) : (
            <StatusBadge label="Pendiente" variant="warning" />
          )
        ) : (
          <StatusBadge
            label={product.isActive ? "Activo" : "Inactivo"}
            variant={product.isActive ? "success" : "default"}
          />
        )}
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        <span className="text-xs text-muted-foreground">
          {new Date(product.createdAt).toLocaleDateString("es-CO")}
        </span>
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {pending ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Validar ${product.name}`}
                title="Validar / Aprobar"
                onClick={() => onApprove?.(product.id)}
              >
                <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Rechazar ${product.name}`}
                title="Rechazar"
                onClick={() => onReject?.(product.id)}
              >
                <X className="h-4 w-4 text-destructive" aria-hidden="true" />
              </Button>
            </>
          ) : (
            <>
              {product.isActive ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Desactivar ${product.name}`}
                  title="Desactivar"
                  onClick={() => onDeactivate?.(product.id)}
                >
                  <PowerOff className="h-4 w-4 text-destructive" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Activar ${product.name}`}
                  title="Activar"
                  onClick={() => onActivate?.(product.id)}
                >
                  <Power className="h-4 w-4 text-green-600" aria-hidden="true" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Desaprobar ${product.name}`}
                title="Desaprobar (Anular Aprobación)"
                onClick={() => onUnapprove?.(product.id)}
              >
                <RotateCcw className="h-4 w-4 text-amber-600" aria-hidden="true" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label={`Ver ${product.name} en tienda`}
            title="Ver en tienda"
          >
            <a href={`/marketplace/${product.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Entrepreneur product row ─────────────────────────────────────────────────

interface EntrepreneurProductRowProps {
  product: ManageProductListItem;
  onEdit: (product: ManageProductListItem) => void;
  onDelete: (productId: string) => void;
  onManageImages: (product: ManageProductListItem) => void;
}

function EntrepreneurProductRow({
  product,
  onEdit,
  onDelete,
  onManageImages,
}: EntrepreneurProductRowProps) {
  return (
    <TableRow>
      <TableCell>
        <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
          {product.thumbnailUrl ? (
            <SmartImage
              src={product.thumbnailUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="max-w-[200px] truncate font-medium leading-snug">
            {product.name}
          </span>
          {product.sku ? (
            <span className="font-mono text-xs text-muted-foreground">
              SKU: {product.sku}
            </span>
          ) : null}
          {product.baseSpeciesName && (
            <span className="hidden text-xs text-muted-foreground xl:block">
              {product.baseSpeciesName}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {product.categoryName ?? "-"}
        </span>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold tabular-nums">
            {formatCOP(product.sellPrice)}
          </span>
          {product.basePrice && product.basePrice > product.sellPrice && (
            <span className="text-xs text-muted-foreground line-through tabular-nums">
              {formatCOP(product.basePrice)}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <span
          className={cn(
            "tabular-nums text-sm",
            product.stockQuantity === 0 && "font-semibold text-destructive",
            product.stockQuantity > 0 &&
              product.stockQuantity <= 5 &&
              "text-warning-foreground font-semibold",
          )}
        >
          {product.stockQuantity}
        </span>
      </TableCell>

      <TableCell>
        {!product.isApproved ? (
          product.rejectionReason ? (
            <div title={product.rejectionReason}>
              <StatusBadge label="Rechazado" variant="destructive" />
            </div>
          ) : (
            <StatusBadge label="Pendiente" variant="warning" />
          )
        ) : (
          <StatusBadge
            label={product.isActive ? "Activo" : "Inactivo"}
            variant={product.isActive ? "success" : "default"}
          />
        )}
      </TableCell>

      <TableCell className="hidden lg:table-cell">
        {product.averageRating != null ? (
          <div className="flex items-center gap-1 text-sm tabular-nums">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span>{product.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({product.reviewCount ?? 0})</span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sin resenas</span>
        )}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label={`Ver ${product.name} en tienda`}
            title="Ver en tienda"
          >
            <a href={`/marketplace/${product.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(product)}
            aria-label={`Editar ${product.name}`}
            title="Editar producto"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onManageImages(product)}
            aria-label={`Gestionar imagenes de ${product.name}`}
            title="Gestionar imagenes"
          >
            <ImageIcon className="h-4 w-4" aria-hidden="true" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product.id)}
            aria-label={`Eliminar ${product.name}`}
            title="Eliminar producto"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
