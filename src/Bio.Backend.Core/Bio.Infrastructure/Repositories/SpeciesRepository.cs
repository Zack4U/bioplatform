using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class SpeciesRepository : ISpeciesRepository
{
    private readonly ScientificDbContext _context;

    public SpeciesRepository(ScientificDbContext context)
    {
        _context = context;
    }

    public async Task<Species?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Species
            .Include(s => s.Taxonomy)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Species?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        return await _context.Species
            .Include(s => s.Taxonomy)
            .FirstOrDefaultAsync(s => s.Slug == slug, cancellationToken);
    }

    public async Task<Species?> GetByScientificNameAsync(string scientificName, CancellationToken cancellationToken = default)
    {
        return await _context.Species
            .Include(s => s.Taxonomy)
            .FirstOrDefaultAsync(s => s.ScientificName == scientificName, cancellationToken);
    }

    public async Task<IEnumerable<Species>> GetAllAsync(int? skip = null, int? take = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Species.Include(s => s.Taxonomy).OrderBy(s => s.ScientificName).AsQueryable();
        if (skip.HasValue) query = query.Skip(skip.Value);
        if (take.HasValue) query = query.Take(take.Value);
        return await query.ToListAsync(cancellationToken);
    }

    public async Task<Species> AddAsync(Species species, CancellationToken cancellationToken = default)
    {
        await _context.Species.AddAsync(species, cancellationToken);
        return species;
    }

    public Task DeleteAsync(Species species, CancellationToken cancellationToken = default)
    {
        _context.Species.Remove(species);
        return Task.CompletedTask;
    }

    public async Task<bool> ExistsByScientificNameExcludingIdAsync(string scientificName, Guid excludeId, CancellationToken cancellationToken = default)
    {
        return await _context.Species.AnyAsync(s => s.ScientificName == scientificName && s.Id != excludeId, cancellationToken);
    }

    public async Task<bool> ExistsBySlugExcludingIdAsync(string slug, Guid excludeId, CancellationToken cancellationToken = default)
    {
        return await _context.Species.AnyAsync(s => s.Slug == slug && s.Id != excludeId, cancellationToken);
    }
}
