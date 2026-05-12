using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repository for community reactions (like/dislike on posts and comments).
/// Bounded context: Community (SQL Server).
/// Unique index enforced: (UserId, TargetType, TargetId).
/// </summary>
public interface ICommunityReactionRepository
{
    Task<CommunityReaction?> GetByUserAndTargetAsync(
        Guid userId, string targetType, Guid targetId, CancellationToken ct = default);
    Task<string?> GetReactionTypeByUserAndTargetAsync(
        Guid userId, string targetType, Guid targetId, CancellationToken ct = default);
    Task AddAsync(CommunityReaction reaction, CancellationToken ct = default);
    Task DeleteAsync(CommunityReaction reaction, CancellationToken ct = default);
}
