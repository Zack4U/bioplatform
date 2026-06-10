using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Notifications.Commands;

// =============================================================================
// MARK AS READ
// =============================================================================

public record MarkNotificationAsReadCommand(Guid NotificationId, Guid UserId) : IRequest<NotificationResponseDTO>;

public class MarkNotificationAsReadCommandHandler
    : IRequestHandler<MarkNotificationAsReadCommand, NotificationResponseDTO>
{
    private readonly INotificationRepository _repo;
    private readonly IUnitOfWork _uow;

    public MarkNotificationAsReadCommandHandler(INotificationRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<NotificationResponseDTO> Handle(MarkNotificationAsReadCommand request, CancellationToken ct)
    {
        var notification = await _repo.GetByIdAsync(request.NotificationId, ct)
            ?? throw new NotFoundException(nameof(Notification), request.NotificationId);

        if (notification.UserId != request.UserId)
            throw new ForbiddenException("You can only mark your own notifications as read.");

        notification.MarkAsRead();
        await _uow.SaveChangesAsync(ct);
        return MapToResponse(notification);
    }

    internal static NotificationResponseDTO MapToResponse(Notification n) => new(
        n.Id, n.Title, n.Message, n.NotificationType, n.ReferenceType,
        n.ReferenceId, n.IsRead, n.CreatedAt, n.ReadAt);
}

// =============================================================================
// MARK ALL AS READ
// =============================================================================

public record MarkAllNotificationsReadCommand(Guid UserId) : IRequest<Unit>;

public class MarkAllNotificationsReadCommandHandler
    : IRequestHandler<MarkAllNotificationsReadCommand, Unit>
{
    private readonly INotificationRepository _repo;
    private readonly IUnitOfWork _uow;

    public MarkAllNotificationsReadCommandHandler(INotificationRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(MarkAllNotificationsReadCommand request, CancellationToken ct)
    {
        await _repo.MarkAllReadAsync(request.UserId, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}

// =============================================================================
// DELETE
// =============================================================================

public record DeleteNotificationCommand(Guid NotificationId, Guid UserId, string UserRole) : IRequest<Unit>;

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand, Unit>
{
    private readonly INotificationRepository _repo;
    private readonly IUnitOfWork _uow;

    public DeleteNotificationCommandHandler(INotificationRepository repo, IUnitOfWork uow)
    { _repo = repo; _uow = uow; }

    public async Task<Unit> Handle(DeleteNotificationCommand request, CancellationToken ct)
    {
        var notification = await _repo.GetByIdAsync(request.NotificationId, ct)
            ?? throw new NotFoundException(nameof(Notification), request.NotificationId);

        if (request.UserRole != "ADMIN" && notification.UserId != request.UserId)
            throw new ForbiddenException("You can only delete your own notifications.");

        await _repo.DeleteAsync(notification, ct);
        await _uow.SaveChangesAsync(ct);
        return Unit.Value;
    }
}
