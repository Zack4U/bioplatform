using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IAddressRepository
{
    Task<IReadOnlyList<Address>> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Address?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(Address address, CancellationToken ct = default);
    Task DeleteAsync(Address address, CancellationToken ct = default);
    Task ClearDefaultsForUserAsync(Guid userId, string addressType, CancellationToken ct = default);
}
