using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for user networking connections and friend requests.
/// Bounded context: Networking (SQL Server).
/// </summary>
public interface IUserConnectionRepository
{
    Task<UserConnection?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<UserConnection?> GetExistingConnectionAsync(
        Guid requesterId, Guid addresseeId, CancellationToken ct = default);
    Task<(IReadOnlyList<UserConnection> Items, int TotalCount)> GetMyConnectionsAsync(
        Guid userId, string? status, int page, int pageSize, CancellationToken ct = default);
    Task<(IReadOnlyList<UserConnection> Items, int TotalCount)> GetPendingRequestsAsync(
        Guid addresseeId, int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(UserConnection connection, CancellationToken ct = default);
    Task DeleteAsync(UserConnection connection, CancellationToken ct = default);

    /// <summary>Returns all connections (as requester or addressee) for a user — used by Social Dashboard.</summary>
    Task<IReadOnlyList<UserConnection>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
}
