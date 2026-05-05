using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;
using Bio.Domain.Exceptions;
using Bio.Application.Features.Products.Commands;

namespace Bio.Application.Features.Products.Queries;

// === Public Product List ===
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
    public GetPublicProductsQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<PaginatedResult<ProductListItemDTO>> Handle(GetPublicProductsQuery q, CancellationToken ct)
    {
        var (items, total) = await _repo.GetPublicFilteredAsync(
            q.Query, q.CategoryId, q.BaseSpeciesId, q.MinPrice, q.MaxPrice,
            q.SortBy, q.SortOrder, q.Page, q.PageSize, ct);

        var dtos = items.Select(p => new ProductListItemDTO(
            p.Id, p.Slug, p.Name, p.ThumbnailUrl,
            p.BasePrice, p.SellPrice, p.StockQuantity, p.IsActive,
            p.Category?.Name,
            p.Reviews.Count > 0 ? p.Reviews.Average(r => r.Rating) : 0,
            p.Reviews.Count)).ToList();

        return PaginatedResult<ProductListItemDTO>.Create(dtos, total, q.Page, q.PageSize);
    }
}

// === Managed Product List ===
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

// === Get Product By Id (public) ===
public record GetProductByIdQuery(Guid Id) : IRequest<ProductDetailDTO>;

public class GetProductByIdQueryHandler : IRequestHandler<GetProductByIdQuery, ProductDetailDTO>
{
    private readonly IProductRepository _repo;
    public GetProductByIdQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<ProductDetailDTO> Handle(GetProductByIdQuery request, CancellationToken ct)
    {
        var product = await _repo.GetByIdWithDetailsAsync(request.Id, ct)
            ?? throw new NotFoundException("Product", request.Id);
        return CreateProductCommandHandler.MapToDetail(product);
    }
}

// === Get Product By Slug (public) ===
public record GetProductBySlugQuery(string Slug) : IRequest<ProductDetailDTO>;

public class GetProductBySlugQueryHandler : IRequestHandler<GetProductBySlugQuery, ProductDetailDTO>
{
    private readonly IProductRepository _repo;
    public GetProductBySlugQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<ProductDetailDTO> Handle(GetProductBySlugQuery request, CancellationToken ct)
    {
        var product = await _repo.GetBySlugWithDetailsAsync(request.Slug, ct)
            ?? throw new NotFoundException("Product", request.Slug);
        return CreateProductCommandHandler.MapToDetail(product);
    }
}

// === Product Filter Meta ===
public record GetProductFilterMetaQuery : IRequest<ProductFilterMetaDTO>;

public class GetProductFilterMetaQueryHandler : IRequestHandler<GetProductFilterMetaQuery, ProductFilterMetaDTO>
{
    private readonly IProductRepository _repo;
    public GetProductFilterMetaQueryHandler(IProductRepository repo) => _repo = repo;

    public async Task<ProductFilterMetaDTO> Handle(GetProductFilterMetaQuery request, CancellationToken ct)
    {
        var (categories, minPrice, maxPrice, total) = await _repo.GetFilterMetaAsync(ct);
        var categoryDtos = categories.Select(c => new ProductCategoryResponseDTO(c.Id, c.Name)).ToList();
        return new ProductFilterMetaDTO(categoryDtos, minPrice, maxPrice, total);
    }
}
