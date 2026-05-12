"use client";

import {
    DeleteProductDialog,
    ProductFormSheet,
    ProductImageManager,
    ProductManagementTable,
} from "@/components/features/marketplace/product-management";
import { Button } from "@/components/ui/button";
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
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

export function ProductsManagement() {
    // Queries for select options
    const { data: categories = [] } = useQuery<ProductCategory[]>({
        queryKey: ["categories"],
        queryFn: getCategories,
        staleTime: 30 * 60 * 1000,
    });

    const { data: absPermits = [] } = useQuery<AbsPermit[]>({
        queryKey: ["abs-permits", "mine"],
        queryFn: getMyAbsPermits,
        staleTime: 5 * 60 * 1000,
    });

    // Main hook
    const {
        products,
        isLoading,
        isFetching,
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
                        Gestion de Productos
                    </h1>
                    <p className="text-muted-foreground">
                        Administra tus productos, precios e inventario
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Nuevo Producto
                </Button>
            </div>

            <ProductManagementTable
                products={products}
                isLoading={isLoading}
                isFetching={isFetching}
                onEdit={handleOpenEdit}
                onDelete={setProductToDelete}
                onManageImages={handleOpenImages}
            />

            <ProductFormSheet
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                isSubmitting={isCreating || isUpdating}
                editingProduct={editingProduct}
                categories={categories}
                absPermits={absPermits}
            />

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
        </div>
    );
}
