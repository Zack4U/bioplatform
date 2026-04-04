namespace Bio.Application.DTOs;

/// <summary>
/// DTO ligero de producto relacionado a una especie.
/// Cruza SQL Server (Product) con PostgreSQL (Species) via BaseSpeciesId UUID.
/// </summary>
public record RelatedProductDTO(
    Guid Id,
    string Name,
    string? Slug,
    string Description,
    decimal Price,
    int StockQuantity,
    string? ThumbnailUrl,
    bool IsActive
);
