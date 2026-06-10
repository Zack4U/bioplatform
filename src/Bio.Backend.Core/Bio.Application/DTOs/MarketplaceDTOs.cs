namespace Bio.Application.DTOs;

// === Products ===

public record ProductCreateDTO
{
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public decimal BasePrice { get; init; }
    public decimal SellPrice { get; init; }
    public int StockQuantity { get; init; }
    public Guid BaseSpeciesId { get; init; }
    public int? CategoryId { get; init; }
    public string? Sku { get; init; }
    public string? Composition { get; init; }
    public string? ThumbnailUrl { get; init; }
}

public record ProductUpdateDTO
{
    public string? Name { get; init; }
    public string? Slug { get; init; }
    public string? Description { get; init; }
    public decimal? BasePrice { get; init; }
    public decimal? SellPrice { get; init; }
    public int? StockQuantity { get; init; }
    public int? CategoryId { get; init; }
    public string? Sku { get; init; }
    public string? Composition { get; init; }
    public string? ThumbnailUrl { get; init; }
}

public record ProductListItemDTO(
    Guid Id, string Slug, string Name, string? ThumbnailUrl,
    decimal BasePrice, decimal SellPrice, int StockQuantity, bool IsActive,
    string? CategoryName, double AverageRating, int ReviewCount,
    string? EntrepreneurName = null,
    string? BaseSpeciesName = null,
    string? Sku = null,
    IReadOnlyList<string>? Certifications = null);

public record ProductDetailDTO(
    Guid Id, string Slug, string Name, string Description,
    decimal BasePrice, decimal SellPrice, int StockQuantity, bool IsActive,
    string? Sku, string? Composition, string? ThumbnailUrl,
    Guid BaseSpeciesId, Guid EntrepreneurId, string? CategoryName, int? CategoryId,
    double AverageRating, int ReviewCount,
    IReadOnlyList<ProductImageResponseDTO> Images,
    IReadOnlyList<CertificationResponseDTO> Certifications,
    DateTime CreatedAt, DateTime? UpdatedAt);

public record ProductManagedListItemDTO(
    Guid Id, string Slug, string Name, string? ThumbnailUrl,
    decimal BasePrice, decimal SellPrice, int StockQuantity, bool IsActive,
    bool IsApproved, string? RejectionReason,
    string? Sku, string Description, Guid BaseSpeciesId, int? CategoryId,
    string? CategoryName, Guid EntrepreneurId, string? EntrepreneurName,
    DateTime CreatedAt, DateTime? UpdatedAt);

/// <summary>Generic rejection body — carries the reason a moderator rejected a request.</summary>
public record RejectReasonDTO
{
    public string Reason { get; init; } = string.Empty;
}

