using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface ICertificationRepository
{
    Task<IReadOnlyList<Certification>> GetByProductIdAsync(Guid productId, CancellationToken ct = default);
    Task<Certification?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Certification certification, CancellationToken ct = default);
    Task DeleteAsync(Certification certification, CancellationToken ct = default);

    /// <summary>
    /// Paged moderation list — includes Product + Entrepreneur. Admin sees all;
    /// an entrepreneur sees only certifications on their own products.
    /// </summary>
    Task<(IReadOnlyList<Certification> Items, int TotalCount)> GetManagedAsync(
        string? status = null, Guid? entrepreneurId = null,
        int page = 1, int pageSize = 12, CancellationToken ct = default);
}
