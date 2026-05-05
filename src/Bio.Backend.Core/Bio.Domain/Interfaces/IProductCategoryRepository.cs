using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IProductCategoryRepository
{
    Task<IReadOnlyList<ProductCategory>> GetAllAsync(CancellationToken ct = default);
    Task<ProductCategory?> GetByIdAsync(int id, CancellationToken ct = default);
    Task AddAsync(ProductCategory category, CancellationToken ct = default);
    Task DeleteAsync(ProductCategory category, CancellationToken ct = default);
    Task<bool> ExistsByNameAsync(string name, CancellationToken ct = default);
    Task<bool> ExistsByNameExcludingIdAsync(string name, int excludeId, CancellationToken ct = default);
}
