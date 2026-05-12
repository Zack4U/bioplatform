using Bio.Application.DTOs;
using Bio.Application.Features.Community.Connections.Commands;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Community.Connections.Queries;

// =============================================================================
// GET MY CONNECTIONS
// =============================================================================

public record GetMyConnectionsQuery(
    Guid UserId,
    string? Status,
    int Page,
    int PageSize) : IRequest<PaginatedResult<UserConnectionResponseDTO>>;

public class GetMyConnectionsQueryHandler
    : IRequestHandler<GetMyConnectionsQuery, PaginatedResult<UserConnectionResponseDTO>>
{
    private readonly IUserConnectionRepository _repo;

    public GetMyConnectionsQueryHandler(IUserConnectionRepository repo) => _repo = repo;

    public async Task<PaginatedResult<UserConnectionResponseDTO>> Handle(
        GetMyConnectionsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetMyConnectionsAsync(
            request.UserId, request.Status, request.Page, request.PageSize, ct);

        var dtos = items.Select(ConnectionMapper.ToResponse).ToList();
        return PaginatedResult<UserConnectionResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}

// =============================================================================
// GET PENDING REQUESTS (received by the current user)
// =============================================================================

public record GetPendingConnectionRequestsQuery(
    Guid AddresseeId,
    int Page,
    int PageSize) : IRequest<PaginatedResult<UserConnectionResponseDTO>>;

public class GetPendingConnectionRequestsQueryHandler
    : IRequestHandler<GetPendingConnectionRequestsQuery, PaginatedResult<UserConnectionResponseDTO>>
{
    private readonly IUserConnectionRepository _repo;

    public GetPendingConnectionRequestsQueryHandler(IUserConnectionRepository repo) => _repo = repo;

    public async Task<PaginatedResult<UserConnectionResponseDTO>> Handle(
        GetPendingConnectionRequestsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetPendingRequestsAsync(
            request.AddresseeId, request.Page, request.PageSize, ct);

        var dtos = items.Select(ConnectionMapper.ToResponse).ToList();
        return PaginatedResult<UserConnectionResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}
