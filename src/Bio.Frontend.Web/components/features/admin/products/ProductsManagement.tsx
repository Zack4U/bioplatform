"use client";

import {
    DeleteProductDialog,
    ProductFormSheet,
    ProductImageManager,
    ProductManagementTable,
} from "@/components/features/marketplace/product-management";
import { Button } from "@/components/ui/button";
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
    } = useProductManagement();

    // Local state for modals/sheets
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] =
        useState<ManageProductListItem | null>(null);
    const [managingImagesProduct, setManagingImagesProduct] =
        useState<ManageProductListItem | null>(null);

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
                    onSuccess: () => setIsFormOpen(false),
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
                              const reason = window.prompt("Motivo del rechazo:");
                              if (reason && reason.trim()) {
                                  rejectProduct({ id, reason: reason.trim() });
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
        </div>
    );
}
