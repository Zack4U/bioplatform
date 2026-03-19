using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repositorio para la entidad Species (catálogo científico PostgreSQL).
/// </summary>
public interface ISpeciesRepository
{
    Task<Species?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Species?> GetBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<Species?> GetByScientificNameAsync(string scientificName, CancellationToken cancellationToken = default);
    Task<IEnumerable<Species>> GetAllAsync(int? skip = null, int? take = null, CancellationToken cancellationToken = default);
    Task<Species> AddAsync(Species species, CancellationToken cancellationToken = default);
    Task DeleteAsync(Species species, CancellationToken cancellationToken = default);
    /// <summary>
    /// Comprueba si existe otra especie (excluyendo id) con el mismo scientific_name o slug.
    /// </summary>
    Task<bool> ExistsByScientificNameExcludingIdAsync(string scientificName, Guid excludeId, CancellationToken cancellationToken = default);
    Task<bool> ExistsBySlugExcludingIdAsync(string slug, Guid excludeId, CancellationToken cancellationToken = default);
}
