using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly BioDbContext _ctx;
    public NotificationRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<Notification?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.Notifications.FirstOrDefaultAsync(n => n.Id == id, ct);

    public async Task<(IReadOnlyList<Notification> Items, int TotalCount)> GetByUserIdPagedAsync(
        Guid userId, bool? isRead, string? notificationType, int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.Notifications.Where(n => n.UserId == userId).AsQueryable();
        if (isRead.HasValue) q = q.Where(n => n.IsRead == isRead.Value);
        if (!string.IsNullOrWhiteSpace(notificationType))
            q = q.Where(n => n.NotificationType == notificationType);
        q = q.OrderByDescending(n => n.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken ct)
        => await _ctx.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead, ct);

    public async Task AddAsync(Notification notification, CancellationToken ct)
        => await _ctx.Notifications.AddAsync(notification, ct);

    public async Task DeleteAsync(Notification notification, CancellationToken ct)
    { _ctx.Notifications.Remove(notification); await Task.CompletedTask; }

    public async Task MarkAllReadAsync(Guid userId, CancellationToken ct)
    {
        var unread = await _ctx.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var n in unread) n.MarkAsRead();
    }
}

public class ActivityLogRepository : IActivityLogRepository
{
    private readonly BioDbContext _ctx;
    public ActivityLogRepository(BioDbContext ctx) => _ctx = ctx;

    public async Task<ActivityLog?> GetByIdAsync(Guid id, CancellationToken ct)
        => await _ctx.ActivityLogs.FirstOrDefaultAsync(l => l.Id == id, ct);

    public async Task<(IReadOnlyList<ActivityLog> Items, int TotalCount)> GetPagedAsync(
        Guid? actorUserId, string? actorType, string? actionType, string? impactLevel,
        string? targetType, Guid? targetId, DateTime? fromDate, DateTime? toDate,
        int page, int pageSize, CancellationToken ct)
    {
        var q = _ctx.ActivityLogs.AsQueryable();
        if (actorUserId.HasValue) q = q.Where(l => l.ActorUserId == actorUserId.Value);
        if (!string.IsNullOrWhiteSpace(actorType)) q = q.Where(l => l.ActorType == actorType);
        if (!string.IsNullOrWhiteSpace(actionType)) q = q.Where(l => l.ActionType == actionType);
        if (!string.IsNullOrWhiteSpace(impactLevel)) q = q.Where(l => l.ImpactLevel == impactLevel);
        if (!string.IsNullOrWhiteSpace(targetType)) q = q.Where(l => l.TargetType == targetType);
        if (targetId.HasValue) q = q.Where(l => l.TargetId == targetId.Value);
        if (fromDate.HasValue) q = q.Where(l => l.CreatedAt >= fromDate.Value);
        if (toDate.HasValue) q = q.Where(l => l.CreatedAt <= toDate.Value);
        q = q.OrderByDescending(l => l.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }
}
