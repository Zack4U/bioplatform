/**
 * TypeScript types — Marketplace & Legal (SQL Server)
 * Maps to: BioCommerce_Transactional database (Marketplace context)
 */

/** Product — mirrors Products table (SQL Server) */
export interface Product {
    id: string;
    entrepreneurId: string;
    /** Logical FK to Species (PostgreSQL) — linked via UUID */
    baseSpeciesId: string;
    name: string;
    description: string;
    price: number;
    stockQuantity: number;
    sku: string;
    status: ProductStatus;
    images: ProductImage[];
    rating?: number;
    reviewCount?: number;
    createdAt: string;
    updatedAt?: string;
}

export type ProductStatus = "Draft" | "Active" | "OutOfStock" | "Suspended";

/** ProductImage — product gallery */
export interface ProductImage {
    id: string;
    productId: string;
    imageUrl: string;
    isPrimary: boolean;
    sortOrder: number;
}

/** ProductListItem — lightweight DTO for catalog grid */
export interface ProductListItem {
    id: string;
    name: string;
    price: number;
    sku: string;
    status: ProductStatus;
    thumbnailUrl: string | null;
    entrepreneurName: string;
    baseSpeciesName: string | null;
    rating: number | null;
    reviewCount: number;
}

/** Product search/filter params */
export interface ProductSearchParams {
    query?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: ProductStatus;
    entrepreneurId?: string;
    baseSpeciesId?: string;
    page?: number;
    pageSize?: number;
    sortBy?: "name" | "price" | "createdAt" | "rating";
    sortOrder?: "asc" | "desc";
}

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

/** Order — mirrors Orders table */
export interface Order {
    id: string;
    buyerId: string;
    totalAmount: number;
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

/** Cart (client-side only) */
export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    thumbnailUrl: string | null;
    sku: string;
    maxStock: number;
}
