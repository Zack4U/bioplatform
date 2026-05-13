using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Read-only repository for ActivityLogs audit trail (SQL Server).
/// Logs are written by infrastructure; never mutated through this interface.
/// </summary>
public interface IActivityLogRepository
{
    Task<ActivityLog?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task<(IReadOnlyList<ActivityLog> Items, int TotalCount)> GetPagedAsync(
        Guid? actorUserId = null,
        string? actorType = null,
        string? actionType = null,
        string? impactLevel = null,
        string? targetType = null,
        Guid? targetId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        int page = 1,
        int pageSize = 25,
        CancellationToken ct = default);
}
