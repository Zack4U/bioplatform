using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.ProductReviews.Queries;

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
