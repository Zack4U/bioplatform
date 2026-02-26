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
