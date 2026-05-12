/**
 * TypeScript types — Marketplace & Legal (SQL Server)
 * Maps to: BioCommerce_Transactional database (Marketplace context)
 *
 * @module types/marketplace
 */

// ── Product ──────────────────────────────────────────────────────────────────

/** Product — mirrors Products table (SQL Server) */
export interface Product {
  id: string;
  slug: string;
  entrepreneurId: string;
  /** Logical FK to Species (PostgreSQL) — linked via UUID */
  baseSpeciesId: string;
  categoryId: number | null;
  name: string;
  description: string;
  basePrice: number;
  sellPrice: number;
  stockQuantity: number;
  sku: string;
  composition?: string | null;
  isActive: boolean;
  thumbnailUrl: string | null;
  images: ProductImage[];
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/** ProductImage — product gallery */
export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

/** ProductListItem — lightweight DTO for catalog grid */
export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  sellPrice: number;
  sku: string;
  isActive: boolean;
  stockQuantity: number;
  thumbnailUrl: string | null;
  entrepreneurName: string;
  categoryName: string | null;
  baseSpeciesName: string | null;
  averageRating: number | null;
  reviewCount: number;
  certifications: string[];
}

/** Full product detail DTO (for /marketplace/[slug]) */
export interface ProductDetailDTO {
  id: string;
  slug: string;
  entrepreneurId: string;
  entrepreneurName: string;
  baseSpeciesId: string;
  baseSpeciesName: string | null;
  baseSpeciesSlug: string | null;
  categoryId: number | null;
  categoryName: string | null;
  name: string;
  description: string;
  basePrice: number;
  sellPrice: number;
  stockQuantity: number;
  sku: string;
  composition?: string | null;
  isActive: boolean;
  images: ProductImage[];
  certifications: CertificationResponseDTO[];
  traceability: TraceabilityBatch[];
  reviews: ProductReviewResponseDTO[];
  averageRating: number | null;
  reviewCount: number;
  createdAt: string;
}

/**
 * ManageProductListItem — extends ProductListItem with entrepreneur-facing
 * fields shown in the dashboard product table.
 */
export interface ManageProductListItem extends ProductListItem {
  entrepreneurId: string;
  baseSpeciesId: string;
  categoryId: number | null;
  description: string;
  updatedAt: string | null;
  /** ABS permit ID associated with this product (Nagoya Protocol) */
  absPermitId: string | null;
}

// ── Categories ───────────────────────────────────────────────────────────────

/** ProductCategory — mirrors ProductCategories table */
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
}

// ── Certifications ───────────────────────────────────────────────────────────

