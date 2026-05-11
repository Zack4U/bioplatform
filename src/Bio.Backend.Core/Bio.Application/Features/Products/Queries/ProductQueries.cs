using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;
using Bio.Domain.Exceptions;
using Bio.Application.Features.Products.Commands;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Bio.Application.Features.Products.Queries;

// ── Cache key constants ───────────────────────────────────────────────────────
internal static class CacheKeys
{
    internal static string PublicProductList(object queryParams)
    {
        var json = JsonSerializer.Serialize(queryParams);
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(json)))[..12];
        return $"products:public:{hash}";
    }
    internal static string ProductById(Guid id) => $"product:id:{id}";
    internal static string ProductBySlug(string slug) => $"product:slug:{slug}";
    internal const string FilterMeta = "products:filter-meta";
    internal const string PublicProductsPrefix = "products:public:";
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC PRODUCT LIST (cached 5 min)
// ═══════════════════════════════════════════════════════════════════════════════
public record GetPublicProductsQuery : IRequest<PaginatedResult<ProductListItemDTO>>
{
    public string? Query { get; init; }
    public int? CategoryId { get; init; }
    public Guid? BaseSpeciesId { get; init; }
    public decimal? MinPrice { get; init; }
    public decimal? MaxPrice { get; init; }
    public string SortBy { get; init; } = "name";
    public string SortOrder { get; init; } = "asc";
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 12;
}

public class GetPublicProductsQueryHandler : IRequestHandler<GetPublicProductsQuery, PaginatedResult<ProductListItemDTO>>
{
    private readonly IProductRepository _repo;
    private readonly ICacheService _cache;

    public GetPublicProductsQueryHandler(IProductRepository repo, ICacheService cache)
    { _repo = repo; _cache = cache; }

    public async Task<PaginatedResult<ProductListItemDTO>> Handle(GetPublicProductsQuery q, CancellationToken ct)
    {
        var cacheKey = CacheKeys.PublicProductList(new { q.Query, q.CategoryId, q.BaseSpeciesId, q.MinPrice, q.MaxPrice, q.SortBy, q.SortOrder, q.Page, q.PageSize });
        var cached = await _cache.GetAsync<PaginatedResult<ProductListItemDTO>>(cacheKey, ct);
        if (cached is not null) return cached;

        var (items, total) = await _repo.GetPublicFilteredAsync(
            q.Query, q.CategoryId, q.BaseSpeciesId, q.MinPrice, q.MaxPrice,
            q.SortBy, q.SortOrder, q.Page, q.PageSize, ct);

        var dtos = items.Select(p => new ProductListItemDTO(
            p.Id, p.Slug, p.Name, p.ThumbnailUrl,
            p.BasePrice, p.SellPrice, p.StockQuantity, p.IsActive,
            p.Category?.Name,
            p.Reviews.Count > 0 ? p.Reviews.Average(r => r.Rating) : 0,
            p.Reviews.Count)).ToList();

        var result = PaginatedResult<ProductListItemDTO>.Create(dtos, total, q.Page, q.PageSize);
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5), ct);
        return result;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANAGED PRODUCT LIST (no cache — admin/entrepreneur sees live data)
// ═══════════════════════════════════════════════════════════════════════════════
public record GetManagedProductsQuery : IRequest<PaginatedResult<ProductManagedListItemDTO>>
{
    public Guid? EntrepreneurId { get; init; }
    public bool? IsActive { get; init; }
    public string? Query { get; init; }
    public int? CategoryId { get; init; }
    public string SortBy { get; init; } = "createdAt";
    public string SortOrder { get; init; } = "desc";
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 12;
}

