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
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public User Entrepreneur { get; private set; } = null!;
    public ProductCategory? Category { get; private set; }
    public Species BaseSpecies { get; private set; } = null!;
    
    public ICollection<ProductReview> Reviews { get; private set; } = new List<ProductReview>();
    public ICollection<Certification> Certifications { get; private set; } = new List<Certification>();

    private Product() { }

    public Product(Guid id, Guid entrepreneurId, Guid baseSpeciesId, int? categoryId, string slug, string name, string description, decimal price, int stockQuantity, string? sku, string? thumbnailUrl)
    {
        Id = id == Guid.Empty ? Guid.NewGuid() : id;
        EntrepreneurId = entrepreneurId;
        BaseSpeciesId = baseSpeciesId;
        CategoryId = categoryId;
        Slug = slug.ToLowerInvariant();
        Name = name;
        Description = description;
        Price = price;
        StockQuantity = stockQuantity;
        Sku = sku;
        ThumbnailUrl = thumbnailUrl;
        CreatedAt = DateTime.UtcNow;
        IsActive = true;
    }

    public void Update(string name, string description, decimal price, int stockQuantity, string? sku, string? thumbnailUrl, int? categoryId)
    {
        Name = name;
        Description = description;
        Price = price;
        StockQuantity = stockQuantity;
        Sku = sku;
        ThumbnailUrl = thumbnailUrl;
        CategoryId = categoryId;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
