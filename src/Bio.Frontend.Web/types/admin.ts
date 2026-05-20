/**
 * TypeScript types — Administration Panel.
 * Types for admin dashboard metrics, management pages, and sidebar config.
 *
 * @module types/admin
 */

import type { UserRoleName } from "./auth";
import type { AbsPermitStatus, OrderStatus } from "./marketplace";

// ─── Dashboard Metrics ───────────────────────────────────────────────────────

/** Platform-wide metrics for ADMIN dashboard */
export interface AdminPlatformMetrics {
    totalUsers: number;
    totalSpecies: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    activePermits: number;
    pendingValidations: number;
    recentActivityCount: number;
    userGrowthPercent: number;
    revenueGrowthPercent: number;
    speciesGrowthPercent: number;
    ordersGrowthPercent: number;
}

/** Researcher-specific metrics */
export interface ResearcherMetrics {
    speciesRegistered: number;
    pendingValidations: number;
    imagesValidated: number;
    contributionsThisMonth: number;
    speciesGrowthPercent: number;
    validationsGrowthPercent: number;
    imagesGrowthPercent: number;
    contributionsGrowthPercent: number;
    speciesByConservation: Record<string, number>;
    speciesByKingdom: Record<string, number>;
}

/** Entrepreneur-specific metrics */
export interface EntrepreneurMetrics {
    myProducts: number;
    totalSales: number;
    totalRevenue: number;
    averageRating: number;
    productsGrowthPercent: number;
    salesGrowthPercent: number;
    revenueGrowthPercent: number;
    ratingChangePercent: number;
    topProducts: TopProductItem[];
    permitStatus: Record<string, number>;
}

/** Top product summary for entrepreneur dashboard */
export interface TopProductItem {
    id: string;
    name: string;
    revenue: number;
    unitsSold: number;
    rating: number;
}

/** Authority-specific metrics */
export interface AuthorityMetrics {
    activePermits: number;
    pendingRequests: number;
    expiringSoon: number;
    deniedRequests: number;
    permitsGrowthPercent: number;
    requestsGrowthPercent: number;
    expiringGrowthPercent: number;
    deniedGrowthPercent: number;
    permitsByStatus: Record<string, number>;
    recentRequests: RecentRequestItem[];
}

/** Recent request for authority dashboard */
export interface RecentRequestItem {
    id: string;
    type: string;
    requesterName: string;
    createdAt: string;
    status: string;
}

/** Union of all dashboard metric shapes */
export type DashboardMetrics =
    | { role: "ADMIN"; data: AdminPlatformMetrics }
    | { role: "RESEARCHER"; data: ResearcherMetrics }
    | { role: "ENTREPRENEUR"; data: EntrepreneurMetrics }
    | { role: "AUTHORITY"; data: AuthorityMetrics };

// ─── Revenue Chart Data ──────────────────────────────────────────────────────

export interface RevenueChartPoint {
    month: string;
    revenue: number;
    orders: number;
}

// ─── Recent Activity ─────────────────────────────────────────────────────────

export interface RecentActivityItem {
    id: string;
    type: ActivityType;
    description: string;
    userName: string;
    createdAt: string;
}

export type ActivityType =
    | "user_registered"
    | "species_added"
    | "product_created"
    | "order_placed"
    | "permit_requested"
    | "image_validated"
    | "review_posted";

// ─── User Management ─────────────────────────────────────────────────────────

/** User item for admin management table */
export interface UserAdminItem {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string | null;
    roles: UserRoleName[];
    isActive: boolean;
    isVerified: boolean;
    twoFactorEnabled: boolean;
    lastLogin: string | null;
    createdAt: string;
    updatedAt: string | null;
}

// ─── Species Management ──────────────────────────────────────────────────────

/** Species item for admin management table */
export interface SpeciesAdminItem {
    id: string;
    scientificName: string;
    commonName: string | null;
    slug: string;
    kingdom: string | null;
    family: string | null;
    conservationStatus: string | null;
    isSensitive: boolean;
    legalStatus: boolean;
    imageCount: number;
    distributionCount: number;
    thumbnailUrl: string | null;
    createdAt: string;
    updatedAt: string | null;
}

// ─── Image Management ────────────────────────────────────────────────────────

/** Image item for admin management grid */
export interface ImageAdminItem {
    id: string;
    speciesId: string;
    speciesName: string;
    imageUrl: string;
    thumbnailUrl: string | null;
    uploaderName: string | null;
    uploaderUserId: string | null;
    isPrimary: boolean;
    isValidatedByExpert: boolean;
    validatedByName: string | null;
    validationDate: string | null;
    licenseType: string;
    createdAt: string;
}

// ─── Product Management ──────────────────────────────────────────────────────

/** Product item for admin management table */
export interface ProductAdminItem {
    id: string;
    name: string;
    slug: string;
    entrepreneurId: string;
    entrepreneurName: string;
    categoryName: string | null;
    baseSpeciesName: string | null;
    price: number;
    stockQuantity: number;
    sku: string;
    isActive: boolean;
    thumbnailUrl: string | null;
    rating: number | null;
    reviewCount: number;
    certificationCount: number;
    createdAt: string;
    updatedAt: string | null;
}

