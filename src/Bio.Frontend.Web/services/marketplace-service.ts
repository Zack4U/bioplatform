/**
 * Marketplace service — real API layer for the Marketplace feature.
 *
 * All functions call the .NET Core backend via the typed Axios helpers
 * (apiGet, apiGetPaginated, apiPost, apiPut, apiDelete, apiUpload).
 * Route constants come exclusively from CORE_ROUTES — no magic strings.
 *
 * Cache policy (enforced in React Query hooks, not here):
 *   categories    → staleTime 30 min
 *   products list → staleTime  5 min
 *   product detail→ staleTime 10 min
 *   orders        → staleTime  2 min
 *
 * @module services/marketplace-service
 */

import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPost,
  apiPut,
  apiUpload,
} from "@/services/api";
import { CORE_ROUTES } from "@/services/routes/core-routes";
import type {
  AbsPermit,
  Address,
  CheckoutSessionResponse,
  CouponCode,
  CreateAddressRequest,
  CreateOrderRequest,
  CreateProductRequest,
  CreateReviewRequest,
  FavoriteStatus,
  ManageProductListItem,
  Order,
  PaginatedResponse,
  ProductCategory,
  CertificationResponseDTO,
  ProductDetailDTO,
  ProductImage,
  ProductListItem,
  ProductSearchParams,
  ProductReviewResponseDTO,
  UpdateAddressRequest,
  UpdateProductRequest,
} from "@/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map ProductSearchParams to the query-string object the backend expects.
 * Keys must exactly match the backend's [FromQuery] parameter names.
 */
function toQueryParams(params: ProductSearchParams): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};

  if (params.query !== undefined) mapped.q = params.query;
  if (params.categoryId !== undefined) mapped.categoryId = params.categoryId;
  if (params.minPrice !== undefined) mapped.minPrice = params.minPrice;
  if (params.maxPrice !== undefined) mapped.maxPrice = params.maxPrice;
  if (params.minRating !== undefined) mapped.minRating = params.minRating;
  if (params.page !== undefined) mapped.page = params.page;
  if (params.pageSize !== undefined) mapped.pageSize = params.pageSize;
  if (params.sortBy !== undefined) mapped.sortBy = params.sortBy;
  if (params.sortOrder !== undefined) mapped.sortOrder = params.sortOrder;
  if (params.isActive !== undefined) mapped.isActive = params.isActive;
  if (params.hasCertification !== undefined)
    mapped.hasCertification = params.hasCertification;
  if (params.entrepreneurId !== undefined)
    mapped.entrepreneurId = params.entrepreneurId;
  if (params.baseSpeciesId !== undefined)
    mapped.baseSpeciesId = params.baseSpeciesId;

  return mapped;
}

// ─── Products (public) ───────────────────────────────────────────────────────

/**
 * Get paginated, filtered, and sorted product list.
 * GET /api/products
 */
export async function getProducts(
  params: ProductSearchParams = {},
): Promise<PaginatedResponse<ProductListItem>> {
  return apiGetPaginated<ProductListItem>(
    CORE_ROUTES.PRODUCTS.BASE,
    toQueryParams(params),
  );
}

/**
 * Get full product detail by URL slug.
 * GET /api/products/slug/:slug
 */
export async function getProductBySlug(
  slug: string,
): Promise<ProductDetailDTO> {
  return apiGet<ProductDetailDTO>(CORE_ROUTES.PRODUCTS.BY_SLUG(slug));
}

/**
 * Get all product categories (used in filters and create-product form).
 * GET /api/products/categories
 */
export async function getCategories(): Promise<ProductCategory[]> {
  return apiGet<ProductCategory[]>(CORE_ROUTES.PRODUCTS.CATEGORIES);
}

/**
 * Get all approved reviews for a product.
 * GET /api/products/:productId/reviews
 */
export async function getProductReviews(productId: string): Promise<ProductReviewResponseDTO[]> {
  return apiGet<ProductReviewResponseDTO[]>(CORE_ROUTES.PRODUCTS.REVIEWS(productId));
}

/**
 * Submit a new review for a product (authenticated buyers only).
 * POST /api/products/:productId/reviews
 */
