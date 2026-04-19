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
}
