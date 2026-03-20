namespace Bio.Application.DTOs;

public class ProductCreateDTO
{
    public Guid EntrepreneurId { get; set; }
    public Guid BaseSpeciesId { get; set; }
    public int? CategoryId { get; set; }
    public string Slug { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string? Sku { get; set; }
    public string? ThumbnailUrl { get; set; }
}
