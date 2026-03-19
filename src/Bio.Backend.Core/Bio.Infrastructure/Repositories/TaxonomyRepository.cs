using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class TaxonomyRepository : ITaxonomyRepository
{
    private readonly ScientificDbContext _context;

    public TaxonomyRepository(ScientificDbContext context)
    {
        _context = context;
    }

    public async Task<Taxonomy?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Taxonomies.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IEnumerable<Taxonomy>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Taxonomies.OrderBy(t => t.Id).ToListAsync(cancellationToken);
    }

    public async Task<Taxonomy> AddAsync(Taxonomy taxonomy, CancellationToken cancellationToken = default)
    {
        await _context.Taxonomies.AddAsync(taxonomy, cancellationToken);
        return taxonomy;
    }

    public Task DeleteAsync(Taxonomy taxonomy, CancellationToken cancellationToken = default)
    {
        _context.Taxonomies.Remove(taxonomy);
        return Task.CompletedTask;
    }
}
