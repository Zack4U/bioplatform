using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository interface for marketplace Products (SQL Server).
/// </summary>
public interface IProductRepository
{
    Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Product?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<Product?> GetBySlugAsync(string slug, CancellationToken ct = default);
    Task<Product?> GetBySlugWithDetailsAsync(string slug, CancellationToken ct = default);

    /// <summary>
    /// Public paginated query: only IsActive=true products.
    /// </summary>
    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetPublicFilteredAsync(
        string? query = null, int? categoryId = null, Guid? baseSpeciesId = null,
        decimal? minPrice = null, decimal? maxPrice = null,
        string sortBy = "name", string sortOrder = "asc",
        int page = 1, int pageSize = 12, CancellationToken ct = default);

    /// <summary>
    /// Managed paginated query: ADMIN sees all, ENTREPRENEUR sees only own products.
    /// </summary>
    Task<(IReadOnlyList<Product> Items, int TotalCount)> GetManagedFilteredAsync(
        Guid? entrepreneurId = null, bool? isActive = null,
        string? query = null, int? categoryId = null,
        string sortBy = "createdAt", string sortOrder = "desc",
        int page = 1, int pageSize = 12, CancellationToken ct = default);

    Task AddAsync(Product product, CancellationToken ct = default);
    Task<bool> ExistsBySlugExcludingIdAsync(string slug, Guid excludeId, CancellationToken ct = default);

    /// <summary>Returns available filter metadata: categories, price range.</summary>
    Task<(IReadOnlyList<ProductCategory> Categories, decimal MinPrice, decimal MaxPrice, int TotalCount)> GetFilterMetaAsync(CancellationToken ct = default);

    /// <summary>
    /// Returns active products related to the given product.
    /// Strategy: same category first; if none, same BaseSpeciesId.
    /// Excludes the source product. Results are ordered by average rating desc, then by name.
    /// </summary>
    Task<IReadOnlyList<Product>> GetRelatedAsync(
        Guid productId, int? categoryId, Guid baseSpeciesId,
        int limit = 6, CancellationToken ct = default);
}