public class GetManagedProductsQueryHandler : IRequestHandler<GetManagedProductsQuery, PaginatedResult<ProductManagedListItemDTO>>
{
    private readonly IProductRepository _repo;
    public GetManagedProductsQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<PaginatedResult<ProductManagedListItemDTO>> Handle(GetManagedProductsQuery q, CancellationToken ct)
    {
        var (items, total) = await _repo.GetManagedFilteredAsync(
            q.EntrepreneurId, q.IsActive, q.Query, q.CategoryId,
            q.SortBy, q.SortOrder, q.Page, q.PageSize, ct);

        var dtos = items.Select(p => new ProductManagedListItemDTO(
            p.Id, p.Slug, p.Name, p.ThumbnailUrl,
            p.BasePrice, p.SellPrice, p.StockQuantity, p.IsActive,
            p.Category?.Name, p.EntrepreneurId,
            p.CreatedAt, p.UpdatedAt)).ToList();

        return PaginatedResult<ProductManagedListItemDTO>.Create(dtos, total, q.Page, q.PageSize);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET BY ID (cached 10 min)
// ═══════════════════════════════════════════════════════════════════════════════
public record GetProductByIdQuery(Guid Id) : IRequest<ProductDetailDTO>;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductDetailDTO>
{
    private readonly IProductRepository _repo;
    private readonly ICacheService _cache;

    public GetProductByIdQueryHandler(IProductRepository repo, ICacheService cache)
    { _repo = repo; _cache = cache; }

    public async Task<ProductDetailDTO> Handle(GetProductByIdQuery request, CancellationToken ct)
    {
        var cacheKey = CacheKeys.ProductById(request.Id);
        var cached = await _cache.GetAsync<ProductDetailDTO>(cacheKey, ct);
        if (cached is not null) return cached;

        var product = await _repo.GetByIdWithDetailsAsync(request.Id, ct)
            ?? throw new NotFoundException("Product", request.Id);

        var dto = CreateProductCommandHandler.MapToDetail(product);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), ct);
        return dto;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET BY SLUG (cached 10 min)
// ═══════════════════════════════════════════════════════════════════════════════
public record GetProductBySlugQuery(string Slug) : IRequest<ProductDetailDTO>;

public class GetProductBySlugQueryHandler : IRequestHandler<GetProductBySlugQuery, ProductDetailDTO>
{
    private readonly IProductRepository _repo;
    private readonly ICacheService _cache;

    public GetProductBySlugQueryHandler(IProductRepository repo, ICacheService cache)
    { _repo = repo; _cache = cache; }

    public async Task<ProductDetailDTO> Handle(GetProductBySlugQuery request, CancellationToken ct)
    {
        var cacheKey = CacheKeys.ProductBySlug(request.Slug);
        var cached = await _cache.GetAsync<ProductDetailDTO>(cacheKey, ct);
        if (cached is not null) return cached;

        var product = await _repo.GetBySlugWithDetailsAsync(request.Slug, ct)
            ?? throw new NotFoundException("Product", request.Slug);

        var dto = CreateProductCommandHandler.MapToDetail(product);
        await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), ct);
        return dto;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER META (cached 15 min)
// ═══════════════════════════════════════════════════════════════════════════════
public record GetProductFilterMetaQuery : IRequest<ProductFilterMetaDTO>;

public class GetProductFilterMetaQueryHandler : IRequestHandler<GetProductFilterMetaQuery, ProductFilterMetaDTO>
{
    private readonly IProductRepository _repo;
    private readonly ICacheService _cache;

    public GetProductFilterMetaQueryHandler(IProductRepository repo, ICacheService cache)
    { _repo = repo; _cache = cache; }

    public async Task<ProductFilterMetaDTO> Handle(GetProductFilterMetaQuery request, CancellationToken ct)
    {
        var cached = await _cache.GetAsync<ProductFilterMetaDTO>(CacheKeys.FilterMeta, ct);
        if (cached is not null) return cached;

        var (categories, minPrice, maxPrice, total) = await _repo.GetFilterMetaAsync(ct);
        var categoryDtos = categories.Select(c => new ProductCategoryResponseDTO(c.Id, c.Name)).ToList();
        var dto = new ProductFilterMetaDTO(categoryDtos, minPrice, maxPrice, total);

        await _cache.SetAsync(CacheKeys.FilterMeta, dto, TimeSpan.FromMinutes(15), ct);
        return dto;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET RELATED PRODUCTS (cached 10 min per product)
// Strategy: same category (preferred) → same species (fallback) → empty list
// ═══════════════════════════════════════════════════════════════════════════════
public record GetRelatedProductsQuery(Guid ProductId, int Limit = 6) : IRequest<IReadOnlyList<ProductListItemDTO>>;

public class GetRelatedProductsQueryHandler : IRequestHandler<GetRelatedProductsQuery, IReadOnlyList<ProductListItemDTO>>
{
    private readonly IProductRepository _productRepo;
    private readonly ICacheService _cache;

    public GetRelatedProductsQueryHandler(IProductRepository productRepo, ICacheService cache)
    { _productRepo = productRepo; _cache = cache; }

    public async Task<IReadOnlyList<ProductListItemDTO>> Handle(GetRelatedProductsQuery request, CancellationToken ct)
    {
        var cacheKey = $"products:related:{request.ProductId}:{request.Limit}";
        var cached = await _cache.GetAsync<IReadOnlyList<ProductListItemDTO>>(cacheKey, ct);
        if (cached is not null) return cached;

        // Fetch source product to get category and species context
        var source = await _productRepo.GetByIdAsync(request.ProductId, ct);
        if (source is null) return Array.Empty<ProductListItemDTO>();

        var related = await _productRepo.GetRelatedAsync(
            request.ProductId, source.CategoryId, source.BaseSpeciesId, request.Limit, ct);

        var dtos = related.Select(p => new ProductListItemDTO(
            p.Id, p.Slug, p.Name, p.ThumbnailUrl,
            p.BasePrice, p.SellPrice, p.StockQuantity, p.IsActive,
            p.Category?.Name,
            p.Reviews.Count > 0 ? p.Reviews.Average(r => r.Rating) : 0,
            p.Reviews.Count)).ToList();

        await _cache.SetAsync(cacheKey, (IReadOnlyList<ProductListItemDTO>)dtos, TimeSpan.FromMinutes(10), ct);
        return dtos;
    }
}
