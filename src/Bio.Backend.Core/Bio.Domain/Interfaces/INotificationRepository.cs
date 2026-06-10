using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for in-app notifications (SQL Server).
/// </summary>
public interface INotificationRepository
{
    Task<Notification?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<(IReadOnlyList<Notification> Items, int TotalCount)> GetByUserIdPagedAsync(
        Guid userId,
        bool? isRead = null,
        string? notificationType = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default);

    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct = default);

    Task AddAsync(Notification notification, CancellationToken ct = default);
    Task DeleteAsync(Notification notification, CancellationToken ct = default);

    /// <summary>Marks all unread notifications for a user as read in bulk.</summary>
    Task MarkAllReadAsync(Guid userId, CancellationToken ct = default);
}
