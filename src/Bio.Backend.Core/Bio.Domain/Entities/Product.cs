namespace Bio.Domain.Entities;

/// <summary>
/// Biodiversity-derived product listed in the marketplace.
/// Table: Products (SQL Server).
/// Products start inactive (IsActive = false) until approved by an AUTHORITY.
/// </summary>
public class Product
{
    public Guid Id { get; private set; }
    public string Slug { get; private set; } = string.Empty;
    public Guid EntrepreneurId { get; private set; }
    public Guid BaseSpeciesId { get; private set; } // Logical FK to PostgreSQL
    public int? CategoryId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal BasePrice { get; private set; }
    public decimal SellPrice { get; private set; }
    public string? Composition { get; private set; } // JSON of ingredients, percentages, origin
    public int StockQuantity { get; private set; }
    public string? Sku { get; private set; }
    public bool IsActive { get; private set; } = false; // Starts OFF until authority approves
    public string? ThumbnailUrl { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    // === Approval workflow (mirrors AbsPermit) ===
    /// <summary>True once an ADMIN/AUTHORITY has validated this product. Until then it is a pending "Solicitud".</summary>
    public bool IsApproved { get; private set; } = false;
    public DateTime? ApprovedAt { get; private set; }
    public Guid? ApprovedById { get; private set; }
    public string? RejectionReason { get; private set; }

    // === Soft delete ===
    public bool IsDeleted { get; private set; } = false;
    public DateTime? DeletedAt { get; private set; }

    /// <summary>Row version token used by EF Core for optimistic concurrency — prevents stock race conditions.</summary>
    public byte[]? RowVersion { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    // Navigation properties
    public User Entrepreneur { get; private set; } = null!;
    public ProductCategory? Category { get; private set; }
    public ICollection<ProductReview> Reviews { get; private set; } = new List<ProductReview>();
    public ICollection<Certification> Certifications { get; private set; } = new List<Certification>();
    public ICollection<ProductImage> Images { get; private set; } = new List<ProductImage>();
    public ICollection<OrderItem> OrderItems { get; private set; } = new List<OrderItem>();
    public ICollection<TraceabilityBatch> TraceabilityBatches { get; private set; } = new List<TraceabilityBatch>();

    private Product() { }

    public Product(
        Guid entrepreneurId,
        Guid baseSpeciesId,
        string name,
        string slug,
        string description,
        decimal basePrice,
        decimal sellPrice,
        int stockQuantity,
        int? categoryId = null,
        string? sku = null,
        string? composition = null,
        string? thumbnailUrl = null)
    {
        Id = Guid.NewGuid();
        EntrepreneurId = entrepreneurId;
        BaseSpeciesId = baseSpeciesId;
        Name = name;
        Slug = slug;
        Description = description;
        BasePrice = basePrice;
        SellPrice = sellPrice;
        StockQuantity = stockQuantity;
        CategoryId = categoryId;
        Sku = sku;
        Composition = composition;
        ThumbnailUrl = thumbnailUrl;
        IsActive = false; // Must be approved by authority
    }

    /// <summary>
    /// Updates the product with partial data. Only non-null values are applied.
    /// </summary>
    public void Update(
        string? name,
        string? slug,
        string? description,
        decimal? basePrice,
        decimal? sellPrice,
        int? stockQuantity,
        int? categoryId,
        string? sku,
        string? composition,
        string? thumbnailUrl)
    {
        if (name != null) Name = name;
        if (slug != null) Slug = slug;
        if (description != null) Description = description;
        if (basePrice.HasValue) BasePrice = basePrice.Value;
        if (sellPrice.HasValue) SellPrice = sellPrice.Value;
        if (stockQuantity.HasValue) StockQuantity = stockQuantity.Value;
        if (categoryId.HasValue) CategoryId = categoryId.Value;
        if (sku != null) Sku = sku;
        if (composition != null) Composition = composition;
        if (thumbnailUrl != null) ThumbnailUrl = thumbnailUrl;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Approves the product for sale. Sets it active so it appears in the public marketplace.
    /// </summary>
    public void Approve(Guid approverId)
    {
        IsApproved = true;
        ApprovedById = approverId;
        ApprovedAt = DateTime.UtcNow;
        RejectionReason = null;
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Rejects a pending product. Keeps it inactive and records the reason.
    /// </summary>
    public void Reject(Guid approverId, string reason)
    {
        IsApproved = false;
        ApprovedById = approverId;
        ApprovedAt = DateTime.UtcNow;
        RejectionReason = reason;
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Soft-deletes the product: hidden from all listings but retained for audit/orders.
    /// </summary>
    public void SoftDelete()
    {
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Activates the product in the marketplace. Only callable by AUTHORITY/ADMIN.
    /// </summary>
    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Deactivates the product from the marketplace.
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Decrements stock by the specified quantity. Throws if insufficient stock.
    /// </summary>
    public void DecrementStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be positive.", nameof(quantity));
        if (StockQuantity < quantity) throw new InvalidOperationException($"Insufficient stock. Available: {StockQuantity}, Requested: {quantity}.");
        StockQuantity -= quantity;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Increments stock by the specified quantity (e.g., order cancellation).
    /// </summary>
    public void IncrementStock(int quantity)
    {
        if (quantity <= 0) throw new ArgumentException("Quantity must be positive.", nameof(quantity));
        StockQuantity += quantity;
        UpdatedAt = DateTime.UtcNow;
    }
}
