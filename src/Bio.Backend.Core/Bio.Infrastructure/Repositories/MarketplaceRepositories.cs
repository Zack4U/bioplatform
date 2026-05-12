using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class ProductImageRepository : IProductImageRepository
{
    private readonly BioDbContext _ctx;
    public ProductImageRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<IReadOnlyList<ProductImage>> GetByProductIdAsync(Guid productId, CancellationToken ct)
        => await _ctx.ProductImages.Where(i => i.ProductId == productId).OrderBy(i => i.DisplayOrder).ToListAsync(ct);

    public async Task<ProductImage?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.ProductImages.FirstOrDefaultAsync(i => i.Id == id, ct);

    public async Task AddAsync(ProductImage image, CancellationToken ct)
        => await _ctx.ProductImages.AddAsync(image, ct);

    public async Task DeleteAsync(ProductImage image, CancellationToken ct)
    { _ctx.ProductImages.Remove(image); await Task.CompletedTask; }

    public async Task ClearPrimaryForProductAsync(Guid productId, CancellationToken ct)
    {
        var images = await _ctx.ProductImages.Where(i => i.ProductId == productId && i.IsPrimary).ToListAsync(ct);
        foreach (var img in images) img.SetPrimary(false);
    }
}

public class ProductCategoryRepository : IProductCategoryRepository
{
    private readonly BioDbContext _ctx;
    public ProductCategoryRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<IReadOnlyList<ProductCategory>> GetAllAsync(CancellationToken ct)
        => await _ctx.ProductCategories.OrderBy(c => c.Name).ToListAsync(ct);

    public async Task<ProductCategory?> GetByIdAsync(int id, CancellationToken ct)
        => await _ctx.ProductCategories.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(ProductCategory category, CancellationToken ct)
        => await _ctx.ProductCategories.AddAsync(category, ct);

    public async Task DeleteAsync(ProductCategory category, CancellationToken ct)
    { _ctx.ProductCategories.Remove(category); await Task.CompletedTask; }

    public async Task<bool> ExistsByNameAsync(string name, CancellationToken ct)
        => await _ctx.ProductCategories.AnyAsync(c => c.Name == name, ct);

    public async Task<bool> ExistsByNameExcludingIdAsync(string name, int excludeId, CancellationToken ct)
        => await _ctx.ProductCategories.AnyAsync(c => c.Name == name && c.Id != excludeId, ct);
}

