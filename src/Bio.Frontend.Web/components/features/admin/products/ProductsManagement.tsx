"use client";

import {
    DeleteProductDialog,
    ProductFormSheet,
    ProductImageManager,
    ProductManagementTable,
} from "@/components/features/marketplace/product-management";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/common/Pagination";
import { SearchInput } from "@/components/common/SearchInput";
import { useProductManagement } from "@/hooks/features/marketplace/useProductManagement";
import {
    getCategories,
    getMyAbsPermits,
    getProductBySlug,
} from "@/services/marketplace-service";
import type {
    AbsPermit,
    ManageProductListItem,
    ProductCategory,
    ProductDetailDTO,
    UpdateProductRequest,
} from "@/types";
import { useAuthStore } from "@/store/auth-store";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

export function ProductsManagement() {
    const { user } = useAuthStore();
    // Admin + Authority get the global moderation view (approve/reject pending products).
    const isAdmin =
        (user?.roles?.includes("ADMIN") ?? false) ||
        (user?.roles?.includes("AUTHORITY") ?? false);

    // Queries for select options
    const { data: categories = [] } = useQuery<ProductCategory[]>({
        queryKey: ["categories"],
        queryFn: getCategories,
        staleTime: 30 * 60 * 1000,
    });

    const { data: absPermits = [] } = useQuery<AbsPermit[]>({
        queryKey: ["abs-permits", "mine", user?.id],
        queryFn: () => getMyAbsPermits(user!.id),
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
    });

    // Main hook
    const {
        products,
        isLoading,
        isFetching,
        searchParams,
        setSearch,
        setPage,
        currentPage,
        totalPages,
        createProduct,
        isCreating,
        updateProduct,
        isUpdating,
        isDeleting,
        productToDelete,
        setProductToDelete,
        confirmDelete,
        uploadImage,
        imageUploadProgress,
        isUploadingImage,
        deleteImage,
        isDeletingImage,
        activateProduct,
        deactivateProduct,
        approveProduct,
        rejectProduct,
        unapproveProduct,
    } = useProductManagement();

    // Local state for modals/sheets
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] =
        useState<ManageProductListItem | null>(null);
    const [managingImagesProduct, setManagingImagesProduct] =
        useState<ManageProductListItem | null>(null);
    const [rejectingProduct, setRejectingProduct] = useState<ManageProductListItem | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [unapprovingProduct, setUnapprovingProduct] = useState<ManageProductListItem | null>(null);

    // Fetch full details of the product being image-managed to get its images
    const { data: productDetail, isLoading: isLoadingImages } =
        useQuery<ProductDetailDTO | null>({
            queryKey: ["marketplace", "product", managingImagesProduct?.slug],
            queryFn: () => getProductBySlug(managingImagesProduct!.slug),
            enabled: !!managingImagesProduct?.slug,
        });

    // Handlers
    function handleOpenCreate() {
        setEditingProduct(null);
        setIsFormOpen(true);
    }

    function handleOpenEdit(product: ManageProductListItem) {
        setEditingProduct(product);
        setIsFormOpen(true);
    }

    function handleFormSubmit(data: UpdateProductRequest) {
        if (editingProduct) {
            updateProduct(
                { id: editingProduct.id, data },
                {
                    onSuccess: () => {
                        if (editingProduct.isActive !== data.isActive) {
                            if (data.isActive) {
                                activateProduct(editingProduct.id);
                            } else {
                                deactivateProduct(editingProduct.id);
                            }
                        }
                        setIsFormOpen(false);
                    },
                },
            );
        } else {
            createProduct(data, {
                onSuccess: () => setIsFormOpen(false),
            });
        }
    }

    function handleOpenImages(product: ManageProductListItem) {
        setManagingImagesProduct(product);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                        {isAdmin ? "Todos los Productos" : "Gestion de Productos"}
                    </h1>
                    <p className="text-muted-foreground">
                        {isAdmin
                            ? "Vista global de productos en la plataforma"
                            : "Administra tus productos, precios e inventario"}
                    </p>
                </div>
                {!isAdmin && (
                    <Button onClick={handleOpenCreate} className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                        Nuevo Producto
                    </Button>
                )}
            </div>

            {/* Search */}
            <SearchInput
                placeholder="Buscar por nombre o descripcion..."
                value={searchParams.query ?? ""}
                onChange={setSearch}
                aria-label="Buscar productos"
                className="max-w-md"
            />

            <ProductManagementTable
                products={products}
                isLoading={isLoading}
                isFetching={isFetching}
                isAdmin={isAdmin}
                onEdit={handleOpenEdit}
                onDelete={setProductToDelete}
                onManageImages={handleOpenImages}
                onActivate={isAdmin ? (id) => activateProduct(id) : undefined}
                onDeactivate={isAdmin ? (id) => deactivateProduct(id) : undefined}
                onApprove={isAdmin ? (id) => approveProduct(id) : undefined}
                onReject={
                    isAdmin
                        ? (id) => {
                              const prod = products.find((p) => p.id === id);
                              if (prod) {
                                  setRejectingProduct(prod);
                                  setRejectReason("");
                              }
                          }
                        : undefined
                }
                onUnapprove={
                    isAdmin
                        ? (id) => {
                              const prod = products.find((p) => p.id === id);
                              if (prod) {
                                  setUnapprovingProduct(prod);
                              }
                          }
                        : undefined
                }
            />

            {!isLoading && totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    className="mt-4"
                />
            )}

            {!isAdmin && (
                <ProductFormSheet
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleFormSubmit}
                    isSubmitting={isCreating || isUpdating}
                    editingProduct={editingProduct}
                    categories={categories}
                    absPermits={absPermits}
                />
            )}

            {managingImagesProduct && (
                <ProductImageManager
                    isOpen={!!managingImagesProduct}
                    onClose={() => setManagingImagesProduct(null)}
                    product={managingImagesProduct}
                    images={productDetail?.images ?? []}
                    isLoadingImages={isLoadingImages}
                    onUpload={(file, isPrimary, altText) => {
                        uploadImage(
                            managingImagesProduct.id,
                            file,
                            isPrimary,
                            altText,
                        );
                    }}
                    onDelete={deleteImage}
                    onSetPrimary={() => {}}
                    isUploading={isUploadingImage}
                    uploadProgress={imageUploadProgress}
                    isDeleting={isDeletingImage}
                />
            )}

            {!isAdmin && (
                <DeleteProductDialog
                    isOpen={!!productToDelete}
                    onClose={() => setProductToDelete(null)}
                    onConfirm={confirmDelete}
                    isDeleting={isDeleting}
                    productId={productToDelete ?? ""}
                    productName={
                        products.find((p) => p.id === productToDelete)?.name ?? ""
                    }
                />
            )}

            {/* Dialog to Reject Product */}
            <Dialog open={!!rejectingProduct} onOpenChange={(open) => !open && setRejectingProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Producto</DialogTitle>
                        <DialogDescription>
                            Por favor, ingresa el motivo del rechazo para el producto{" "}
                            <span className="font-semibold">{rejectingProduct?.name}</span>. El emprendedor podrá ver este motivo para realizar correcciones.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        placeholder="Escribe el motivo del rechazo..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="min-h-[100px]"
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectingProduct(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={!rejectReason.trim()}
                            onClick={() => {
                                if (rejectingProduct && rejectReason.trim()) {
                                    rejectProduct({ id: rejectingProduct.id, reason: rejectReason.trim() });
                                    setRejectingProduct(null);
                                    setRejectReason("");
                                }
                            }}
                        >
                            Rechazar Producto
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog to Confirm Unapproval */}
            <Dialog open={!!unapprovingProduct} onOpenChange={(open) => !open && setUnapprovingProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Desaprobar Producto</DialogTitle>
                        <DialogDescription>
                            ¿Está seguro de que desea desaprobar el producto{" "}
                            <span className="font-semibold">{unapprovingProduct?.name}</span>? Esto anulará su aprobación, borrará los registros de aprobación y lo desactivará del marketplace.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUnapprovingProduct(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (unapprovingProduct) {
                                    unapproveProduct(unapprovingProduct.id);
                                    setUnapprovingProduct(null);
                                }
                            }}
                        >
                            Confirmar Desaprobación
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