export async function createReview(
  productId: string,
  data: CreateReviewRequest,
): Promise<ProductReviewResponseDTO> {
  return apiPost<CreateReviewRequest, ProductReviewResponseDTO>(
    CORE_ROUTES.PRODUCTS.REVIEWS(productId),
    data,
  );
}

// ─── Products (entrepreneur manage) ──────────────────────────────────────────

/**
 * Get the authenticated entrepreneur's own product list (paginated).
 * GET /api/products/my
 */
export async function getMyProducts(
  params: ProductSearchParams = {},
): Promise<PaginatedResponse<ManageProductListItem>> {
  return apiGetPaginated<ManageProductListItem>(
    CORE_ROUTES.PRODUCTS.MY_PRODUCTS,
    toQueryParams(params),
  );
}

/**
 * Create a new product listing (entrepreneur only).
 * Requires an active AbsPermit for the selected species (Nagoya Protocol).
 * POST /api/products
 */
export async function createProduct(
  data: CreateProductRequest,
): Promise<ProductDetailDTO> {
  return apiPost<CreateProductRequest, ProductDetailDTO>(
    CORE_ROUTES.PRODUCTS.BASE,
    data,
  );
}

/**
 * Full update of an existing product (entrepreneur only).
 * PUT /api/products/:id
 */
export async function updateProduct(
  id: string,
  data: UpdateProductRequest,
): Promise<ProductDetailDTO> {
  return apiPut<UpdateProductRequest, ProductDetailDTO>(
    CORE_ROUTES.PRODUCTS.BY_ID(id),
    data,
  );
}

/**
 * Soft-delete a product (entrepreneur only).
 * DELETE /api/products/:id
 */
export async function deleteProduct(id: string): Promise<void> {
  await apiDelete<void>(CORE_ROUTES.PRODUCTS.BY_ID(id));
}

/**
 * Upload a new image to a product's gallery.
 * POST /manage/products/images/upload  (multipart/form-data)
 *
 * @param productId  — target product
 * @param file       — the image File object
 * @param isPrimary  — promote this image as cover (optional, default false)
 * @param altText    — accessibility alt text (optional)
 * @param onProgress — progress callback, receives 0-100 percent value
 */
export async function uploadProductImage(
  productId: string,
  file: File,
  isPrimary = false,
  altText?: string,
  onProgress?: (percent: number) => void,
): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("productId", productId);
  formData.append("file", file);
  formData.append("isPrimary", String(isPrimary));
  if (altText) formData.append("altText", altText);

  return apiUpload<ProductImage>(
    CORE_ROUTES.MANAGE_PRODUCTS.UPLOAD_IMAGE,
    formData,
    onProgress,
  );
}

/**
 * Delete a single product image by its own ID.
 * DELETE /manage/products/images/:imageId
 */
export async function deleteProductImage(imageId: string): Promise<void> {
  await apiDelete<void>(CORE_ROUTES.MANAGE_PRODUCTS.DELETE_IMAGE(imageId));
}

/**
 * Promote an image to primary / cover for its product.
 * PATCH /manage/products/images/:imageId/primary
 */
export async function setProductImagePrimary(imageId: string): Promise<void> {
  // The backend expects a PATCH with an empty body to flip the primary flag.
  await apiPut<Record<string, never>, void>(
    CORE_ROUTES.MANAGE_PRODUCTS.SET_IMAGE_PRIMARY(imageId),
    {},
  );
}

// ─── Orders ──────────────────────────────────────────────────────────────────

/**
 * Create a new order from the current checkout state.
 * POST /api/orders
 */
export async function createOrder(data: CreateOrderRequest): Promise<Order> {
  return apiPost<CreateOrderRequest, Order>(CORE_ROUTES.ORDERS.BASE, data);
}

/**
 * Get all orders belonging to the authenticated buyer (paginated), newest first.
 * GET /api/orders/mine
 */