public record ProductFilterParams
{
    public int? CategoryId { get; init; }
    public Guid? BaseSpeciesId { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public string SortBy { get; init; } = "name";
    public string SortOrder { get; init; } = "asc";
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 12;
}

public record ProductFilterMetaDTO(
    IReadOnlyList<ProductCategoryResponseDTO> Categories,
    decimal MinPrice, decimal MaxPrice, int TotalProducts);

// === Product Images ===

public record ProductImageCreateDTO(string? AltText, int DisplayOrder = 0, bool IsPrimary = false);
public record ProductImageResponseDTO(Guid Id, string ImageUrl, string? AltText, int DisplayOrder, bool IsPrimary);

// === Product Reviews ===

public record ProductReviewCreateDTO(int Rating, string? Title, string? Comment);
public record ProductReviewUpdateDTO(int? Rating, string? Title, string? Comment);
public record ProductReviewResponseDTO(Guid Id, Guid UserId, int Rating, string? Title, string? Comment, DateTime CreatedAt);

/// <summary>Review item for moderation views (Admin / Entrepreneur "manage reviews" panel).</summary>
public record ReviewManagedListItemDTO(
    Guid Id, Guid ProductId, string ProductName, string ProductSlug,
    Guid UserId, string? UserName, int Rating, string? Title, string? Comment,
    bool IsReported, string? ReportReason, Guid? ReportedById, string? ReportedByName, DateTime? ReportedAt,
    DateTime CreatedAt);

public record ToggleReviewReportDTO(string? Reason);

// === Orders ===

public record OrderItemCreateDTO(Guid ProductId, int Quantity);
public record OrderCreateDTO
{
    public IReadOnlyList<OrderItemCreateDTO> Items { get; init; } = Array.Empty<OrderItemCreateDTO>();
    public string PaymentMethod { get; init; } = string.Empty;
    public Guid? ShippingAddressId { get; init; }
    public Guid? BillingAddressId { get; init; }
}
public record OrderItemResponseDTO(Guid Id, Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal TotalPrice);
public record OrderResponseDTO(
    Guid Id, string OrderNumber, Guid BuyerId, string? BuyerName, string Status,
    decimal SubtotalAmount, decimal TaxAmount, decimal ShippingAmount, decimal DiscountAmount, decimal TotalAmount,
    string PaymentMethod, string? TransactionRef,
    IReadOnlyList<OrderItemResponseDTO> Items,
    DateTime CreatedAt, DateTime? UpdatedAt,
    int ItemCount,
    AddressResponseDTO? ShippingAddress = null,
    AddressResponseDTO? BillingAddress = null);
public record OrderUpdateStatusDTO(string Status);
public record OrderFilterParams
{
    public string? Status { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
}

// === Favorites ===

public record FavoriteCreateDTO(string TargetType, Guid TargetId);
public record FavoriteResponseDTO(Guid Id, string TargetType, Guid TargetId, DateTime CreatedAt);
/// <summary>Returned by the /toggle endpoint — tells the client whether the item is now a favourite.</summary>
public record ToggleFavoriteStatusDTO(Guid ProductId, bool IsFavorite);

// === Addresses ===

public record AddressCreateDTO
{
    public string AddressType { get; init; } = string.Empty;
    public string RecipientName { get; init; } = string.Empty;
    public string StreetLine1 { get; init; } = string.Empty;
    public string? StreetLine2 { get; init; }
    public string City { get; init; } = string.Empty;
    public string Department { get; init; } = string.Empty;
    public string PostalCode { get; init; } = string.Empty;
    public string Country { get; init; } = "CO";
    public string? PhoneNumber { get; init; }
    public bool IsDefault { get; init; } = false;
}

public record AddressUpdateDTO
{
    public string? RecipientName { get; init; }
    public string? StreetLine1 { get; init; }
    public string? StreetLine2 { get; init; }
    public string? City { get; init; }
    public string? Department { get; init; }
    public string? PostalCode { get; init; }
    public string? Country { get; init; }
    public string? PhoneNumber { get; init; }
    public bool? IsDefault { get; init; }
}

public record AddressResponseDTO(
    Guid Id, string AddressType, string RecipientName,
    string StreetLine1, string? StreetLine2, string City, string Department,
    string PostalCode, string Country, string? PhoneNumber, bool IsDefault, DateTime CreatedAt);

/// <summary>Body for PUT /api/addresses/default — carries the address ID to promote.</summary>
public record SetDefaultAddressDTO
{
    public Guid Id { get; init; }
}

// === Certifications ===

public record CertificationCreateDTO
{
    public string Name { get; init; } = string.Empty;
    public string CertificationType { get; init; } = string.Empty;
    public string IssuingBody { get; init; } = string.Empty;
    public string? CertificateNumber { get; init; }
    public DateTime IssuedAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public string? DocumentUrl { get; init; }
    public string? LogoUrl { get; init; }
    public string? VerificationCode { get; init; }
}

public record CertificationUpdateDTO
{
    public string? Name { get; init; }
    public string? CertificationType { get; init; }
    public string? IssuingBody { get; init; }
    public string? CertificateNumber { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public string? Status { get; init; }
    public string? DocumentUrl { get; init; }
    public string? LogoUrl { get; init; }
    public string? VerificationCode { get; init; }
}

public record CertificationResponseDTO(
    Guid Id, Guid ProductId, string Name, string CertificationType,
    string IssuingBody, string? CertificateNumber,
    DateTime IssuedAt, DateTime? ExpiresAt, string Status,
    string? DocumentUrl, string? LogoUrl, string? VerificationCode,
    DateTime CreatedAt, DateTime? UpdatedAt,
    Guid? ApprovedById = null, DateTime? ApprovedAt = null, string? RejectionReason = null);

/// <summary>Certification row for the admin moderation panel — includes product + entrepreneur context.</summary>
public record CertificationManagedListItemDTO(
    Guid Id, Guid ProductId, string ProductName, string ProductSlug,
    string Name, string CertificationType, string IssuingBody, string Status,
    DateTime IssuedAt, DateTime? ExpiresAt,
    Guid EntrepreneurId, string? EntrepreneurName,
    Guid? ApprovedById, DateTime? ApprovedAt, string? RejectionReason,
    string? DocumentUrl, DateTime CreatedAt);

// === ABS Permits ===

public record AbsPermitCreateDTO
{
    public Guid EntrepreneurId { get; init; }
    public Guid SpeciesId { get; init; }
    public string ResolutionNumber { get; init; } = string.Empty;
    public DateTime EmissionDate { get; init; }
    public DateTime ExpirationDate { get; init; }
    public string GrantingAuthority { get; init; } = string.Empty;
    public string? LegalFramework { get; init; }
    /// <summary>S3 URL of the official permit PDF document. Set after uploading the file separately.</summary>
    public string? DocumentUrl { get; init; }
}


public record AbsPermitUpdateDTO
{
    public DateTime? ExpirationDate { get; init; }
    public string? GrantingAuthority { get; init; }
    public string? LegalFramework { get; init; }
    public string? Status { get; init; }
    /// <summary>Updated S3 URL of the permit PDF document.</summary>
    public string? DocumentUrl { get; init; }
}


public record AbsPermitResponseDTO(
    Guid Id, Guid EntrepreneurId, string EntrepreneurName, Guid SpeciesId,
    string ResolutionNumber, DateTime EmissionDate, DateTime ExpirationDate,
    string GrantingAuthority, string Status, string? LegalFramework,
    string? DocumentUrl, DateTime RequestedAt, string? Justification,
    Guid? ApprovedById, string? ApprovedByName, DateTime? ApprovedAt, string? RejectionReason);


// === ABS Permit Request Workflow ===

public record AbsPermitRequestDTO
{
    public Guid SpeciesId { get; init; }
    /// <summary>Entrepreneur's justification for requesting access to this species' genetic resources.</summary>
    public string? Justification { get; init; }
    public string ResolutionNumber { get; init; } = string.Empty;
    public DateTime EmissionDate { get; init; }
    public DateTime ExpirationDate { get; init; }
    public string GrantingAuthority { get; init; } = string.Empty;
    public string? LegalFramework { get; init; }
    public string? DocumentUrl { get; init; }
}

public record ApproveAbsPermitDTO
{
    public string ResolutionNumber { get; init; } = string.Empty;
    public DateTime EmissionDate { get; init; }
    public DateTime ExpirationDate { get; init; }
    public string GrantingAuthority { get; init; } = string.Empty;
    public string? LegalFramework { get; init; }
    public string? DocumentUrl { get; init; }
}

public record RejectAbsPermitDTO
{
    public string Reason { get; init; } = string.Empty;
}


// === Product Categories ===

public record ProductCategoryCreateDTO(string Name);
public record ProductCategoryUpdateDTO(string Name);
public record ProductCategoryResponseDTO(int Id, string Name);

// === My Reviews (profile tab) ===

/// <summary>Review with product context — used in the user's "My Reviews" profile tab.</summary>
public record MyReviewResponseDTO(
    Guid ReviewId,
    Guid ProductId,
    string ProductName,
    string ProductSlug,
    string? ProductThumbnailUrl,
    int Rating,
    string? Title,
    string? Comment,
    DateTime CreatedAt);

// === Cart Validation / Sync ===

public record CartValidatePricesRequestItemDTO(Guid ProductId, int Quantity);

public record CartValidatePricesRequestDTO
{
    public IReadOnlyList<CartValidatePricesRequestItemDTO> Items { get; init; }
        = Array.Empty<CartValidatePricesRequestItemDTO>();
}

public record CartPriceValidationItemDTO(
    Guid ProductId,
    string ProductName,
    decimal CurrentPrice,
    bool IsActive,
    int AvailableStock,
    bool PriceChanged,
    decimal? OldPrice);

public record CartValidatePricesResponseDTO(
    IReadOnlyList<CartPriceValidationItemDTO> Items,
    bool AnyPriceChanged,
    bool AnyUnavailable);

public record CartSyncItemDTO(Guid ProductId, int Quantity);

public record CartSyncRequestDTO
{
    public IReadOnlyList<CartSyncItemDTO> Items { get; init; }
        = Array.Empty<CartSyncItemDTO>();
}

// === Checkout Session ===

public record CheckoutSessionResponseDTO(string CheckoutUrl);

