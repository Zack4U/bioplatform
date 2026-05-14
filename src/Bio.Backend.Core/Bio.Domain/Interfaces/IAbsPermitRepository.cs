using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IAbsPermitRepository
{
    Task<AbsPermit?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<AbsPermit>> GetByEntrepreneurIdAsync(Guid entrepreneurId, CancellationToken ct = default);
    Task<AbsPermit?> GetActiveByEntrepreneurAndSpeciesAsync(Guid entrepreneurId, Guid speciesId, CancellationToken ct = default);
    Task<(IReadOnlyList<AbsPermit> Items, int TotalCount)> GetAllPagedAsync(
        Guid? entrepreneurId, string? status, int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(AbsPermit permit, CancellationToken ct = default);
}
