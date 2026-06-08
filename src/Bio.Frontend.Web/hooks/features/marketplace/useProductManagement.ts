/**
 * useProductManagement — entrepreneur product management dashboard hook.
 *
 * Orchestrates all logic for the "My Products" dashboard:
 *   - URL-synced search params (mirrors useProductCatalog pattern)
 *   - Paginated fetch of the authenticated entrepreneur's products
 *   - Create / Update / Delete mutations with cache invalidation
 *   - Delete confirmation flow (productToDelete state)
 *   - Image upload with progress tracking
 *   - Image deletion
 *
 * Architecture: Hook Pattern (copilot-instructions.md §2.2)
 *  - This hook → ALL logic
 *  - ManageProductsTable / ProductFormModal → UI ONLY
 *
 * @module hooks/features/marketplace/useProductManagement
 */

"use client";

import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  getMyProducts,
  updateProduct,
  uploadProductImage,
} from "@/services/marketplace-service";
import { activateProduct, deactivateProduct } from "@/services/admin-service";
import type {
  CreateProductRequest,
  ManageProductListItem,
  PaginatedResponse,
  ProductDetailDTO,
  ProductSearchParams,
  UpdateProductRequest,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const MANAGE_DEFAULT_PAGE_SIZE = 10;

// ─── URL ↔ ProductSearchParams (management variant) ──────────────────────────

const PARAM_MAP = {
  query: "q",
  page: "pagina",
  sortBy: "ordenar",
  sortOrder: "dir",
  isActive: "activo",
} as const;

function urlToManageParams(urlParams: URLSearchParams): ProductSearchParams {
  const params: ProductSearchParams = {
    pageSize: MANAGE_DEFAULT_PAGE_SIZE,
  };

  const q = urlParams.get(PARAM_MAP.query);
  if (q) params.query = q;

  const page = urlParams.get(PARAM_MAP.page);
  params.page = page ? Math.max(1, parseInt(page, 10) || 1) : 1;

  const sortBy = urlParams.get(PARAM_MAP.sortBy);
  if (
    sortBy === "name" ||
    sortBy === "price" ||
    sortBy === "rating" ||
    sortBy === "createdAt"
  ) {
    params.sortBy = sortBy;
  } else {
    params.sortBy = "createdAt";
  }

  const sortOrder = urlParams.get(PARAM_MAP.sortOrder);
  if (sortOrder === "asc" || sortOrder === "desc") {
    params.sortOrder = sortOrder;
  } else {
    params.sortOrder = "desc";
  }

  const isActive = urlParams.get(PARAM_MAP.isActive);
  if (isActive === "true") params.isActive = true;
  if (isActive === "false") params.isActive = false;

  return params;
}

function manageParamsToUrl(params: ProductSearchParams): string {
  const urlParams = new URLSearchParams();

  if (params.query) urlParams.set(PARAM_MAP.query, params.query);
  if (params.page && params.page > 1)
    urlParams.set(PARAM_MAP.page, String(params.page));
  if (params.sortBy && params.sortBy !== "createdAt")
    urlParams.set(PARAM_MAP.sortBy, params.sortBy);
  if (params.sortOrder && params.sortOrder !== "desc")
    urlParams.set(PARAM_MAP.sortOrder, params.sortOrder);
  if (params.isActive !== undefined)
    urlParams.set(PARAM_MAP.isActive, String(params.isActive));

  const qs = urlParams.toString();
  return qs ? `?${qs}` : "";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProductManagement(initialParams?: ProductSearchParams) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const urlSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // ── Image upload state ─────────────────────────────────────────────────

  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ── Delete confirmation state ──────────────────────────────────────────

  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // ── URL-synced search params ───────────────────────────────────────────

  const searchParams = useMemo<ProductSearchParams>(() => {
    // When URL has no params yet, fall back to caller's initialParams
    const fromUrl = urlToManageParams(urlSearchParams);
    if (!urlSearchParams.toString() && initialParams) {
      return {
        pageSize: MANAGE_DEFAULT_PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
        page: 1,
        ...initialParams,
      };
    }
    return fromUrl;
  }, [urlSearchParams, initialParams]);

  const pushParams = useCallback(
    (newParams: ProductSearchParams) => {
      startTransition(() => {
        const qs = manageParamsToUrl(newParams);
        router.push(`${pathname}${qs}`, { scroll: false });
      });
    },
    [router, pathname],
  );

  // ── React Query — my products list ────────────────────────────────────

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
    PaginatedResponse<ManageProductListItem>
  >({
    queryKey: ["manage", "products", searchParams],
    queryFn: () => getMyProducts(searchParams),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Derived pagination
  const products = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const currentPage = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = data?.hasNextPage ?? false;
  const hasPreviousPage = data?.hasPreviousPage ?? false;
  const isEmpty = !isLoading && products.length === 0;

  // ── Invalidation helpers ───────────────────────────────────────────────

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["manage", "products"] });
    queryClient.invalidateQueries({
      queryKey: ["marketplace", "products"],
    });
  }, [queryClient]);

  // ── Create product ─────────────────────────────────────────────────────

  const { mutate: createProductAction, isPending: isCreating } = useMutation<
    ProductDetailDTO,
    Error,
    CreateProductRequest
  >({
    mutationFn: (data) => createProduct(data),
    onSuccess: (created) => {
      invalidateAll();
      toast.success(`Producto "${created.name}" creado exitosamente.`);
    },
    onError: () => {
      toast.error(
        "No se pudo crear el producto. Verifica los datos e intenta de nuevo.",
      );
    },
  });

  // ── Update product ─────────────────────────────────────────────────────

  const { mutate: updateProductAction, isPending: isUpdating } = useMutation<
    ProductDetailDTO,
    Error,
    { id: string; data: UpdateProductRequest }
  >({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (updated) => {
      invalidateAll();
      // Also invalidate the individual product detail cache
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "product", updated.slug],
      });
      toast.success(`Producto "${updated.name}" actualizado exitosamente.`);
    },
    onError: () => {
      toast.error("No se pudo actualizar el producto. Intenta de nuevo.");
    },
  });

  // ── Delete product ─────────────────────────────────────────────────────

  const { mutate: deleteProductAction, isPending: isDeleting } = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      invalidateAll();
      setProductToDelete(null);
      toast.success("Producto eliminado exitosamente.");
    },
    onError: () => {
      toast.error("No se pudo eliminar el producto. Intenta de nuevo.");
    },
  });

  const confirmDelete = useCallback(() => {
    if (productToDelete) {
      deleteProductAction(productToDelete);
    }
  }, [productToDelete, deleteProductAction]);

  // ── Activate / Deactivate (admin only) ────────────────────────────────

  const { mutate: activateProductAction, isPending: isActivating } = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: (id) => activateProduct(id),
    onSuccess: () => {
      invalidateAll();
      toast.success("Producto activado exitosamente.");
    },
    onError: () => {
      toast.error("No se pudo activar el producto. Intenta de nuevo.");
    },
  });

  const { mutate: deactivateProductAction, isPending: isDeactivating } = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: (id) => deactivateProduct(id),
    onSuccess: () => {
      invalidateAll();
      toast.success("Producto desactivado exitosamente.");
    },
    onError: () => {
      toast.error("No se pudo desactivar el producto. Intenta de nuevo.");
    },
  });

  // ── Image upload ───────────────────────────────────────────────────────

  const uploadImage = useCallback(
    async (
      productId: string,
      file: File,
      isPrimary?: boolean,
      altText?: string,
    ) => {
      setIsUploadingImage(true);
      setImageUploadProgress(0);

      try {
        const image = await uploadProductImage(
          productId,
          file,
          isPrimary,
          altText,
          (progress) => setImageUploadProgress(progress),
        );

        // Invalidate the product detail so the new image appears
        queryClient.invalidateQueries({
          queryKey: ["manage", "products"],
        });
        queryClient.invalidateQueries({
          queryKey: ["marketplace", "products"],
        });

        toast.success("Imagen subida exitosamente.");
        return image;
      } catch {
        toast.error(
          "No se pudo subir la imagen. Verifica el archivo e intenta de nuevo.",
        );
        throw new Error("Image upload failed");
      } finally {
        setIsUploadingImage(false);
        setImageUploadProgress(0);
      }
    },
    [queryClient],
  );

  // ── Image deletion ─────────────────────────────────────────────────────

  const { mutate: deleteImage, isPending: isDeletingImage } = useMutation<
    void,
    Error,
    string
  >({
    mutationFn: (imageId) => deleteProductImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage", "products"] });
      queryClient.invalidateQueries({
        queryKey: ["marketplace", "products"],
      });
      toast.success("Imagen eliminada exitosamente.");
    },
    onError: () => {
      toast.error("No se pudo eliminar la imagen. Intenta de nuevo.");
    },
  });

  // ── Search / filter / pagination actions ──────────────────────────────

  const setSearch = useCallback(
    (query: string) => {
      pushParams({
        ...searchParams,
        query: query || undefined,
        page: 1,
      });
    },
    [searchParams, pushParams],
  );

  const setPage = useCallback(
    (page: number) => {
      pushParams({ ...searchParams, page });
    },
    [searchParams, pushParams],
  );

  const setFilter = useCallback(
    <K extends keyof ProductSearchParams>(
      key: K,
      value: ProductSearchParams[K],
    ) => {
      pushParams({ ...searchParams, [key]: value, page: 1 });
    },
    [searchParams, pushParams],
  );

  const clearFilters = useCallback(() => {
    pushParams({
      page: 1,
      pageSize: MANAGE_DEFAULT_PAGE_SIZE,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, [pushParams]);

  // ── Public API ─────────────────────────────────────────────────────────

  return {
    // Data
    products,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    isEmpty,

    // Loading / error
    isLoading,
    isFetching,
    isPending,
    isError,
    error,
    refetch,

    // Search params
    searchParams,
    setSearch,
    setPage,
    setFilter,
    clearFilters,

    // CRUD
    createProduct: createProductAction,
    isCreating,
    updateProduct: updateProductAction,
    isUpdating,
    deleteProduct: deleteProductAction,
    isDeleting,

    // Delete confirmation
    productToDelete,
    setProductToDelete,
    confirmDelete,

    // Image upload
    uploadImage,
    imageUploadProgress,
    isUploadingImage,

    // Image deletion
    deleteImage,
    isDeletingImage,

    // Activate / Deactivate
    activateProduct: activateProductAction,
    isActivating,
    deactivateProduct: deactivateProductAction,
    isDeactivating,
  };
}
