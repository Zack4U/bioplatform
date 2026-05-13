using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Repositorio para la entidad SpeciesImage (imágenes del catálogo PostgreSQL).
/// </summary>
public interface ISpeciesImageRepository
{
    /// <summary>
    /// Obtiene las imágenes de una especie con paginación y filtro opcional de validación por experto.
    /// </summary>
    Task<(IReadOnlyList<SpeciesImage> Items, int TotalCount)> GetBySpeciesIdAsync(
        Guid speciesId,
        bool onlyValidatedByExpert = true,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Persists a new <see cref="SpeciesImage"/> observation record to the database.
    /// </summary>
    /// <param name="image">The image entity to persist.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The persisted entity with any DB-generated values populated.</returns>
    Task<SpeciesImage> AddAsync(SpeciesImage image, CancellationToken cancellationToken = default);

    /// <summary>Returns all species images for dashboard aggregation (Researcher Dashboard).</summary>
    Task<IReadOnlyList<SpeciesImage>> GetAllAsync(CancellationToken cancellationToken = default);
}
