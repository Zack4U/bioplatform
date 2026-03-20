namespace Bio.Application.DTOs;

public class ProductUpdateDTO
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public string? Sku { get; set; }
    public string? ThumbnailUrl { get; set; }
    public int? CategoryId { get; set; }
}
