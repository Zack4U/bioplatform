using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IFavoriteRepository
{
    Task<(IReadOnlyList<Favorite> Items, int TotalCount)> GetByUserIdAsync(
        Guid userId, string? targetType = null, int page = 1, int pageSize = 10, CancellationToken ct = default);
    Task<Favorite?> GetByIdAsync(Guid id, CancellationToken ct = default);
    /// <summary>Finds a specific favorite record by user + target (for toggle logic).</summary>
    Task<Favorite?> GetByUserAndTargetAsync(Guid userId, string targetType, Guid targetId, CancellationToken ct = default);
    Task AddAsync(Favorite favorite, CancellationToken ct = default);
    Task DeleteAsync(Favorite favorite, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid userId, string targetType, Guid targetId, CancellationToken ct = default);
}
