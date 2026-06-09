/**
 * Centralized Admin Service — all API functions for the administration panel.
 *
 * Groups: Dashboard, Users, Roles, Species, Orders, Reviews, Permits, Requests, Audit.
 * Products are handled by marketplace-service.ts (already real API).
 *
 * @module services/admin-service
 */

import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, apiPut, apiUpload } from "./api";
import { ADMIN_ROUTES } from "./routes/admin-routes";
import type {
    AdminDashboardDTO,
    ResearcherDashboardDTO,
    SellerDashboardEnhancedDTO,
    AuthorityDashboardDTO,
    UserAdminItem,
    UserAdminFilters,
    RoleItem,
    SpeciesAdminItem,
    SpeciesCreatePayload,
    SpeciesUpdatePayload,
    OrderAdminItem,
    OrderAdminDetail,
    OrderAdminFilters,
    ReviewAdminItem,
    ReviewManagedItem,
    PermitAdminItem,
    PermitCreatePayload,
    PermitUpdatePayload,
    AbsPermitRequestPayload,
    ApproveAbsPermitPayload,
    RejectAbsPermitPayload,
    PlatformRequestItem,
    PlatformRequestFilters,
    AuditLogFilters,
    ActivityLogResponseDTO,
} from "@/types/admin";
import type { SpeciesImage } from "@/types/species";

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export const getAdminDashboard = () =>
    apiGet<AdminDashboardDTO>(ADMIN_ROUTES.DASHBOARD.ADMIN);

export const getResearcherDashboard = () =>
    apiGet<ResearcherDashboardDTO>(ADMIN_ROUTES.DASHBOARD.RESEARCHER);

export const getSellerDashboard = (entrepreneurId?: string) =>
    apiGet<SellerDashboardEnhancedDTO>(ADMIN_ROUTES.DASHBOARD.SELLER, entrepreneurId ? { entrepreneurId } : undefined);

export const getAuthorityDashboard = (expiryAlertDays = 90) =>
    apiGet<AuthorityDashboardDTO>(ADMIN_ROUTES.DASHBOARD.AUTHORITY, { expiryAlertDays });

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════

export const getAdminUsers = (params: UserAdminFilters) =>
    apiGetPaginated<UserAdminItem>(ADMIN_ROUTES.USERS.FILTERED, params as Record<string, unknown>);

export const getAdminUserById = (id: string) =>
    apiGet<UserAdminItem>(ADMIN_ROUTES.USERS.BY_ID(id));

export const activateUser = (id: string) =>
    apiPut<undefined, void>(ADMIN_ROUTES.USERS.ACTIVATE(id), undefined);

export const deactivateUser = (id: string) =>
    apiPut<undefined, void>(ADMIN_ROUTES.USERS.DEACTIVATE(id), undefined);

// ═══════════════════════════════════════════════════════════════════════════════
// ROLES
// ═══════════════════════════════════════════════════════════════════════════════

export const getAllRoles = () =>
    apiGet<RoleItem[]>(ADMIN_ROUTES.ROLES.BASE);

export const assignUserRole = (userId: string, roleId: string) =>
    apiPost<{ userId: string; roleId: string }, void>(ADMIN_ROUTES.USER_ROLES.ASSIGN, { userId, roleId });

export const removeUserRole = (userId: string, roleId: string) =>
    apiDelete<void>(ADMIN_ROUTES.USER_ROLES.REMOVE(userId, roleId));

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIES
// ═══════════════════════════════════════════════════════════════════════════════

export const getAdminSpecies = (params: Record<string, unknown>) =>
    apiGetPaginated<SpeciesAdminItem>(ADMIN_ROUTES.SPECIES.BASE, params);

export const getAdminSpeciesById = (id: string) =>
    apiGet<SpeciesAdminItem>(ADMIN_ROUTES.SPECIES.BY_ID(id));

export const createSpecies = (data: SpeciesCreatePayload) =>
    apiPost<SpeciesCreatePayload, SpeciesAdminItem>(ADMIN_ROUTES.SPECIES.BASE, data);

export const updateSpecies = (id: string, data: SpeciesUpdatePayload) =>
    apiPut<SpeciesUpdatePayload, SpeciesAdminItem>(ADMIN_ROUTES.SPECIES.BY_ID(id), data);

export const deleteSpecies = (id: string) =>
    apiDelete<void>(ADMIN_ROUTES.SPECIES.BY_ID(id));

// ═══════════════════════════════════════════════════════════════════════════════
// SPECIES IMAGES
// ═══════════════════════════════════════════════════════════════════════════════

export const getSpeciesImages = (
    speciesId: string,
    params: { onlyValidatedByExpert?: boolean; page?: number; pageSize?: number } = {},
) =>
    apiGetPaginated<SpeciesImage>(ADMIN_ROUTES.SPECIES.IMAGES(speciesId), params as Record<string, unknown>);

export const validateSpeciesImage = (speciesId: string, imageId: string) =>
    apiPost<undefined, SpeciesImage>(ADMIN_ROUTES.SPECIES.VALIDATE_IMG(speciesId, imageId), undefined);

export const rejectSpeciesImage = (speciesId: string, imageId: string) =>
    apiPost<undefined, SpeciesImage>(ADMIN_ROUTES.SPECIES.REJECT_IMG(speciesId, imageId), undefined);

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS (admin activate / deactivate)
// ═══════════════════════════════════════════════════════════════════════════════

