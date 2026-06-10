using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for community post comments.
/// Bounded context: Community (SQL Server).
/// </summary>
public interface ICommunityPostCommentRepository
{
    Task<CommunityPostComment?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<CommunityPostComment> Items, int TotalCount)> GetByPostIdAsync(
        Guid postId, int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(CommunityPostComment comment, CancellationToken ct = default);
    Task DeleteAsync(CommunityPostComment comment, CancellationToken ct = default);
}
