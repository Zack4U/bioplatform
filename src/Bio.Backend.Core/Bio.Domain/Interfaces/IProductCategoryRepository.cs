using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

public interface IProductCategoryRepository
{
    Task<ProductCategory?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ProductCategory>> ListAsync(CancellationToken cancellationToken = default);
    Task AddAsync(ProductCategory category, CancellationToken cancellationToken = default);
    void Update(ProductCategory category);
    void Delete(ProductCategory category);
}
