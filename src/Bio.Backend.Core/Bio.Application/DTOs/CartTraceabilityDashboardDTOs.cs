namespace Bio.Application.DTOs;

// === Cart ===

public record CartItemAddDTO
{
    public Guid ProductId { get; init; }
    public int Quantity { get; init; } = 1;
}

public record CartItemUpdateDTO
{
    public int Quantity { get; init; }
}

public record CartItemResponseDTO(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string? ProductThumbnailUrl,
    int Quantity,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record CartResponseDTO(
    Guid Id,
    Guid UserId,
    IReadOnlyList<CartItemResponseDTO> Items,
    int ActiveItemCount,
    DateTime UpdatedAt);

// === Traceability ===

public record TraceabilityBatchCreateDTO
{
    public string BatchCode { get; init; } = string.Empty;
    public DateTime HarvestDate { get; init; }
    public string OriginLocation { get; init; } = string.Empty;
    public string? ProcessingDetails { get; init; }
    public string? BlockchainHash { get; init; }
}

public record TraceabilityBatchUpdateDTO
{
    public DateTime? HarvestDate { get; init; }
    public string? OriginLocation { get; init; }
    public string? ProcessingDetails { get; init; }
    public string? BlockchainHash { get; init; }
}

public record TraceabilityBatchResponseDTO(
    Guid Id,
    Guid ProductId,
    string BatchCode,
    DateTime HarvestDate,
    string OriginLocation,
    string? ProcessingDetails,
    string? BlockchainHash);

// === Seller Dashboard ===

public record OrderStatusCountDTO(string Status, int Count);

public record TopProductDTO(
    Guid ProductId,
    string ProductName,
    string? ThumbnailUrl,
    int TotalSold,
    decimal TotalRevenue);

public record LowStockProductDTO(
    Guid ProductId,
    string ProductName,
    int StockQuantity);

public record SellerDashboardDTO(
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
    IReadOnlyList<LowStockProductDTO> LowStockProducts);
