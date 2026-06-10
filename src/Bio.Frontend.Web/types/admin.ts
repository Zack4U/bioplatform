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
    phylum?: string | null;
    className?: string | null;
    orderName?: string | null;
    family: string | null;
    genus?: string | null;
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
    speciesName?: string | null;
    grantingAuthority: string;
    status: AbsPermitStatus;
    emissionDate: string;
    expirationDate: string;
    legalFramework: string | null;
    documentUrl?: string | null;
    requestedAt: string;
    justification?: string | null;
    approvedById?: string | null;
    approvedByName?: string | null;
    approvedAt?: string | null;
    rejectionReason?: string | null;
}

/** Payload to submit a genetic-resource access request (Entrepreneur) */
export interface AbsPermitRequestPayload {
    speciesId: string;
    justification?: string | null;
}

/** Payload to approve a Pending request — fills official resolution data */
export interface ApproveAbsPermitPayload {
    resolutionNumber: string;
    emissionDate: string;
    expirationDate: string;
    grantingAuthority: string;
    legalFramework?: string | null;
    documentUrl?: string | null;
}

/** Payload to reject a Pending request with a documented reason */
export interface RejectAbsPermitPayload {
    reason: string;
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

/**
 * Summary of new observation images accumulated since the last model deployment.
 * Consumed by the admin metrics panel to quantify new available training data.
 */
export interface NewObservationsSummary {
    /** Total number of species images uploaded after the active model's deployedAt date */
    totalNewImages: number;
    /** Number of distinct species represented in those new images */
    affectedSpeciesCount: number;
    /** ISO date of the active model's deployment (null = all-time) */
    since: string | null;
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

/** Full order detail with line items (from GET /orders/:id) */
export interface OrderAddressInfo {
    recipientName: string;
    streetLine1: string;
    streetLine2: string | null;
    city: string;
    department: string;
    postalCode: string;
    country: string;
    phoneNumber: string | null;
}

export interface OrderAdminDetail extends OrderAdminItem {
    items?: {
        id: string;
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    shippingAddress?: OrderAddressInfo | null;
    billingAddress?: OrderAddressInfo | null;
    notes?: string | null;
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

/** Review item for moderation queue (Admin: all / Entrepreneur: own products) */
export interface ReviewManagedItem {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    userId: string;
    userName: string | null;
    rating: number;
    title: string | null;
    comment: string | null;
    isReported: boolean;
    reportReason: string | null;
    reportedById: string | null;
    reportedByName: string | null;
    reportedAt: string | null;
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

// ─── Backend DTO Types (matching Bio.Application.DTOs) ───────────────────────

// --- Dashboard ---

export interface RoleCountDTO { role: string; count: number; }
export interface CategoryCountDTO { categoryName: string; count: number; }
export interface OrderStatusCountDTO { status: string; count: number; }
export interface CertTypeCountDTO { type: string; count: number; }
export interface TopEntrepreneurDTO { entrepreneurId: string; fullName: string; email: string; totalRevenue: number; totalOrders: number; }

export interface AdminDashboardDTO {
    users: { totalUsers: number; activeUsers: number; inactiveUsers: number; verifiedUsers: number; newUsersThisMonth: number; byRole: RoleCountDTO[]; };
    marketplace: { totalProducts: number; activeProducts: number; inactiveProducts: number; lowStockProducts: number; byCategory: CategoryCountDTO[]; };
    orders: { totalOrders: number; totalRevenue: number; revenueThisMonth: number; ordersThisMonth: number; byStatus: OrderStatusCountDTO[]; };
    compliance: { totalAbsPermits: number; activeAbsPermits: number; expiredAbsPermits: number; suspendedAbsPermits: number; revokedAbsPermits: number; permitsExpiringIn30Days: number; totalCertifications: number; certificationsByType: CertTypeCountDTO[]; };
    community: { totalPosts: number; publishedPosts: number; hiddenPosts: number; totalComments: number; totalConnections: number; };
    topEntrepreneurs: TopEntrepreneurDTO[];
    generatedAt: string;
}

export interface ResearcherDashboardDTO {
    totalSpecies: number;
    sensitiveSpecies: number;
    legalStatusSpecies: number;
    byConservationStatus: { status: string; count: number; }[];
    byKingdom: { kingdom: string; count: number; }[];
    topFamilies: { family: string; count: number; }[];
    totalImages: number;
    validatedImages: number;
    pendingValidationImages: number;
    imagesValidatedByMe: number;
    imagesUploadedThisMonth: number;
    geographicRecordsCount: number;
    municipalitiesWithRecords: number;
    speciesWithActiveAbsPermits: number;
}

export interface SellerDashboardEnhancedDTO {
    totalSalesThisMonth: number;
    totalSalesAllTime: number;
    totalOrdersThisMonth: number;
    totalOrdersAllTime: number;
    ordersByStatus: OrderStatusCountDTO[];
    topProducts: { productId: string; productName: string; totalRevenue: number; unitsSold: number; }[];
    averageRating: number;
    totalReviews: number;
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: { productId: string; productName: string; stockQuantity: number; }[];
    revenueLastMonth: number;
    revenueByCategory: { categoryName: string; revenue: number; unitsSold: number; }[];
    ordersPendingShipment: number;
    productsWithoutCertification: number;
    absPermitsExpiringIn90Days: number;
    traceabilityBatchCount: number;
    ratingDistribution: { stars: number; count: number; }[];
}

export interface PermitExpiryAlertDTO { permitId: string; resolutionNumber: string; entrepreneurId: string; speciesId: string; expirationDate: string; daysUntilExpiry: number; }
export interface CertExpiryAlertDTO { certId: string; certificateName: string; certificationType: string; productId: string; expiresAt: string; daysUntilExpiry: number; }

export interface AuthorityDashboardDTO {
    totalAbsPermits: number;
    activePermits: number;
    expiredPermits: number;
    suspendedPermits: number;
    revokedPermits: number;
    expiringIn30Days: PermitExpiryAlertDTO[];
    expiringIn90Days: PermitExpiryAlertDTO[];
    entrepreneursWithActivePermits: number;
    productsWithoutValidPermit: number;
    totalCertifications: number;
    certificationsByType: CertTypeCountDTO[];
    certificationsExpiringSoon: CertExpiryAlertDTO[];
    batchesWithBlockchainHash: number;
    legalSpeciesCount: number;
}

// --- Users / Roles ---

export interface UserAdminFilters {
    search?: string;
    roleName?: string;
    isActive?: boolean;
    isVerified?: boolean;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}

export interface RoleItem { id: string; name: string; description?: string; }

// --- Species ---

export interface SpeciesCreatePayload {
    scientificName: string;
    commonName?: string;
    slug: string;
    kingdom?: string;
    phylum?: string;
    className?: string;
    orderName?: string;
    family?: string;
    genus?: string;
    conservationStatus?: string;
    isSensitive: boolean;
    legalStatus: boolean;
    description?: string;
}

export type SpeciesUpdatePayload = Partial<SpeciesCreatePayload>;

// --- ABS Permits ---

export interface PermitCreatePayload {
    entrepreneurId: string;
    speciesId: string;
    resolutionNumber: string;
    emissionDate: string;
    expirationDate: string;
    grantingAuthority: string;
    legalFramework?: string;
    documentUrl?: string;
}

export interface PermitUpdatePayload {
    expirationDate?: string;
    grantingAuthority?: string;
    legalFramework?: string;
    status?: string;
    documentUrl?: string;
}

// --- Filters ---

export interface OrderAdminFilters {
    status?: string;
    /** Free-text search (order number or buyer) — sent as ?q to the backend */
    q?: string;
    page?: number;
    pageSize?: number;
}

// ─── Certification Management ───────────────────────────────────────────────

/** Maps to CertificationManagedListItemDTO — admin moderation row */
export interface CertificationAdminItem {
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    name: string;
    certificationType: string;
    issuingBody: string;
    status: string;
    issuedAt: string;
    expiresAt: string | null;
    entrepreneurId: string;
    entrepreneurName: string | null;
    approvedById: string | null;
    approvedAt: string | null;
    rejectionReason: string | null;
    documentUrl: string | null;
    createdAt: string;
}

export interface CertificationAdminFilters {
    status?: string;
    page?: number;
    pageSize?: number;
}

export interface PlatformRequestFilters {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}

export interface AuditLogFilters {
    actorUserId?: string;
    actorType?: string;
    actionType?: string;
    impactLevel?: string;
    targetType?: string;
    targetId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}

// --- Platform Requests ---

export interface PlatformRequestItem {
    id: string;
    type: string;
    typeLabel: string;
    requesterId: string;
    requesterName: string;
    subject: string;
    description?: string;
    status: string;
    referenceId?: string;
    referenceType?: string;
    referenceUrl?: string;
    reviewerNotes?: string;
    createdAt: string;
    updatedAt?: string;
    /** For SpeciesImage: the speciesId of the parent species. */
    parentReferenceId?: string;
    /** For SpeciesImage: the scientific name of the parent species. */
    parentReferenceName?: string;
}

// --- Audit Log (matching ActivityLogResponseDTO) ---
// Note: the AuditLogEntry interface above stays for backward compat.
// These aliases provide the exact backend field names:
export interface ActivityLogResponseDTO {
    id: string;
    actorUserId?: string;
    actorType: string;
    actionType: string;
    impactLevel: string;
    targetType: string;
    targetId?: string;
    summary: string;
    changeSet?: string;
    metadata?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
}
