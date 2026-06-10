namespace Bio.Application.DTOs;

// =============================================================================
// ADMIN DASHBOARD
// =============================================================================

public record AdminUserSummaryDTO(
    int TotalUsers,
    int ActiveUsers,
    int InactiveUsers,
    int VerifiedUsers,
    int NewUsersThisMonth,
    IReadOnlyList<RoleCountDTO> ByRole);

public record RoleCountDTO(string Role, int Count);

public record AdminMarketplaceSummaryDTO(
    int TotalProducts,
    int ActiveProducts,
    int InactiveProducts,
    int LowStockProducts,
    IReadOnlyList<CategoryCountDTO> ByCategory);

public record CategoryCountDTO(string CategoryName, int Count);

public record AdminOrderSummaryDTO(
    int TotalOrders,
    decimal TotalRevenue,
    decimal RevenueThisMonth,
    int OrdersThisMonth,
    IReadOnlyList<OrderStatusCountDTO> ByStatus);

public record AdminComplianceSummaryDTO(
    int TotalAbsPermits,
    int ActiveAbsPermits,
    int ExpiredAbsPermits,
    int SuspendedAbsPermits,
    int RevokedAbsPermits,
    int PermitsExpiringIn30Days,
    int TotalCertifications,
    IReadOnlyList<CertTypeCountDTO> CertificationsByType);

public record CertTypeCountDTO(string Type, int Count);

public record AdminCommunitySummaryDTO(
    int TotalPosts,
    int PublishedPosts,
    int HiddenPosts,
    int TotalComments,
    int TotalConnections);

public record TopEntrepreneurDTO(
    Guid EntrepreneurId,
    string FullName,
    string Email,
    decimal TotalRevenue,
    int TotalOrders);

public record AdminDashboardDTO(
    AdminUserSummaryDTO Users,
    AdminMarketplaceSummaryDTO Marketplace,
    AdminOrderSummaryDTO Orders,
    AdminComplianceSummaryDTO Compliance,
    AdminCommunitySummaryDTO Community,
    IReadOnlyList<TopEntrepreneurDTO> TopEntrepreneurs,
    DateTime GeneratedAt);

// =============================================================================
// SELLER DASHBOARD (enhanced)
// =============================================================================

public record RevenueByPeriodDTO(string Period, decimal Revenue, int Orders);
public record RevenueByCategoryDTO(string CategoryName, decimal Revenue, int UnitsSold);
public record RatingDistributionDTO(int Stars, int Count);

public record SellerDashboardEnhancedDTO(
    // Core KPIs (existing)
    decimal TotalSalesThisMonth,
    decimal TotalSalesAllTime,
    int TotalOrdersThisMonth,
    int TotalOrdersAllTime,
    IReadOnlyList<OrderStatusCountDTO> OrdersByStatus,
    IReadOnlyList<TopProductDTO> TopProducts,
    double AverageRating,
    int TotalReviews,
    int TotalProducts,
    int ActiveProducts,
    IReadOnlyList<LowStockProductDTO> LowStockProducts,
    // Enhanced KPIs
    decimal RevenueLastMonth,
    IReadOnlyList<RevenueByCategoryDTO> RevenueByCategory,
    int OrdersPendingShipment,
    int ProductsWithoutCertification,
    int AbsPermitsExpiringIn90Days,
    int TraceabilityBatchCount,
    IReadOnlyList<RatingDistributionDTO> RatingDistribution);

// =============================================================================
// RESEARCHER DASHBOARD
// =============================================================================

public record SpeciesConservationCountDTO(string Status, int Count);
public record SpeciesKingdomCountDTO(string Kingdom, int Count);
public record SpeciesFamilyTopDTO(string Family, int Count);

public record ResearcherDashboardDTO(
    int TotalSpecies,
    int SensitiveSpecies,
    int LegalStatusSpecies,
    IReadOnlyList<SpeciesConservationCountDTO> ByConservationStatus,
    IReadOnlyList<SpeciesKingdomCountDTO> ByKingdom,
    IReadOnlyList<SpeciesFamilyTopDTO> TopFamilies,
    int TotalImages,
    int ValidatedImages,
    int PendingValidationImages,
    int ImagesValidatedByMe,
    int ImagesUploadedThisMonth,
    int GeographicRecordsCount,
    int MunicipalitiesWithRecords,
    int SpeciesWithActiveAbsPermits);

// =============================================================================
// BUYER DASHBOARD
// =============================================================================

public record BuyerDashboardDTO(
    int TotalOrders,
    decimal TotalSpent,
    decimal SpentThisMonth,
    IReadOnlyList<OrderStatusCountDTO> OrdersByStatus,
    int FavoriteProductsCount,
    int FavoriteSpeciesCount,
    int ReviewsWritten,
    OrderSummaryDTO? LastOrder);

public record OrderSummaryDTO(
    Guid OrderId,
    string OrderNumber,
    string Status,
    decimal TotalAmount,
    DateTime CreatedAt);

// =============================================================================
// AUTHORITY DASHBOARD
// =============================================================================

public record PermitExpiryAlertDTO(
    Guid PermitId,
    string ResolutionNumber,
    Guid EntrepreneurId,
    Guid SpeciesId,
    DateTime ExpirationDate,
    int DaysUntilExpiry);

public record CertExpiryAlertDTO(
    Guid CertId,
    string CertificateName,
    string CertificationType,
    Guid ProductId,
    DateTime ExpiresAt,
    int DaysUntilExpiry);

public record AuthorityDashboardDTO(
    int TotalAbsPermits,
    int ActivePermits,
    int ExpiredPermits,
    int SuspendedPermits,
    int RevokedPermits,
    IReadOnlyList<PermitExpiryAlertDTO> ExpiringIn30Days,
    IReadOnlyList<PermitExpiryAlertDTO> ExpiringIn90Days,
    int EntrepreneursWithActivePermits,
    int ProductsWithoutValidPermit,
    int TotalCertifications,
    IReadOnlyList<CertTypeCountDTO> CertificationsByType,
    IReadOnlyList<CertExpiryAlertDTO> CertificationsExpiringSoon,
    int BatchesWithBlockchainHash,
    int LegalSpeciesCount);

// =============================================================================
// SOCIAL / COMMUNITY DASHBOARD (all authenticated users)
// =============================================================================

public record MyPostSummaryDTO(
    Guid PostId,
    string Title,
    string Status,
    int LikesCount,
    int DislikesCount,
    int CommentCount,
    DateTime CreatedAt);

public record SocialDashboardDTO(
    // My content
    int MyTotalPosts,
    int MyPublishedPosts,
    int MyDraftPosts,
    int TotalLikesReceived,
    int TotalDislikesReceived,
    int TotalCommentsReceived,
    IReadOnlyList<MyPostSummaryDTO> TopPostsByLikes,
    // Networking
    int ActiveConnections,
    int PendingConnectionRequests,
    int SentConnectionRequests,
    // Messaging
    int UnreadDirectMessages,
    // Favorites
    int FavoriteProductsCount,
    int FavoriteSpeciesCount);

// =============================================================================
// USERS ADMIN
// =============================================================================

public record UserListItemDTO(
    Guid Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    bool IsActive,
    bool IsVerified,
    bool TwoFactorEnabled,
    DateTime CreatedAt,
    DateTime? LastLogin,
    IReadOnlyList<string> Roles);

public record UserFilterParams
{
    public string? Search { get; init; }
    public string? RoleName { get; init; }
    public bool? IsActive { get; init; }
    public bool? IsVerified { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}
