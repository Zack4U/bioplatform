"use client";

/**
 * ProductManagementTable — entrepreneur's product dashboard table.
 *
 * Renders the paginated list of the authenticated entrepreneur's products.
 * Columns: Thumbnail, Name + SKU, Category, Price, Stock, Status, Rating, Actions.
 *
 * UI ONLY — no logic. All data and callbacks come from the parent page
 * which wires them from useProductManagement.
 *
 * WCAG 2.1 AA:
 *  - Table with proper <caption>, <th scope>, aria-labels on icon buttons.
 *  - Skeleton rows announce "Cargando productos" via aria-busy on the table.
 *  - Status badge: color + text label (never color alone).
 *
 * @module components/features/marketplace/product-management/ProductManagementTable
 */

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
import { ImageIcon, Package, Pencil, Star, Trash2 } from "lucide-react";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProductManagementTableProps {
  products: ManageProductListItem[];
  isLoading: boolean;
  isFetching: boolean;
  onEdit: (product: ManageProductListItem) => void;
  onDelete: (productId: string) => void;
  onManageImages: (product: ManageProductListItem) => void;
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {/* Thumbnail */}
      <TableCell>
        <Skeleton className="h-12 w-12 rounded-md" />
      </TableCell>
      {/* Name + SKU */}
      <TableCell>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-20" />
        </div>
      </TableCell>
      {/* Category */}
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      {/* Price */}
      <TableCell>
        <Skeleton className="h-4 w-16" />
      </TableCell>
      {/* Stock */}
      <TableCell>
        <Skeleton className="h-4 w-10" />
      </TableCell>
      {/* Status */}
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      {/* Rating */}
      <TableCell>
        <Skeleton className="h-4 w-12" />
      </TableCell>
      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}

// ─── Price formatter ──────────────────────────────────────────────────────────

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProductManagementTable({
  products,
  isLoading,
  isFetching,
  onEdit,
  onDelete,
  onManageImages,
}: ProductManagementTableProps) {
  const showSkeleton = isLoading;
  const showEmpty = !isLoading && products.length === 0;

  if (showEmpty) {
    return (
      <EmptyState
        icon={<Package className="h-8 w-8" aria-hidden="true" />}
        title="No tienes productos publicados"
        description="Crea tu primer producto haciendo clic en el boton 'Nuevo Producto'."
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
          Lista de productos del emprendedor
        </TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead scope="col" className="w-[64px]">
              Imagen
            </TableHead>
            <TableHead scope="col">Producto</TableHead>
            <TableHead scope="col" className="hidden md:table-cell">
              Categoria
            </TableHead>
            <TableHead scope="col">Precio</TableHead>
            <TableHead scope="col" className="hidden sm:table-cell">
              Stock
            </TableHead>
            <TableHead scope="col">Estado</TableHead>
            <TableHead scope="col" className="hidden lg:table-cell">
              Calificacion
            </TableHead>
            <TableHead scope="col" className="text-right">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody aria-busy={showSkeleton}>
          {showSkeleton
            ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            : products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManageImages={onManageImages}
                />
              ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Product row ──────────────────────────────────────────────────────────────

interface ProductRowProps {
  product: ManageProductListItem;
  onEdit: (product: ManageProductListItem) => void;
  onDelete: (productId: string) => void;
  onManageImages: (product: ManageProductListItem) => void;
}

function ProductRow({
  product,
  onEdit,
  onDelete,
  onManageImages,
}: ProductRowProps) {
  return (
    <TableRow>
      {/* ── Thumbnail ──────────────────────────────────────────────────── */}
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
              <Package
                className="h-5 w-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      </TableCell>

      {/* ── Name + SKU ─────────────────────────────────────────────────── */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="max-w-[200px] truncate font-medium leading-snug">
            {product.name}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            SKU: {product.sku}
          </span>
          {product.baseSpeciesName && (
            <span className="hidden text-xs text-muted-foreground xl:block">
              {product.baseSpeciesName}
            </span>
          )}
        </div>
      </TableCell>

      {/* ── Category ───────────────────────────────────────────────────── */}
      <TableCell className="hidden md:table-cell">
        <span className="text-sm text-muted-foreground">
          {product.categoryName ?? "-"}
        </span>
      </TableCell>

      {/* ── Price ──────────────────────────────────────────────────────── */}
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

      {/* ── Stock ──────────────────────────────────────────────────────── */}
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

      {/* ── Status badge ───────────────────────────────────────────────── */}
      <TableCell>
        <StatusBadge
          label={product.isActive ? "Activo" : "Inactivo"}
          variant={product.isActive ? "success" : "default"}
        />
      </TableCell>

      {/* ── Rating ─────────────────────────────────────────────────────── */}
      <TableCell className="hidden lg:table-cell">
        {product.averageRating !== null ? (
          <div className="flex items-center gap-1 text-sm tabular-nums">
            <Star
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            <span>{product.averageRating.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sin resenas</span>
        )}
      </TableCell>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
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