public class ProductReviewRepository : IProductReviewRepository
{
    private readonly BioDbContext _ctx;
    public ProductReviewRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<(IReadOnlyList<ProductReview> Items, int TotalCount)> GetByProductIdAsync(Guid productId, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.ProductReviews.Where(r => r.ProductId == productId).OrderByDescending(r => r.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<(IReadOnlyList<ProductReview> Items, int TotalCount)> GetByUserIdAsync(Guid userId, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.ProductReviews
            .Include(r => r.Product)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<ProductReview?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.ProductReviews.FirstOrDefaultAsync(r => r.Id == id, ct);

    public async Task AddAsync(ProductReview review, CancellationToken ct)
        => await _ctx.ProductReviews.AddAsync(review, ct);

    public async Task DeleteAsync(ProductReview review, CancellationToken ct)
    { _ctx.ProductReviews.Remove(review); await Task.CompletedTask; }

    public async Task<bool> ExistsByUserAndProductAsync(Guid userId, Guid productId, CancellationToken ct)
        => await _ctx.ProductReviews.AnyAsync(r => r.UserId == userId && r.ProductId == productId, ct);

    public async Task<(double AverageRating, int TotalCount)> GetAggregateByEntrepreneurIdAsync(
        Guid entrepreneurId, CancellationToken ct)
    {
        var reviews = await _ctx.ProductReviews
            .Where(r => r.Product != null && r.Product.EntrepreneurId == entrepreneurId)
            .Select(r => r.Rating)
            .ToListAsync(ct);

        if (reviews.Count == 0) return (0.0, 0);
        return (reviews.Average(), reviews.Count);
    }
}

public class OrderRepository : IOrderRepository
{
    private readonly BioDbContext _ctx;
    public OrderRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<Order?> GetByIdWithItemsAsync(Guid id, CancellationToken ct)
        => await _ctx.Orders.Include(o => o.OrderItems).ThenInclude(i => i.Product).FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<(IReadOnlyList<Order> Items, int TotalCount)> GetByBuyerIdAsync(Guid buyerId, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.Orders.Include(o => o.OrderItems).Where(o => o.BuyerId == buyerId).OrderByDescending(o => o.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<(IReadOnlyList<Order> Items, int TotalCount)> GetManagedAsync(string? status, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.Orders.Include(o => o.OrderItems).ThenInclude(i => i.Product).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(o => o.Status == status);
        q = q.OrderByDescending(o => o.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task AddAsync(Order order, CancellationToken ct)
        => await _ctx.Orders.AddAsync(order, ct);

    public async Task<string> GenerateOrderNumberAsync(CancellationToken ct)
    {
        var date = DateTime.UtcNow.ToString("yyyyMMdd");
        var count = await _ctx.Orders.CountAsync(o => o.OrderNumber.StartsWith($"ORD-{date}"), ct);
        return $"ORD-{date}-{(count + 1):D4}";
    }

    public async Task<(IReadOnlyList<Order> Items, int TotalCount)> GetByEntrepreneurIdAsync(
        Guid entrepreneurId, string? status, int page, int pageSize, CancellationToken ct, DateTime? fromDate = null)
    {
        var q = _ctx.Orders
            .Include(o => o.OrderItems).ThenInclude(i => i.Product)
            .Where(o => o.OrderItems.Any(i => i.Product != null && i.Product.EntrepreneurId == entrepreneurId))
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(o => o.Status == status);
        if (fromDate.HasValue) q = q.Where(o => o.CreatedAt >= fromDate.Value);

        q = q.OrderByDescending(o => o.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<bool> HasPurchasedProductAsync(Guid buyerId, Guid productId, CancellationToken ct)
        => await _ctx.Orders.AnyAsync(o =>
            o.BuyerId == buyerId &&
            (o.Status == "Paid" || o.Status == "Delivered" || o.Status == "Shipped") &&
            o.OrderItems.Any(i => i.ProductId == productId), ct);
}

public class FavoriteRepository : IFavoriteRepository
{
    private readonly BioDbContext _ctx;
    public FavoriteRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<(IReadOnlyList<Favorite> Items, int TotalCount)> GetByUserIdAsync(Guid userId, string? targetType, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.Favorites.Where(f => f.UserId == userId);
        if (!string.IsNullOrWhiteSpace(targetType)) q = q.Where(f => f.TargetType == targetType);
        q = q.OrderByDescending(f => f.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<Favorite?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.Favorites.FirstOrDefaultAsync(f => f.Id == id, ct);

    public async Task AddAsync(Favorite favorite, CancellationToken ct)
        => await _ctx.Favorites.AddAsync(favorite, ct);

    public async Task DeleteAsync(Favorite favorite, CancellationToken ct)
    { _ctx.Favorites.Remove(favorite); await Task.CompletedTask; }

    public async Task<bool> ExistsAsync(Guid userId, string targetType, Guid targetId, CancellationToken ct)
        => await _ctx.Favorites.AnyAsync(f => f.UserId == userId && f.TargetType == targetType && f.TargetId == targetId, ct);
}

public class AddressRepository : IAddressRepository
{
    private readonly BioDbContext _ctx;
    public AddressRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<IReadOnlyList<Address>> GetByUserIdAsync(Guid userId, CancellationToken ct)
        => await _ctx.Addresses.Where(a => a.UserId == userId).OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.CreatedAt).ToListAsync(ct);

    public async Task<Address?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.Addresses.FirstOrDefaultAsync(a => a.Id == id, ct);

    public async Task AddAsync(Address address, CancellationToken ct)
        => await _ctx.Addresses.AddAsync(address, ct);

    public async Task DeleteAsync(Address address, CancellationToken ct)
    { _ctx.Addresses.Remove(address); await Task.CompletedTask; }

    public async Task ClearDefaultsForUserAsync(Guid userId, string addressType, CancellationToken ct)
    {
        var defaults = await _ctx.Addresses.Where(a => a.UserId == userId && a.AddressType == addressType && a.IsDefault).ToListAsync(ct);
        foreach (var addr in defaults) addr.Update(null, null, null, null, null, null, null, null, false);
    }
}

public class CertificationRepository : ICertificationRepository
{
    private readonly BioDbContext _ctx;
    public CertificationRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<IReadOnlyList<Certification>> GetByProductIdAsync(Guid productId, CancellationToken ct)
        => await _ctx.Certifications.Where(c => c.ProductId == productId).OrderByDescending(c => c.CreatedAt).ToListAsync(ct);

    public async Task<Certification?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.Certifications.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AddAsync(Certification cert, CancellationToken ct)
        => await _ctx.Certifications.AddAsync(cert, ct);

    public async Task DeleteAsync(Certification cert, CancellationToken ct)
    { _ctx.Certifications.Remove(cert); await Task.CompletedTask; }
}

public class AbsPermitRepository : IAbsPermitRepository
{
    private readonly BioDbContext _ctx;
    public AbsPermitRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<AbsPermit?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.AbsPermits.FirstOrDefaultAsync(p => p.Id == id, ct);

    public async Task<IReadOnlyList<AbsPermit>> GetByEntrepreneurIdAsync(Guid entrepreneurId, CancellationToken ct)
        => await _ctx.AbsPermits.Where(p => p.EntrepreneurId == entrepreneurId).OrderByDescending(p => p.EmissionDate).ToListAsync(ct);

    public async Task<AbsPermit?> GetActiveByEntrepreneurAndSpeciesAsync(Guid entrepreneurId, Guid speciesId, CancellationToken ct)
        => await _ctx.AbsPermits.FirstOrDefaultAsync(p =>
            p.EntrepreneurId == entrepreneurId && p.SpeciesId == speciesId &&
            p.Status == "Active" && p.ExpirationDate > DateTime.UtcNow, ct);

    public async Task AddAsync(AbsPermit permit, CancellationToken ct)
        => await _ctx.AbsPermits.AddAsync(permit, ct);
}

public class CartRepository : ICartRepository
{
    private readonly BioDbContext _ctx;
    public CartRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<Cart?> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
        => await _ctx.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId, ct);

    public async Task<Cart?> GetByIdWithItemsAsync(Guid cartId, CancellationToken ct = default)
        => await _ctx.Carts
            .Include(c => c.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.Id == cartId, ct);

    public async Task<CartItem?> GetItemByIdAsync(Guid itemId, CancellationToken ct = default)
        => await _ctx.CartItems.FirstOrDefaultAsync(i => i.Id == itemId, ct);

    public async Task AddAsync(Cart cart, CancellationToken ct = default)
        => await _ctx.Carts.AddAsync(cart, ct);

    public async Task AddItemAsync(CartItem item, CancellationToken ct = default)
        => await _ctx.CartItems.AddAsync(item, ct);

    public async Task RemoveItemAsync(CartItem item, CancellationToken ct = default)
    { _ctx.CartItems.Remove(item); await Task.CompletedTask; }

    public async Task<bool> ItemExistsAsync(Guid cartId, Guid productId, CancellationToken ct = default)
        => await _ctx.CartItems.AnyAsync(i => i.CartId == cartId && i.ProductId == productId, ct);

    public async Task<CartItem?> GetItemByProductAsync(Guid cartId, Guid productId, CancellationToken ct = default)
        => await _ctx.CartItems.FirstOrDefaultAsync(i => i.CartId == cartId && i.ProductId == productId, ct);
}

public class TraceabilityBatchRepository : ITraceabilityBatchRepository
{
    private readonly BioDbContext _ctx;
    public TraceabilityBatchRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<TraceabilityBatch?> GetByIdAsync(Guid id, CancellationToken ct = default)
        => await _ctx.TraceabilityBatches.FirstOrDefaultAsync(b => b.Id == id, ct);

    public async Task<IReadOnlyList<TraceabilityBatch>> GetByProductIdAsync(Guid productId, CancellationToken ct = default)
        => await _ctx.TraceabilityBatches
            .Where(b => b.ProductId == productId)
            .OrderByDescending(b => b.HarvestDate)
            .ToListAsync(ct);

    public async Task<bool> ExistsByBatchCodeAsync(string batchCode, CancellationToken ct = default)
        => await _ctx.TraceabilityBatches.AnyAsync(b => b.BatchCode == batchCode, ct);

    public async Task AddAsync(TraceabilityBatch batch, CancellationToken ct = default)
        => await _ctx.TraceabilityBatches.AddAsync(batch, ct);

    public async Task DeleteAsync(TraceabilityBatch batch, CancellationToken ct = default)
    { _ctx.TraceabilityBatches.Remove(batch); await Task.CompletedTask; }
}
