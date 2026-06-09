using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class ProductRepository : IProductRepository
{
    private readonly BioDbContext _ctx;
    public ProductRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<Product?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Products.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Product?> GetByIdWithDetailsAsync(Guid id, CancellationToken ct = default)
        => await _ctx.Products.Include(p => p.Category).Include(p => p.Images).Include(p => p.Reviews)
            .Include(p => p.Certifications).FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<Product?> GetBySlugAsync(string slug, CancellationToken ct = default)
        => await _ctx.Products.FirstOrDefaultAsync(p => p.Slug == slug, ct);

    public async Task<Product?> GetBySlugWithDetailsAsync(string slug, CancellationToken ct = default)
        => await _ctx.Products.Include(p => p.Category).Include(p => p.Images).Include(p => p.Reviews)
            .Include(p => p.Certifications).FirstOrDefaultAsync(p => p.Slug == slug, ct);

    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> GetPublicFilteredAsync(
        string? query, int? categoryId, Guid? baseSpeciesId,
        decimal? minPrice, decimal? maxPrice,
        string sortBy, string sortOrder, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.Products
            .Include(p => p.Category)
            .Include(p => p.Reviews)
            .Include(p => p.Certifications)
            .Include(p => p.Entrepreneur)
            .Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(p => p.Name.Contains(query) || p.Description.Contains(query));
        if (categoryId.HasValue) q = q.Where(p => p.CategoryId == categoryId);
        if (baseSpeciesId.HasValue) q = q.Where(p => p.BaseSpeciesId == baseSpeciesId);
        if (minPrice.HasValue) q = q.Where(p => p.SellPrice >= minPrice);
        if (maxPrice.HasValue) q = q.Where(p => p.SellPrice <= maxPrice);

        q = sortBy.ToLower() switch
        {
            "price" => sortOrder == "desc" ? q.OrderByDescending(p => p.SellPrice) : q.OrderBy(p => p.SellPrice),
            "createdat" => sortOrder == "desc" ? q.OrderByDescending(p => p.CreatedAt) : q.OrderBy(p => p.CreatedAt),
            _ => sortOrder == "desc" ? q.OrderByDescending(p => p.Name) : q.OrderBy(p => p.Name),
        };

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<(IReadOnlyList<Product> Items, int TotalCount)> GetManagedFilteredAsync(
        Guid? entrepreneurId, bool? isActive, string? query, int? categoryId,
        string sortBy, string sortOrder, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.Products.Include(p => p.Category).AsQueryable();

        if (entrepreneurId.HasValue) q = q.Where(p => p.EntrepreneurId == entrepreneurId);
        if (isActive.HasValue) q = q.Where(p => p.IsActive == isActive);
        if (!string.IsNullOrWhiteSpace(query))
            q = q.Where(p => p.Name.Contains(query) || p.Description.Contains(query));
        if (categoryId.HasValue) q = q.Where(p => p.CategoryId == categoryId);

        q = sortBy.ToLower() switch
        {
            "name" => sortOrder == "desc" ? q.OrderByDescending(p => p.Name) : q.OrderBy(p => p.Name),
            "price" => sortOrder == "desc" ? q.OrderByDescending(p => p.SellPrice) : q.OrderBy(p => p.SellPrice),
            _ => sortOrder == "desc" ? q.OrderByDescending(p => p.CreatedAt) : q.OrderBy(p => p.CreatedAt),
        };

        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(Product product, CancellationToken ct)
        => await _ctx.Products.AddAsync(product, ct);

    public async Task<bool> ExistsBySlugExcludingIdAsync(string slug, Guid excludeId, CancellationToken ct)
        => await _ctx.Products.AnyAsync(p => p.Slug == slug && p.Id != excludeId, ct);

    public async Task<(IReadOnlyList<ProductCategory> Categories, decimal MinPrice, decimal MaxPrice, int TotalCount)> GetFilterMetaAsync(CancellationToken ct)
    {
        var categories = await _ctx.ProductCategories.OrderBy(c => c.Name).ToListAsync(ct);
        var activeProducts = _ctx.Products.Where(p => p.IsActive);
        var any = await activeProducts.AnyAsync(ct);
        var minPrice = any ? await activeProducts.MinAsync(p => p.SellPrice, ct) : 0;
        var maxPrice = any ? await activeProducts.MaxAsync(p => p.SellPrice, ct) : 0;
        var total = any ? await activeProducts.CountAsync(ct) : 0;
        return (categories, minPrice, maxPrice, total);
    }

    public async Task<IReadOnlyList<Product>> GetRelatedAsync(
        Guid productId, int? categoryId, Guid baseSpeciesId,
        int limit = 6, CancellationToken ct = default)
    {
        // Strategy 1: same category (if available)
        if (categoryId.HasValue)
        {
            var byCat = await _ctx.Products
                .Include(p => p.Category)
                .Include(p => p.Reviews)
                .Include(p => p.Certifications)
                .Include(p => p.Entrepreneur)
                .Where(p => p.IsActive && p.Id != productId && p.CategoryId == categoryId)
                .ToListAsync(ct);

            if (byCat.Count >= 2)
                return byCat
                    .OrderByDescending(p => p.Reviews.Count > 0 ? p.Reviews.Average(r => r.Rating) : 0)
                    .ThenBy(p => p.Name)
                    .Take(limit)
                    .ToList();
        }

        // Strategy 2: same biological species (cross-category fallback)
        var bySpecies = await _ctx.Products
            .Include(p => p.Category)
            .Include(p => p.Reviews)
            .Where(p => p.IsActive && p.Id != productId && p.BaseSpeciesId == baseSpeciesId)
            .ToListAsync(ct);

        return bySpecies
            .OrderByDescending(p => p.Reviews.Count > 0 ? p.Reviews.Average(r => r.Rating) : 0)
            .ThenBy(p => p.Name)
            .Take(limit)
            .ToList();
    }
}