// ─── Permit Management ──────────────────────────────────────────────────────

/** ABS Permit item for admin management table */
export interface PermitAdminItem {
    id: string;
    resolutionNumber: string;
    entrepreneurId: string;
    entrepreneurName: string;
    speciesId: string;
    speciesName: string;
    grantingAuthority: string;
    status: AbsPermitStatus;
    emissionDate: string;
    expirationDate: string;
    legalFramework: string | null;
}

// ─── Request Management ─────────────────────────────────────────────────────

/** Request types for the solicitudes page */
export type RequestType =
    | "permit_request"
    | "species_validation"
    | "product_approval"
    | "account_verification";

/** Request status */
export type RequestStatus = "pending" | "approved" | "rejected" | "in_review";

/** Request/Solicitud item for admin management table */
export interface RequestAdminItem {
    id: string;
    type: RequestType;
    requesterId: string;
    requesterName: string;
    subject: string;
    description: string;
    status: RequestStatus;
    referenceId: string | null;
    referenceType: string | null;
    reviewerNotes: string | null;
    createdAt: string;
    updatedAt: string | null;
}

// ─── CNN Model Management ────────────────────────────────────────────────────

/** AI Model version for admin management */
export interface CnnModelVersion {
    id: number;
    modelName: string;
    version: string;
    accuracyMetric: number;
    validationAccuracy: number | null;
    deployedAt: string;
    isActive: boolean;
    notes: string | null;
    createdAt: string;
}

/** GPU/VRAM hardware status of the AI server */
export interface AiHardwareStatus {
    hasGpu: boolean;
    gpuName: string | null;
    vramTotalGb: number;
    vramFreeGb: number;
    canTrainModels: boolean;
    cudaVersion?: string | null;
    computeCapability?: string | null;
    multiprocessors?: number | null;
}

/** Active AI model metrics summary */
export interface ActiveModelMetrics {
    hasActiveModel: boolean;
    modelVersionId: number | null;
    modelName: string | null;
    version: string | null;
    accuracyMetric: number | null;
    validationAccuracy: number | null;
    deployedAt: string | null;
    notes: string | null;
}

/** AI model fine-tuning training job */
export interface AiTrainingJob {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: "Pending" | "Running" | "Completed" | "Failed" | "Interrupted";
    statusMessage: string | null;
    triggeredByUserId: string;
    resultingVersion: string | null;
}

/** Response shape for starting fine-tuning */
export interface StartFineTuningResponse {
    jobId: string;
    status: string;
    message: string;
}

/** Response shape for manual model upload */
export interface ModelUploadResponse {
    status: string;
    version: string;
    message: string;
}

/** Response shape for pre-activation validation */
export interface ModelValidateResponse {
    version: string;
    accuracy: number;
    currentActiveAccuracy: number | null;
    accuracyDrop: number | null;
    isSafeToActivate: boolean;
    message: string;
}

/** Response shape for activating model version */
export interface ActivateModelVersionResponse {
    success: boolean;
    message: string;
    activatedVersion: string | null;
}


// ─── Chatbot Management ─────────────────────────────────────────────────────

/** Chat session for admin management */
export interface ChatSessionAdmin {
    id: string;
    userId: string;
    userName: string;
    contextTopic: string | null;
    messageCount: number;
    startedAt: string;
    lastMessageAt: string | null;
}

/** RAG document for admin management */
export interface RagDocumentAdmin {
    id: string;
    title: string;
    sourceType: string | null;
    sourceUrl: string | null;
    speciesName: string | null;
    chunkCount: number;
    createdAt: string;
}

// ─── Order Management ────────────────────────────────────────────────────────

/** Order item for admin management table */
export interface OrderAdminItem {
    id: string;
    orderNumber: string;
    buyerId: string;
    buyerName: string;
    buyerEmail: string;
    totalAmount: number;
    subtotalAmount: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount: number;
    status: OrderStatus;
    paymentMethod: string;
    transactionRef: string | null;
    itemCount: number;
    createdAt: string;
    updatedAt: string | null;
}

// ─── Review Management ──────────────────────────────────────────────────────

/** Review item for admin management table */
export interface ReviewAdminItem {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    userId: string;
    userName: string;
    rating: number;
    title: string | null;
    comment: string | null;
    isFlagged: boolean;
    createdAt: string;
}
// ─── Audit Log ──────────────────────────────────────────────────────────────

/** Audit log entry for admin audit trail */
export interface AuditLogEntry {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    entityName: string;
    performedBy: string;
    performedByName: string;
    ipAddress: string | null;
    details: string | null;
    createdAt: string;
}

// ─── Sidebar Navigation Config ───────────────────────────────────────────────

/** Admin sidebar navigation item */
export interface AdminNavItem {
    key: string;
    labelKey: string;
    href: string;
    iconName: string;
    roles: UserRoleName[];
    badge?: number;
}

/** Admin sidebar section group */
export interface AdminNavSection {
    titleKey: string;
    items: AdminNavItem[];
}
