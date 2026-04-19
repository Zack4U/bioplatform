namespace Bio.Domain.Entities;

/// <summary>
/// Image gallery for marketplace products.
/// Table: ProductImages (SQL Server).
/// </summary>
public class ProductImage
{
    public Guid Id { get; private set; }
    public Guid ProductId { get; private set; }
    public string ImageUrl { get; private set; } = string.Empty;
    public string? AltText { get; private set; }
    public int DisplayOrder { get; private set; } = 0;
    public bool IsPrimary { get; private set; } = false;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public Product Product { get; private set; } = null!;

    private ProductImage() { }

    public ProductImage(Guid productId, string imageUrl, string? altText = null, int displayOrder = 0, bool isPrimary = false)
    {
        Id = Guid.NewGuid();
        ProductId = productId;
        ImageUrl = imageUrl;
        AltText = altText;
        DisplayOrder = displayOrder;
        IsPrimary = isPrimary;
    }
}
