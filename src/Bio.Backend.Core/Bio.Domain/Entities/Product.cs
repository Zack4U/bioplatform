namespace Bio.Domain.Entities;

public class Product
{
    public Guid Id { get; private set; }
    public string Slug { get; private set; } = string.Empty;
    public Guid EntrepreneurId { get; private set; }
    public Guid BaseSpeciesId { get; private set; } // Logical FK to PostgreSQL
    public int? CategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Price { get; private set; }
    public int StockQuantity { get; private set; }
    public string? Sku { get; private set; }
    public bool IsActive { get; private set; } = true;
    public string? ThumbnailUrl { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    public User Entrepreneur { get; private set; } = null!;
    // Navigation to Reviews, Certifications
    public ICollection<ProductReview> Reviews { get; private set; } = new List<ProductReview>();
    public ICollection<Certification> Certifications { get; private set; } = new List<Certification>();

    private Product() { }

    public Product(Guid entrepreneurId, Guid baseSpeciesId, string name, string description, decimal price, int stockQuantity)
    {
        Id = Guid.NewGuid();
        EntrepreneurId = entrepreneurId;
        BaseSpeciesId = baseSpeciesId;
        Name = name;
        Description = description;
        Price = price;
        StockQuantity = stockQuantity;
    }
}