export async function getMyOrders(
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<Order>> {
  return apiGetPaginated<Order>(CORE_ROUTES.ORDERS.MINE, { page, pageSize });
}

/**
 * Get a single order by its ID.
 * GET /api/orders/:orderId
 */
export async function getOrderById(orderId: string): Promise<Order> {
  return apiGet<Order>(CORE_ROUTES.ORDERS.BY_ID(orderId));
}

/**
 * Initiate a payment gateway checkout session for a pending order.
 * On success the caller should redirect to `checkoutUrl`.
 * POST /api/orders/:orderId/checkout-session
 */
export async function createCheckoutSession(
  orderId: string,
  returnUrl?: string,
): Promise<CheckoutSessionResponse> {
  const endpoint = returnUrl
    ? `${CORE_ROUTES.ORDERS.CHECKOUT_SESSION(orderId)}?returnUrl=${encodeURIComponent(returnUrl)}`
    : CORE_ROUTES.ORDERS.CHECKOUT_SESSION(orderId);
  const session = await apiPost<Record<string, never>, CheckoutSessionResponse>(
    endpoint,
    {},
  );
  return session;
}

/**
 * Validate a coupon code against the current subtotal.
 * Returns the coupon data when valid, or null when the code is unknown / expired.
 * POST /api/orders/validate-coupon
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponCode | null> {
  try {
    return await apiPost<{ code: string; subtotal: number }, CouponCode>(
      CORE_ROUTES.ORDERS.VALIDATE_COUPON,
      { code, subtotal },
    );
  } catch (err: unknown) {
    // The backend returns 404 or 422 for invalid / expired codes.
    // Treat these as "coupon not found" rather than hard errors.
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404 || status === 422 || status === 400) {
      return null;
    }
    throw err;
  }
}

// ─── Addresses ───────────────────────────────────────────────────────────────

/**
 * Get all saved addresses for the authenticated user.
 * GET /api/addresses
 */
export async function getAddresses(): Promise<Address[]> {
  return apiGet<Address[]>(CORE_ROUTES.ADDRESSES.BASE);
}

/**
 * Create a new address.
 * POST /api/addresses
 */
export async function createAddress(
  data: CreateAddressRequest,
): Promise<Address> {
  return apiPost<CreateAddressRequest, Address>(
    CORE_ROUTES.ADDRESSES.BASE,
    data,
  );
}

/**
 * Update an existing address.
 * PUT /api/addresses/:id
 */
export async function updateAddress(
  id: string,
  data: UpdateAddressRequest,
): Promise<Address> {
  return apiPut<UpdateAddressRequest, Address>(
    CORE_ROUTES.ADDRESSES.BY_ID(id),
    data,
  );
}

/**
 * Delete an address.
 * DELETE /api/addresses/:id
 */
export async function deleteAddress(id: string): Promise<void> {
  await apiDelete<void>(CORE_ROUTES.ADDRESSES.BY_ID(id));
}

/**
 * Mark an address as the user's default shipping address.
 * PUT /api/addresses/default  (body carries the target ID)
 */
export async function setDefaultAddress(id: string): Promise<Address> {
  return apiPut<{ id: string }, Address>(CORE_ROUTES.ADDRESSES.DEFAULT, {
    id,
  });
}

// ─── Favorites ────────────────────────────────────────────────────────────────

/**
 * Toggle whether a product is in the current user's favourites.
 * POST /api/favorites/:productId/toggle
 */
export async function toggleFavorite(
  productId: string,
): Promise<FavoriteStatus> {
  return apiPost<Record<string, never>, FavoriteStatus>(
    CORE_ROUTES.FAVORITES.TOGGLE(productId),
    {},
  );
}

/**
 * Check whether a product is already in the current user's favourites.
 * GET /api/favorites/:productId/check
 */
export async function checkFavorite(
  productId: string,
): Promise<FavoriteStatus> {
  return apiGet<FavoriteStatus>(CORE_ROUTES.FAVORITES.CHECK(productId));
}

/**
 * Get the authenticated user's list of favourited products (paginated).
 * GET /api/favorites
 */
export async function getFavorites(): Promise<
  PaginatedResponse<ProductListItem>
> {
  return apiGetPaginated<ProductListItem>(CORE_ROUTES.FAVORITES.BASE);
}

// ─── ABS Permits ──────────────────────────────────────────────────────────────

/**
 * Get all ABS permits belonging to the authenticated entrepreneur.
 * GET /api/abspermits
 */
export async function getMyAbsPermits(): Promise<AbsPermit[]> {
  return apiGet<AbsPermit[]>(CORE_ROUTES.ABS_PERMITS.BASE);
}

/**
 * Register a new ABS permit (multipart — includes PDF document upload).
 * POST /api/abspermits
 */
export async function createAbsPermit(data: FormData): Promise<AbsPermit> {
  return apiUpload<AbsPermit>(CORE_ROUTES.ABS_PERMITS.BASE, data);
}

// ─── Certifications ───────────────────────────────────────────────────────────

/**
 * Get all sustainability certifications associated with a product.
 * GET /api/certifications?productId=:productId
 */
export async function getProductCertifications(
  productId: string,
): Promise<CertificationResponseDTO[]> {
  return apiGet<CertificationResponseDTO[]>(CORE_ROUTES.CERTIFICATIONS.BASE, {
    productId,
  });
}

// ─── Cart Sync & Price Validation ─────────────────────────────────────────────

/** Inline types for cart sync/validation (avoid circular imports) */
export interface CartSyncItem { productId: string; quantity: number; }
export interface CartPriceItem { productId: string; quantity: number; }

export interface CartPriceValidationResult {
  productId: string;
  productName: string;
  currentPrice: number;
  isActive: boolean;
  availableStock: number;
  priceChanged: boolean;
  oldPrice?: number;
}

export interface CartValidatePricesResponse {
  items: CartPriceValidationResult[];
  anyPriceChanged: boolean;
  anyUnavailable: boolean;
}

/**
 * Sync the local (guest) cart with the server cart after the user logs in.
 * Server quantity wins on conflict. Inactive products are silently removed.
 * POST /api/v1/cart/sync
 */
export async function syncCart(
  items: CartSyncItem[],
): Promise<void> {
  await apiPost(CORE_ROUTES.CART.SYNC, { items });
}

/**
 * Validate current prices + availability for cart items without mutating state.
 * Returns current server prices so the frontend can detect price changes.
 * POST /api/v1/cart/validate-prices
 */
export async function validateCartPrices(
  items: CartPriceItem[],
): Promise<CartValidatePricesResponse> {
  return apiPost<{ items: CartPriceItem[] }, CartValidatePricesResponse>(
    CORE_ROUTES.CART.VALIDATE_PRICES,
    { items }
  );
}


// ─── My Reviews ───────────────────────────────────────────────────────────────

/** Review with product context returned from the "My Reviews" endpoint */
export interface MyReview {
  reviewId: string;
  productId: string;
  productName: string;
  productSlug: string;
  productThumbnailUrl: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
}

/**
 * Get all reviews submitted by the authenticated user, with product context.
 * GET /api/reviews/my
 */
export async function getMyReviews(
  page = 1,
  pageSize = 10,
): Promise<PaginatedResponse<MyReview>> {
  return apiGetPaginated<MyReview>(CORE_ROUTES.REVIEWS.MY, { page, pageSize });
}

// ─── Related Products ─────────────────────────────────────────────────────────

/**
 * Get products related to the given product (same category or same species).
 * Results are pre-sorted by rating desc, then name asc.
 * GET /api/products/:id/related
 */
export async function getRelatedProducts(
  productId: string,
  limit = 6,
): Promise<ProductListItem[]> {
  return apiGet<ProductListItem[]>(CORE_ROUTES.PRODUCTS.RELATED(productId), { limit });
}

// ─── Filter Metadata ──────────────────────────────────────────────────────────

export interface ProductFilterMeta {
  categories: ProductCategory[];
  minPrice: number;
  maxPrice: number;
  totalProducts: number;
}

/**
 * Get filter metadata: all categories, price range, total product count.
 * Cached 15 min on the backend (Redis). Frontend caches 30 min via React Query.
 * GET /api/products/filter-meta
 */
export async function getProductFilterMeta(): Promise<ProductFilterMeta> {
  return apiGet<ProductFilterMeta>(CORE_ROUTES.PRODUCTS.FILTER_META);
}
