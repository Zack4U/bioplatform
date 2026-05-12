using Bio.Application.DTOs;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentValidation;
using MediatR;

namespace Bio.Application.Features.Community.Connections.Commands;

// =============================================================================
// INTERNAL MAPPER
// =============================================================================

internal static class ConnectionMapper
{
    internal static UserConnectionResponseDTO ToResponse(UserConnection c) => new(
        c.Id,
        c.RequesterId,
        c.Requester?.FullName ?? string.Empty,
        c.AddresseeId,
        c.Addressee?.FullName ?? string.Empty,
        c.Status,
        c.Message,
        c.CreatedAt,
        c.RespondedAt);
}

// =============================================================================
// SEND CONNECTION REQUEST
// =============================================================================

public record SendConnectionRequestCommand(
    UserConnectionRequestDTO Dto,
    Guid RequesterId) : IRequest<UserConnectionResponseDTO>;

public class SendConnectionRequestCommandHandler
    : IRequestHandler<SendConnectionRequestCommand, UserConnectionResponseDTO>
{
    private readonly IUserConnectionRepository _repo;
    private readonly IUserRepository _userRepo;
    private readonly IUnitOfWork _uow;

    public SendConnectionRequestCommandHandler(
        IUserConnectionRepository repo, IUserRepository userRepo, IUnitOfWork uow)
    { _repo = repo; _userRepo = userRepo; _uow = uow; }

    public async Task<UserConnectionResponseDTO> Handle(
        SendConnectionRequestCommand request, CancellationToken ct)
    {
        if (request.RequesterId == request.Dto.AddresseeId)
            throw new Bio.Domain.Exceptions.ValidationException("Cannot send a connection request to yourself.");

        _ = await _userRepo.GetByIdAsync(request.Dto.AddresseeId)
            ?? throw new NotFoundException(nameof(User), request.Dto.AddresseeId);

        // Prevent duplicates: check both directions
        var existing = await _repo.GetExistingConnectionAsync(
            request.RequesterId, request.Dto.AddresseeId, ct)
            ?? await _repo.GetExistingConnectionAsync(
                request.Dto.AddresseeId, request.RequesterId, ct);

        if (existing is not null)
        {
            if (existing.Status == "Pending")
                throw new ConflictException("A connection request already exists between these users.");
            if (existing.Status == "Accepted")
                throw new ConflictException("These users are already connected.");
            if (existing.Status == "Blocked")
                throw new ForbiddenException("Connection is blocked.");
        }

        var connection = new UserConnection(
            request.RequesterId, request.Dto.AddresseeId, request.Dto.Message);
        await _repo.AddAsync(connection, ct);
        await _uow.SaveChangesAsync(ct);
        return ConnectionMapper.ToResponse(connection);
    }
}

// =============================================================================
// RESPOND TO CONNECTION REQUEST (Accept / Reject / Block)
// =============================================================================

public record RespondConnectionRequestCommand(
    Guid ConnectionId,
    UserConnectionRespondDTO Dto,
    Guid ActorId) : IRequest<UserConnectionResponseDTO>;

public class RespondConnectionRequestCommandHandler
    : IRequestHandler<RespondConnectionRequestCommand, UserConnectionResponseDTO>
{
    private readonly IUserConnectionRepository _repo;
    private readonly IUnitOfWork _uow;

    public RespondConnectionRequestCommandHandler(IUserConnectionRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<UserConnectionResponseDTO> Handle(
        RespondConnectionRequestCommand request, CancellationToken ct)
    {
        var connection = await _repo.GetByIdAsync(request.ConnectionId, ct)
            ?? throw new NotFoundException(nameof(UserConnection), request.ConnectionId);

        // Only the addressee can respond
        if (connection.AddresseeId != request.ActorId)
            throw new ForbiddenException("Only the request recipient can respond to a connection request.");

        if (connection.Status != "Pending")
            throw new Bio.Domain.Exceptions.ValidationException($"Connection is already in '{connection.Status}' status.");

        switch (request.Dto.Action)
        {
            case "Accept": connection.Accept(); break;
            case "Reject": connection.Reject(); break;
            case "Block": connection.Block(); break;
            default:
                throw new Bio.Domain.Exceptions.ValidationException("Action must be 'Accept', 'Reject', or 'Block'.");
        }

        await _uow.SaveChangesAsync(ct);
        return ConnectionMapper.ToResponse(connection);
    }
}

// =============================================================================
// DELETE / CANCEL CONNECTION REQUEST
// =============================================================================

public record DeleteConnectionCommand(
    Guid ConnectionId,
    Guid ActorId,
    string ActorRole) : IRequest<Unit>;

public class DeleteConnectionCommandHandler
    : IRequestHandler<DeleteConnectionCommand, Unit>
{
    private readonly IUserConnectionRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteConnectionCommandHandler(IUserConnectionRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeleteConnectionCommand request, CancellationToken ct)
    {
        var connection = await _repo.GetByIdAsync(request.ConnectionId, ct)
            ?? throw new NotFoundException(nameof(UserConnection), request.ConnectionId);

        // Requester can cancel a pending request; either party or admin can delete accepted
        bool isParty = connection.RequesterId == request.ActorId
                    || connection.AddresseeId == request.ActorId;

        if (!isParty && request.ActorRole != RoleNames.Admin)
            throw new ForbiddenException("You can only manage your own connections.");

        await _repo.DeleteAsync(connection, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

public class SendConnectionRequestCommandValidator : AbstractValidator<SendConnectionRequestCommand>
{
    public SendConnectionRequestCommandValidator()
    {
        RuleFor(x => x.Dto.AddresseeId)
            .NotEmpty().WithMessage("AddresseeId is required.");

        RuleFor(x => x.Dto.Message)
            .MaximumLength(500).WithMessage("Message must not exceed 500 characters.")
            .When(x => x.Dto.Message != null);
    }
}
