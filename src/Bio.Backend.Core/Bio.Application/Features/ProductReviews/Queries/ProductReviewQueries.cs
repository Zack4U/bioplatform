using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ProductReviews.Queries;

// ═══════════════════════════════════════════════════════════════════════════════
// GET REVIEWS BY PRODUCT (public, no cache — reviews change frequently)
// ═══════════════════════════════════════════════════════════════════════════════
public record GetProductReviewsQuery(Guid ProductId, int Page = 1, int PageSize = 10) : IRequest<PaginatedResult<ProductReviewResponseDTO>>;

public class GetProductReviewsQueryHandler : IRequestHandler<GetProductReviewsQuery, PaginatedResult<ProductReviewResponseDTO>>
{
    private readonly IProductReviewRepository _repo;
    public GetProductReviewsQueryHandler(IProductReviewRepository repo) => _repo = repo;

    public async Task<PaginatedResult<ProductReviewResponseDTO>> Handle(GetProductReviewsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetByProductIdAsync(request.ProductId, request.Page, request.PageSize, ct);
        var dtos = items.Select(r => new ProductReviewResponseDTO(r.Id, r.UserId, r.Rating, r.Title, r.Comment, r.CreatedAt)).ToList();
        return PaginatedResult<ProductReviewResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET MANAGED REVIEWS (Admin — all; Entrepreneur — scoped to own products)
// ═══════════════════════════════════════════════════════════════════════════════
public record GetManagedReviewsQuery(Guid? EntrepreneurId = null, bool? IsReported = null, int Page = 1, int PageSize = 10)
    : IRequest<PaginatedResult<ReviewManagedListItemDTO>>;

public class GetManagedReviewsQueryHandler : IRequestHandler<GetManagedReviewsQuery, PaginatedResult<ReviewManagedListItemDTO>>
{
    private readonly IProductReviewRepository _repo;
    public GetManagedReviewsQueryHandler(IProductReviewRepository repo) => _repo = repo;

    public async Task<PaginatedResult<ReviewManagedListItemDTO>> Handle(GetManagedReviewsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetManagedAsync(request.EntrepreneurId, request.IsReported, request.Page, request.PageSize, ct);

        var dtos = items.Select(r => new ReviewManagedListItemDTO(
            r.Id, r.ProductId, r.Product?.Name ?? "", r.Product?.Slug ?? "",
            r.UserId, r.User?.FullName, r.Rating, r.Title, r.Comment,
            r.IsReported, r.ReportReason, r.ReportedById, r.ReportedBy?.FullName, r.ReportedAt,
            r.CreatedAt)).ToList();

        return PaginatedResult<ReviewManagedListItemDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET MY REVIEWS (authenticated user — for profile "Mis Reseñas" tab)
// ═══════════════════════════════════════════════════════════════════════════════
public record GetMyReviewsQuery(Guid UserId, int Page = 1, int PageSize = 10) : IRequest<PaginatedResult<MyReviewResponseDTO>>;

public class GetMyReviewsQueryHandler : IRequestHandler<GetMyReviewsQuery, PaginatedResult<MyReviewResponseDTO>>
{
    private readonly IProductReviewRepository _repo;
    public GetMyReviewsQueryHandler(IProductReviewRepository repo) => _repo = repo;

    public async Task<PaginatedResult<MyReviewResponseDTO>> Handle(GetMyReviewsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetByUserIdAsync(request.UserId, request.Page, request.PageSize, ct);

        var dtos = items.Select(r => new MyReviewResponseDTO(
            ReviewId: r.Id,
            ProductId: r.ProductId,
            ProductName: r.Product?.Name ?? string.Empty,
            ProductSlug: r.Product?.Slug ?? string.Empty,
            ProductThumbnailUrl: r.Product?.ThumbnailUrl,
            Rating: r.Rating,
            Title: r.Title,
            Comment: r.Comment,
            CreatedAt: r.CreatedAt
        )).ToList();

        return PaginatedResult<MyReviewResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}
