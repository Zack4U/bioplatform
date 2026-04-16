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
    price: number;
    stockQuantity: number;
    sku: string;
    isActive: boolean;
    thumbnailUrl: string | null;
    images: ProductImage[];
    rating?: number;
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
    sortOrder: number;
}

/** ProductListItem — lightweight DTO for catalog grid */
export interface ProductListItem {
    id: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    sku: string;
    isActive: boolean;
    stockQuantity: number;
    thumbnailUrl: string | null;
    entrepreneurName: string;
    categoryName: string | null;
    baseSpeciesName: string | null;
    rating: number | null;
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
    price: number;
    originalPrice?: number;
    stockQuantity: number;
    sku: string;
    isActive: boolean;
    images: ProductImage[];
    certifications: ProductCert[];
    traceability: TraceabilityBatch[];
    reviews: Review[];
    rating: number | null;
    reviewCount: number;
    createdAt: string;
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

/** SustainabilityCert — mirrors SustainabilityCerts table */
export interface SustainabilityCert {
    id: string;
    name: string;
    issuer: string;
    logoUrl: string | null;
}

/** ProductCert — product ↔ certification junction */
export interface ProductCert {
    certId: string;
    certName: string;
    issuer: string;
    logoUrl: string | null;
    validUntil: string | null;
    verificationCode: string | null;
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
export interface Review {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    rating: number;
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
    items: OrderItem[];
    createdAt: string;
}

export type OrderStatus =
    | "Pending"
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
    price: number;
    originalPrice?: number;
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
}

// ── Checkout / Addresses ─────────────────────────────────────────────────────

/** Shipping or billing address */
export interface Address {
    id: string;
    label: string;
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    department: string;
    postalCode: string;
    country: string;
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
