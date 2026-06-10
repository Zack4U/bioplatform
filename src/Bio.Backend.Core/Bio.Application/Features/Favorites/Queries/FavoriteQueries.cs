using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Favorites.Queries;

/// <summary>
/// Returns the user's favourited PRODUCTS, enriched with product data
/// (name, slug, thumbnail, price, rating) so the client can render real cards.
/// </summary>
public record GetMyFavoritesQuery(Guid UserId, string? TargetType = null, int Page = 1, int PageSize = 10)
    : IRequest<PaginatedResult<ProductListItemDTO>>;

public class GetMyFavoritesQueryHandler : IRequestHandler<GetMyFavoritesQuery, PaginatedResult<ProductListItemDTO>>
{
    private readonly IFavoriteRepository _repo;
    private readonly IProductRepository _productRepo;

    public GetMyFavoritesQueryHandler(IFavoriteRepository repo, IProductRepository productRepo)
    { _repo = repo; _productRepo = productRepo; }

    public async Task<PaginatedResult<ProductListItemDTO>> Handle(GetMyFavoritesQuery request, CancellationToken ct)
    {
        // Default to product favourites — the only target type the marketplace exposes.
        var targetType = request.TargetType ?? "Product";
        var (items, total) = await _repo.GetByUserIdAsync(request.UserId, targetType, request.Page, request.PageSize, ct);

        var productIds = items.Select(f => f.TargetId).ToList();
        var products = await _productRepo.GetByIdsAsync(productIds, ct);
        var byId = products.ToDictionary(p => p.Id);

        // Preserve favourite ordering; drop any favourite whose product no longer exists.
        var dtos = items
            .Where(f => byId.ContainsKey(f.TargetId))
            .Select(f =>
            {
                var p = byId[f.TargetId];
                return new ProductListItemDTO(
                    p.Id, p.Slug, p.Name, p.ThumbnailUrl,
                    p.BasePrice, p.SellPrice, p.StockQuantity, p.IsActive,
                    p.Category?.Name,
                    p.Reviews.Count > 0 ? p.Reviews.Average(r => r.Rating) : 0,
                    p.Reviews.Count);
            })
            .ToList();

        return PaginatedResult<ProductListItemDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}
