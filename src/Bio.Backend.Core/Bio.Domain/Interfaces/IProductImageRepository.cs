using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IProductImageRepository
{
    Task<IReadOnlyList<ProductImage>> GetByProductIdAsync(Guid productId, CancellationToken ct = default);
    Task<ProductImage?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(ProductImage image, CancellationToken ct = default);
    Task DeleteAsync(ProductImage image, CancellationToken ct = default);
    Task ClearPrimaryForProductAsync(Guid productId, CancellationToken ct = default);
}
