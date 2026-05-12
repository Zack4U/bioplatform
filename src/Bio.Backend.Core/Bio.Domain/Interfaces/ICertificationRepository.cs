using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface ICertificationRepository
{
    Task<IReadOnlyList<Certification>> GetByProductIdAsync(Guid productId, CancellationToken ct = default);
    Task<Certification?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Certification certification, CancellationToken ct = default);
    Task DeleteAsync(Certification certification, CancellationToken ct = default);
}
