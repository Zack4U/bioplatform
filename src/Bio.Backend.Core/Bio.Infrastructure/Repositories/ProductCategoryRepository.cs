using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class ProductCategoryRepository : IProductCategoryRepository
{
    private readonly ScientificDbContext _context;

    public ProductCategoryRepository(ScientificDbContext context)
    {
        _context = context;
    }

    public async Task<ProductCategory?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.ProductCategories
            .FirstOrDefaultAsync(pc => pc.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<ProductCategory>> ListAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ProductCategories
            .OrderBy(pc => pc.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(ProductCategory category, CancellationToken cancellationToken = default)
    {
        await _context.ProductCategories.AddAsync(category, cancellationToken);
    }

    public void Update(ProductCategory category)
    {
        _context.ProductCategories.Update(category);
    }

    public void Delete(ProductCategory category)
    {
        _context.ProductCategories.Remove(category);
    }
}
