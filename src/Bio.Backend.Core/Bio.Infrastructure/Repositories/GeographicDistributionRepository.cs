using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

public class GeographicDistributionRepository : IGeographicDistributionRepository
{
    private readonly ScientificDbContext _context;

    public GeographicDistributionRepository(ScientificDbContext context)
    {
        _context = context;
    }

    public async Task<GeographicDistribution?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.GeographicDistributions.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<IEnumerable<GeographicDistribution>> GetBySpeciesIdAsync(Guid speciesId, CancellationToken cancellationToken = default)
    {
        return await _context.GeographicDistributions
            .Where(g => g.SpeciesId == speciesId)
            .ToListAsync(cancellationToken);
    }

    public async Task<GeographicDistribution> AddAsync(GeographicDistribution distribution, CancellationToken cancellationToken = default)
    {
        await _context.GeographicDistributions.AddAsync(distribution, cancellationToken);
        return distribution;
    }

    public Task DeleteAsync(GeographicDistribution distribution, CancellationToken cancellationToken = default)
    {
        _context.GeographicDistributions.Remove(distribution);
        return Task.CompletedTask;
    }
}