export const activateProduct = (id: string) =>
    apiPost<undefined, void>(ADMIN_ROUTES.PRODUCTS.ACTIVATE(id), undefined);

export const deactivateProduct = (id: string) =>
    apiPost<undefined, void>(ADMIN_ROUTES.PRODUCTS.DEACTIVATE(id), undefined);

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════════

export const getAdminOrders = (params: OrderAdminFilters) =>
    apiGetPaginated<OrderAdminItem>(ADMIN_ROUTES.ORDERS.MANAGED, params as Record<string, unknown>);

export const getAdminOrderById = (id: string) =>
    apiGet<OrderAdminDetail>(ADMIN_ROUTES.ORDERS.BY_ID(id));

export const updateOrderStatus = (id: string, status: string) =>
    apiPatch<{ status: string }, OrderAdminItem>(ADMIN_ROUTES.ORDERS.UPDATE_STATUS(id), { status });

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS
// ═══════════════════════════════════════════════════════════════════════════════

export const getProductReviews = (
    productId: string,
    params: { page?: number; pageSize?: number } = {},
) =>
    apiGetPaginated<ReviewAdminItem>(ADMIN_ROUTES.REVIEWS.BY_PRODUCT(productId), params as Record<string, unknown>);

export const deleteReviewAdmin = (productId: string, reviewId: string) =>
    apiDelete<void>(ADMIN_ROUTES.REVIEWS.DELETE(productId, reviewId));

export const getManagedReviews = (
    params: { isReported?: boolean; page?: number; pageSize?: number } = {},
) =>
    apiGetPaginated<ReviewManagedItem>(ADMIN_ROUTES.REVIEWS.MANAGE, params as Record<string, unknown>);

export const toggleReviewReport = (reviewId: string, reason?: string) =>
    apiPost<{ reason?: string }, ReviewManagedItem>(ADMIN_ROUTES.REVIEWS.TOGGLE_REPORT(reviewId), { reason });

export const deleteManagedReview = (reviewId: string) =>
    apiDelete<void>(ADMIN_ROUTES.REVIEWS.DELETE_MANAGED(reviewId));

// ═══════════════════════════════════════════════════════════════════════════════
// ABS PERMITS
// ═══════════════════════════════════════════════════════════════════════════════

export const getAdminPermits = (params: {
    entrepreneurId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
}) =>
    apiGetPaginated<PermitAdminItem>(ADMIN_ROUTES.PERMITS.BASE, params as Record<string, unknown>);

export const getPermitById = (id: string) =>
    apiGet<PermitAdminItem>(ADMIN_ROUTES.PERMITS.BY_ID(id));

export const getPermitsByEntrepreneur = (entrepreneurId: string) =>
    apiGet<PermitAdminItem[]>(ADMIN_ROUTES.PERMITS.BY_ENTREPRENEUR(entrepreneurId));

export const createPermit = (data: PermitCreatePayload) =>
    apiPost<PermitCreatePayload, PermitAdminItem>(ADMIN_ROUTES.PERMITS.BASE, data);

export const updatePermit = (id: string, data: PermitUpdatePayload) =>
    apiPut<PermitUpdatePayload, PermitAdminItem>(ADMIN_ROUTES.PERMITS.BY_ID(id), data);

export const revokePermit = (id: string) =>
    apiDelete<PermitAdminItem>(ADMIN_ROUTES.PERMITS.BY_ID(id));

export const uploadPermitDocument = (file: File, onProgress?: (pct: number) => void) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiUpload<{ documentUrl: string }>(ADMIN_ROUTES.PERMITS.UPLOAD_DOC, formData, onProgress);
};

export const requestAbsPermit = (data: AbsPermitRequestPayload) =>
    apiPost<AbsPermitRequestPayload, PermitAdminItem>(ADMIN_ROUTES.PERMITS.REQUEST, data);

export const cancelAbsPermitRequest = (id: string) =>
    apiDelete<void>(ADMIN_ROUTES.PERMITS.CANCEL_REQUEST(id));

export const approveAbsPermit = (id: string, data: ApproveAbsPermitPayload) =>
    apiPost<ApproveAbsPermitPayload, PermitAdminItem>(ADMIN_ROUTES.PERMITS.APPROVE(id), data);

export const rejectAbsPermit = (id: string, data: RejectAbsPermitPayload) =>
    apiPost<RejectAbsPermitPayload, PermitAdminItem>(ADMIN_ROUTES.PERMITS.REJECT(id), data);

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM REQUESTS (Solicitudes agregadas)
// ═══════════════════════════════════════════════════════════════════════════════

export const getPlatformRequests = (params: PlatformRequestFilters) =>
    apiGetPaginated<PlatformRequestItem>(ADMIN_ROUTES.REQUESTS.BASE, params as Record<string, unknown>);

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════════

export const getAuditLogs = (params: AuditLogFilters) =>
    apiGetPaginated<ActivityLogResponseDTO>(ADMIN_ROUTES.AUDIT.BASE, params as Record<string, unknown>);

export const getAuditLogById = (id: string) =>
    apiGet<ActivityLogResponseDTO>(ADMIN_ROUTES.AUDIT.BY_ID(id));
