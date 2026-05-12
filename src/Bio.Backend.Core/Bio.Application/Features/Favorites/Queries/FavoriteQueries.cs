using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Favorites.Queries;

public record GetMyFavoritesQuery(Guid UserId, string? TargetType = null, int Page = 1, int PageSize = 10) : IRequest<PaginatedResult<FavoriteResponseDTO>>;

public class GetMyFavoritesQueryHandler : IRequestHandler<GetMyFavoritesQuery, PaginatedResult<FavoriteResponseDTO>>
{
    private readonly IFavoriteRepository _repo;
    public GetMyFavoritesQueryHandler(IFavoriteRepository repo) => _repo = repo;

    public async Task<PaginatedResult<FavoriteResponseDTO>> Handle(GetMyFavoritesQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetByUserIdAsync(request.UserId, request.TargetType, request.Page, request.PageSize, ct);
        var dtos = items.Select(f => new FavoriteResponseDTO(f.Id, f.TargetType, f.TargetId, f.CreatedAt)).ToList();
        return PaginatedResult<FavoriteResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}
