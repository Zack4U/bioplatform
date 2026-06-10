using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Commands;

// =============================================================================
// ACTIVATE USER (Admin only)
// =============================================================================

public record ActivateUserCommand(Guid UserId) : IRequest<Unit>;

public class ActivateUserCommandHandler : IRequestHandler<ActivateUserCommand, Unit>
{
    private readonly IUserRepository _repo;
    private readonly IUnitOfWork _uow;

    public ActivateUserCommandHandler(IUserRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(ActivateUserCommand request, CancellationToken ct)
    {
        var user = await _repo.GetByIdAsync(request.UserId)
            ?? throw new NotFoundException(nameof(User), request.UserId);

        if (user.IsActive)
            throw new ConflictException("User is already active.");

        user.Activate();
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// =============================================================================
// DEACTIVATE USER (Admin only — soft-delete)
// =============================================================================

public record DeactivateUserCommand(Guid UserId) : IRequest<Unit>;

public class DeactivateUserCommandHandler : IRequestHandler<DeactivateUserCommand, Unit>
{
    private readonly IUserRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeactivateUserCommandHandler(IUserRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeactivateUserCommand request, CancellationToken ct)
    {
        var user = await _repo.GetByIdAsync(request.UserId)
            ?? throw new NotFoundException(nameof(User), request.UserId);

        if (!user.IsActive)
            throw new ConflictException("User is already inactive.");

        user.Deactivate();
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
