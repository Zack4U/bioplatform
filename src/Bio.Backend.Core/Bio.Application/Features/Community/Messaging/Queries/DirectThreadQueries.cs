using Bio.Application.DTOs;
using Bio.Application.Features.Community.Messaging.Commands;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Community.Messaging.Queries;

// =============================================================================
// GET MY THREADS (paginated)
// =============================================================================

public record GetMyThreadsQuery(
    Guid UserId, int Page, int PageSize) : IRequest<PaginatedResult<DirectThreadSummaryDTO>>;

public class GetMyThreadsQueryHandler
    : IRequestHandler<GetMyThreadsQuery, PaginatedResult<DirectThreadSummaryDTO>>
{
    private readonly IDirectThreadRepository _repo;

    public GetMyThreadsQueryHandler(IDirectThreadRepository repo) => _repo = repo;

    public async Task<PaginatedResult<DirectThreadSummaryDTO>> Handle(
        GetMyThreadsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetMyThreadsAsync(
            request.UserId, request.Page, request.PageSize, ct);

        var dtos = new List<DirectThreadSummaryDTO>();
        foreach (var thread in items)
        {
            var unread = await _repo.GetUnreadCountAsync(request.UserId, ct);
            dtos.Add(MessagingMapper.ToThreadSummary(thread, unread));
        }

        return PaginatedResult<DirectThreadSummaryDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}

// =============================================================================
// GET THREAD MESSAGES (paginated, newest first)
// =============================================================================

public record GetThreadMessagesQuery(
    Guid ThreadId,
    Guid ActorId,
    int Page,
    int PageSize) : IRequest<PaginatedResult<DirectMessageResponseDTO>>;

public class GetThreadMessagesQueryHandler
    : IRequestHandler<GetThreadMessagesQuery, PaginatedResult<DirectMessageResponseDTO>>
{
    private readonly IDirectThreadRepository _repo;

    public GetThreadMessagesQueryHandler(IDirectThreadRepository repo) => _repo = repo;

    public async Task<PaginatedResult<DirectMessageResponseDTO>> Handle(
        GetThreadMessagesQuery request, CancellationToken ct)
    {
        var isParticipant = await _repo.IsParticipantAsync(request.ThreadId, request.ActorId, ct);
        if (!isParticipant)
            throw new ForbiddenException("You are not a participant in this thread.");

        var (items, total) = await _repo.GetMessagesByThreadAsync(
            request.ThreadId, request.Page, request.PageSize, ct);

        var dtos = items.Select(m =>
        {
            var isRead = m.Reads.Any(r => r.UserId == request.ActorId);
            return MessagingMapper.ToMessageResponse(m, isRead);
        }).ToList();

        return PaginatedResult<DirectMessageResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }
}

// =============================================================================
// GET UNREAD COUNT (across all threads)
// =============================================================================

public record GetUnreadCountQuery(Guid UserId) : IRequest<UnreadCountResponseDTO>;

public class GetUnreadCountQueryHandler
    : IRequestHandler<GetUnreadCountQuery, UnreadCountResponseDTO>
{
    private readonly IDirectThreadRepository _repo;

    public GetUnreadCountQueryHandler(IDirectThreadRepository repo) => _repo = repo;

    public async Task<UnreadCountResponseDTO> Handle(
        GetUnreadCountQuery request, CancellationToken ct)
    {
        var count = await _repo.GetUnreadCountAsync(request.UserId, ct);
        return new UnreadCountResponseDTO(count);
    }
}
