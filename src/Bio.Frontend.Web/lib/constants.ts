/**
 * Application-wide constants for BioCommerce Caldas.
 * Never hardcode API keys or secrets here — use environment variables.
 */

export const APP_NAME = "BioCommerce Caldas";
export const APP_DESCRIPTION =
    "Plataforma de Biodiversidad y Biocomercio para Caldas, Colombia";

/** API base URLs — sourced from .env */
export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";
export const AI_API_BASE_URL =
    process.env.NEXT_PUBLIC_AI_API_BASE_URL ?? "http://localhost:8000/api/v1";

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 100;

/** Image upload constraints */
export const MAX_IMAGE_SIZE_MB = 10;
export const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
] as const;

/** Roles (mirrors backend Roles table) */
export const USER_ROLES = {
    ADMIN: "Admin",
    RESEARCHER: "Researcher",
    ENTREPRENEUR: "Entrepreneur",
    COMMUNITY: "Community",
    BUYER: "Buyer",
    ENVIRONMENTAL_AUTHORITY: "EnvironmentalAuthority",
} as const;

/** ABS Permit statuses */
export const ABS_PERMIT_STATUS = {
    ACTIVE: "Active",
    SUSPENDED: "Suspended",
    EXPIRED: "Expired",
    REVOKED: "Revoked",
} as const;

/** Order statuses */
export const ORDER_STATUS = {
    PENDING: "Pending",
    PAID: "Paid",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded",
} as const;

/** Product statuses */
export const PRODUCT_STATUS = {
    DRAFT: "Draft",
    ACTIVE: "Active",
    OUT_OF_STOCK: "OutOfStock",
    SUSPENDED: "Suspended",
} as const;

/** Taxonomy kingdoms */
export const TAXONOMY_KINGDOMS = [
    "Plantae",
    "Animalia",
    "Fungi",
    "Protista",
    "Chromista",
] as const;

/* ── Marketplace ──────────────────────────────────────────────────────────── */

/** IVA tax rate (Colombia standard 19%). Override via env if needed. */
export const TAX_RATE = Number(
    process.env.NEXT_PUBLIC_TAX_RATE ?? "0.19",
);

/** Fixed shipping cost in COP. Override via NEXT_PUBLIC_SHIPPING_COST_COP. */
export const SHIPPING_COST_COP = Number(
    process.env.NEXT_PUBLIC_SHIPPING_COST_COP ?? "12000",
);

/** Minimum order amount (COP) for free shipping. 0 = never free. */
export const FREE_SHIPPING_THRESHOLD = Number(
    process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD ?? "150000",
);

/** Currency locale & code for Intl.NumberFormat */
export const CURRENCY_LOCALE = "es-CO";
export const CURRENCY_CODE = "COP";

/** Pre-built currency formatter — use `formatCurrency(45000)` → "$45.000" */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
        style: "currency",
        currency: CURRENCY_CODE,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

/** Number of product categories shown as "top" in the filter sidebar. */
export const MARKETPLACE_DEFAULT_PAGE_SIZE = 12;

/* ── Administration Panel ─────────────────────────────────────────────────── */

/** Roles with access to the admin panel (Buyers and Communities excluded) */
export const ADMIN_ROLES = [
    "ADMIN",
    "RESEARCHER",
    "ENTREPRENEUR",
    "AUTHORITY",
] as const;

/** Default pagination size for admin tables */
export const ADMIN_PAGE_SIZE = 15;

/** Certification types (mirrors CertificationType column) */
export const CERTIFICATION_TYPES = {
    SUSTAINABILITY: "Sustainability",
    ORGANIC: "Organic",
    QUALITY: "Quality",
    FAIR_TRADE: "FairTrade",
    ABS: "ABS",
} as const;

/** Request statuses for solicitudes management */
export const REQUEST_STATUSES = {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    IN_REVIEW: "in_review",
} as const;

/** Request types for solicitudes management */
export const REQUEST_TYPES = {
    PERMIT_REQUEST: "permit_request",
    SPECIES_VALIDATION: "species_validation",
    PRODUCT_APPROVAL: "product_approval",
    ACCOUNT_VERIFICATION: "account_verification",
} as const;

/** Notification types (mirrors NotificationType column) */
export const NOTIFICATION_TYPES = {
    ORDER_UPDATE: "OrderUpdate",
    REVIEW_REPLY: "ReviewReply",
    PERMIT_EXPIRY: "PermitExpiry",
    SYSTEM: "System",
} as const;

/** Image validation statuses for images management */
export const IMAGE_VALIDATION_STATUS = {
    VALIDATED: "validated",
    PENDING: "pending",
    REJECTED: "rejected",
} as const;

/** Conservation status labels for display */
export const CONSERVATION_STATUSES = {
    LC: "Preocupacion Menor",
    NT: "Casi Amenazada",
    VU: "Vulnerable",
    EN: "En Peligro",
    CR: "En Peligro Critico",
    EW: "Extinta en Estado Silvestre",
    EX: "Extinta",
    DD: "Datos Insuficientes",
    NE: "No Evaluada",
} as const;