export interface CertificationResponseDTO {
  id: string;
  productId: string;
  name: string;
  certificationType: string;
  issuingBody: string;
  certificateNumber: string | null;
  issuedAt: string;
  expiresAt: string | null;
  status: string;
  documentUrl: string | null;
  logoUrl: string | null;
  verificationCode: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// ── Traceability ─────────────────────────────────────────────────────────────

/** TraceabilityBatch — origin traceability batch */
export interface TraceabilityBatch {
  id: string;
  batchCode: string;
  harvestDate: string;
  originLocation: string;
  processingDetails: string | null;
  blockchainHash: string | null;
}

// ── Reviews ──────────────────────────────────────────────────────────────────

/** Review — mirrors Reviews table */
export interface ProductReviewResponseDTO {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
}

// ── ABS Permits ──────────────────────────────────────────────────────────────

/** ABS Permit — mirrors AbsPermits table. Critical for Nagoya Protocol compliance. */
export interface AbsPermit {
  id: string;
  entrepreneurId: string;
  /** Logical FK to Species (PostgreSQL) */
  speciesId: string;
  resolutionNumber: string;
  emissionDate: string;
  expirationDate: string;
  grantingAuthority: string;
  status: AbsPermitStatus;
}

export type AbsPermitStatus = "Active" | "Suspended" | "Expired" | "Revoked";

// ── Orders ───────────────────────────────────────────────────────────────────

/** Order — mirrors Orders table */
export interface Order {
  id: string;
  orderNumber: string;
  buyerId: string;
  totalAmount: number;
  subtotalAmount: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  transactionRef: string | null;
  notes?: string | null;
  items: OrderItem[];
  shippingAddress?: {
    streetLine1: string;
    streetLine2?: string;
    city: string;
    department: string;
    postalCode: string;
  } | null;
  createdAt: string;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Paid"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Refunded";


/** OrderItem — line items within an order */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// ── Cart (client-side) ───────────────────────────────────────────────────────

/** Cart item stored in zustand (persisted in localStorage) */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  sellPrice: number;
  basePrice?: number;
  quantity: number;
  thumbnailUrl: string | null;
  sku: string;
  maxStock: number;
}

// ── Search / Filters ─────────────────────────────────────────────────────────

/** Product search/filter params — used in URL sync */
export interface ProductSearchParams {
  query?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  entrepreneurId?: string;
  baseSpeciesId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "name" | "price" | "createdAt" | "rating";
  sortOrder?: "asc" | "desc";
  /** Filter to only active (published) products */
  isActive?: boolean;
  /** Filter to only products that have at least one sustainability certification */
  hasCertification?: boolean;
}

// ── Checkout / Addresses ─────────────────────────────────────────────────────

/** Shipping or billing address */
export interface Address {
  id: string;
  addressType: string;
  recipientName: string;
  streetLine1: string;
  streetLine2?: string | null;
  city: string;
  department: string;
  postalCode: string;
  country: string;
  phoneNumber?: string | null;
  isDefault: boolean;
}

/** Coupon code for checkout discounts */
export interface CouponCode {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount: number;
  isValid: boolean;
  description: string;
}

/** Checkout step identifiers — used in URL ?tab= */
export type CheckoutStep = "resumen" | "direccion" | "pagar";

/** Computed order summary (derived from cart + shipping + tax + discounts) */
export interface OrderSummaryData {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  itemCount: number;
  coupon: CouponCode | null;
}

// ── Favorites ─────────────────────────────────────────────────────────────────

/** Favorite status — returned by toggle and check endpoints */
export interface FavoriteStatus {
  productId: string;
  isFavorite: boolean;
}

// ── Request / Command types ───────────────────────────────────────────────────

/** Payload for creating a new product (entrepreneur only) */
export interface CreateProductRequest {
  name: string;
  description: string;
  basePrice: number;
  sellPrice: number;
  stockQuantity: number;
  sku: string;
  categoryId: number | null;
  /** Logical FK to Species (PostgreSQL) — required for ABS compliance */
  baseSpeciesId: string;
  /** Must reference an Active AbsPermit belonging to the authenticated user */
  absPermitId: string;
  isActive?: boolean;
}

/** Payload for updating an existing product (entrepreneur only) */
export interface UpdateProductRequest {
  name: string;
  description: string;
  basePrice: number;
  sellPrice: number;
  stockQuantity: number;
  sku: string;
  categoryId: number | null;
  baseSpeciesId: string;
  absPermitId: string;
  isActive?: boolean;
}

/** Payload for posting a new product review */
export interface CreateReviewRequest {
  rating: number;
  comment: string;
}

/** Payload for creating a new shipping / billing address */
export interface CreateAddressRequest {
  addressType: string;
  recipientName: string;
  streetLine1: string;
  streetLine2?: string | null;
  city: string;
  department: string;
  postalCode: string;
  country: string;
  phoneNumber?: string | null;
  isDefault: boolean;
}

/** Payload for updating an existing address — same shape as create */
export type UpdateAddressRequest = CreateAddressRequest;

/** Payload for creating an order from the checkout flow */
export interface CreateOrderRequest {
  cartItems: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddressId: string;
  billingAddressId?: string;
  /** When true the billing address is the same as the shipping address */
  useSameAddress: boolean;
  orderNotes?: string;
  couponCode?: string;
}

/** Response from the payment gateway when initiating a checkout session */
export interface CheckoutSessionResponse {
  /** External URL to redirect the user to (Stripe / PSE hosted page) */
  checkoutUrl: string;
  /** Gateway-generated session identifier */
  sessionId: string;
  /** Internal order ID that the session is tied to */
  orderId: string;
}
