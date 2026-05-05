using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Favorites.Commands;

public record AddFavoriteCommand(FavoriteCreateDTO Dto, Guid UserId) : IRequest<FavoriteResponseDTO>;

public class AddFavoriteCommandHandler : IRequestHandler<AddFavoriteCommand, FavoriteResponseDTO>
{
    private readonly IFavoriteRepository _repo;
    private readonly IUnitOfWork _uow;

    public AddFavoriteCommandHandler(IFavoriteRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<FavoriteResponseDTO> Handle(AddFavoriteCommand request, CancellationToken ct)
    {
        if (await _repo.ExistsAsync(request.UserId, request.Dto.TargetType, request.Dto.TargetId, ct))
            throw new ConflictException("This item is already in your favorites.");

        var favorite = new Favorite(request.UserId, request.Dto.TargetType, request.Dto.TargetId);
        await _repo.AddAsync(favorite, ct);
        await _uow.SaveChangesAsync(ct);
        return new FavoriteResponseDTO(favorite.Id, favorite.TargetType, favorite.TargetId, favorite.CreatedAt);
    }
}

public record RemoveFavoriteCommand(Guid FavoriteId, Guid UserId) : IRequest<Unit>;

public class RemoveFavoriteCommandHandler : IRequestHandler<RemoveFavoriteCommand, Unit>
{
    private readonly IFavoriteRepository _repo;
    private readonly IUnitOfWork _uow;

    public RemoveFavoriteCommandHandler(IFavoriteRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(RemoveFavoriteCommand request, CancellationToken ct)
    {
        var favorite = await _repo.GetByIdAsync(request.FavoriteId, ct)
            ?? throw new NotFoundException(nameof(Favorite), request.FavoriteId);
        if (favorite.UserId != request.UserId)
            throw new ForbiddenException("You can only remove your own favorites.");

        await _repo.DeleteAsync(favorite, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
