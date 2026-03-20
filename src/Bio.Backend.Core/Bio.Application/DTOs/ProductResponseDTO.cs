namespace Bio.Application.DTOs;

public class ProductResponseDTO
{
    public Guid Id { get; set; }
    public string Slug { get; set; } = string.Empty;
    public Guid EntrepreneurId { get; set; }
    public Guid BaseSpeciesId { get; set; }
    public int? CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string? Sku { get; set; }
    public bool IsActive { get; set; }
    public string? ThumbnailUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public string CategoryName { get; set; } = string.Empty;
}
