using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repositorio para la entidad Taxonomy (catálogo científico PostgreSQL).
/// </summary>
public interface ITaxonomyRepository
{
    Task<Taxonomy?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Taxonomy>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Taxonomy> AddAsync(Taxonomy taxonomy, CancellationToken cancellationToken = default);
    Task DeleteAsync(Taxonomy taxonomy, CancellationToken cancellationToken = default);
}
