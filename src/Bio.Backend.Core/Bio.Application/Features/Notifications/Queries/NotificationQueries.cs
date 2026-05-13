using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Notifications.Queries;

// =============================================================================
// GET MY NOTIFICATIONS (paginated)
// =============================================================================

public record GetMyNotificationsQuery(
    Guid UserId,
    bool? IsRead = null,
    string? NotificationType = null,
    int Page = 1,
    int PageSize = 20) : IRequest<PaginatedResult<NotificationResponseDTO>>;

public class GetMyNotificationsQueryHandler
    : IRequestHandler<GetMyNotificationsQuery, PaginatedResult<NotificationResponseDTO>>
{
    private readonly INotificationRepository _repo;
    public GetMyNotificationsQueryHandler(INotificationRepository repo) => _repo = repo;

    public async Task<PaginatedResult<NotificationResponseDTO>> Handle(
        GetMyNotificationsQuery request, CancellationToken ct)
    {
        var (items, total) = await _repo.GetByUserIdPagedAsync(
            request.UserId, request.IsRead, request.NotificationType,
            request.Page, request.PageSize, ct);
        var dtos = items.Select(MapToResponse).ToList();
        return PaginatedResult<NotificationResponseDTO>.Create(dtos, total, request.Page, request.PageSize);
    }

    internal static NotificationResponseDTO MapToResponse(Notification n) => new(
        n.Id, n.Title, n.Message, n.NotificationType, n.ReferenceType,
        n.ReferenceId, n.IsRead, n.CreatedAt, n.ReadAt);
}

// =============================================================================
// GET UNREAD COUNT
// =============================================================================

public record GetUnreadNotificationCountQuery(Guid UserId) : IRequest<UnreadNotificationCountDTO>;

public class GetUnreadNotificationCountQueryHandler
    : IRequestHandler<GetUnreadNotificationCountQuery, UnreadNotificationCountDTO>
{
    private readonly INotificationRepository _repo;
    public GetUnreadNotificationCountQueryHandler(INotificationRepository repo) => _repo = repo;

    public async Task<UnreadNotificationCountDTO> Handle(
        GetUnreadNotificationCountQuery request, CancellationToken ct)
    {
        var count = await _repo.GetUnreadCountAsync(request.UserId, ct);
        return new UnreadNotificationCountDTO(count);
    }
}
