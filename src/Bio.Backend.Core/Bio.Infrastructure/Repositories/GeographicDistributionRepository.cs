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

    public async Task<bool> ExistsBySpeciesAndCoordinatesAsync(
        Guid speciesId, double latitude, double longitude, CancellationToken cancellationToken = default)
    {
        // Use a small tolerance (6 decimal places ≈ 0.1m precision) to detect near-duplicates
        const double tolerance = 0.000001;
        return await _context.GeographicDistributions.AnyAsync(g =>
            g.SpeciesId == speciesId &&
            Math.Abs(g.Latitude - latitude) < tolerance &&
            Math.Abs(g.Longitude - longitude) < tolerance,
            cancellationToken);
    }
}
