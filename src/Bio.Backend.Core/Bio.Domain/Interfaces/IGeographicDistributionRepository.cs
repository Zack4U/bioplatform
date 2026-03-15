using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repositorio para distribuciones geográficas de especies (PostgreSQL).
/// </summary>
public interface IGeographicDistributionRepository
{
    Task<GeographicDistribution?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<GeographicDistribution>> GetBySpeciesIdAsync(Guid speciesId, CancellationToken cancellationToken = default);
    Task<GeographicDistribution> AddAsync(GeographicDistribution distribution, CancellationToken cancellationToken = default);
    Task DeleteAsync(GeographicDistribution distribution, CancellationToken cancellationToken = default);
}
