using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for community forum posts.
/// Bounded context: Community (SQL Server).
/// </summary>
public interface ICommunityPostRepository
{
    Task<CommunityPost?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<CommunityPost?> GetByIdWithCommentsAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<CommunityPost> Items, int TotalCount)> GetPagedAsync(
        string? category, string? status, int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(CommunityPost post, CancellationToken ct = default);
    Task DeleteAsync(CommunityPost post, CancellationToken ct = default);

    /// <summary>Returns posts by a specific author with their comments loaded — used by Social Dashboard.</summary>
    Task<(IReadOnlyList<CommunityPost> Items, int TotalCount)> GetByAuthorIdPagedAsync(
        Guid authorUserId, int page, int pageSize, CancellationToken ct = default);
}
