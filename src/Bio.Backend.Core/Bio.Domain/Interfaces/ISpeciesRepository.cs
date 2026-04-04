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

    /// <summary>
    /// Obtiene una especie con todas sus distribuciones geográficas incluidas (eager load).
    /// </summary>
    Task<Species?> GetByIdWithDistributionsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene una especie por slug con distribuciones geográficas incluidas (eager load).
    /// </summary>
    Task<Species?> GetBySlugWithDistributionsAsync(string slug, CancellationToken cancellationToken = default);

    /// <summary>
    /// Consulta paginada con filtros, búsqueda y ordenamiento.
    /// Retorna (items, totalCount) para que la capa de aplicación construya PaginatedResult.
    /// </summary>
    Task<(IReadOnlyList<Species> Items, int TotalCount)> GetFilteredAsync(
        string? query = null,
        string? kingdom = null,
        string? phylum = null,
        string? family = null,
        string? genus = null,
        bool? isSensitive = null,
        string? conservationStatus = null,
        string sortBy = "scientificName",
        string sortOrder = "asc",
        int page = 1,
        int pageSize = 12,
        CancellationToken cancellationToken = default);

    Task<Species> AddAsync(Species species, CancellationToken cancellationToken = default);
    Task AddRangeAsync(IEnumerable<Species> speciesList, CancellationToken cancellationToken = default);
    Task DeleteAsync(Species species, CancellationToken cancellationToken = default);
    /// <summary>
    /// Comprueba si existe otra especie (excluyendo id) con el mismo scientific_name o slug.
    /// </summary>
    Task<bool> ExistsByScientificNameExcludingIdAsync(string scientificName, Guid excludeId, CancellationToken cancellationToken = default);
    Task<bool> ExistsBySlugExcludingIdAsync(string slug, Guid excludeId, CancellationToken cancellationToken = default);
    /// <summary>
    /// Returns the set of scientific names (from the provided list) that already exist in the database.
    /// Used for bulk duplicate detection during CSV import.
    /// </summary>
    Task<HashSet<string>> ExistingScientificNamesAsync(IEnumerable<string> names, CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtiene los valores distintos disponibles para los filtros del catálogo.
    /// Retorna kingdoms, phylums, families, genera, conservation statuses y total count.
    /// </summary>
    Task<(
        IReadOnlyList<string> Kingdoms,
        IReadOnlyList<string> Phylums,
        IReadOnlyList<string> Families,
        IReadOnlyList<string> Genera,
        IReadOnlyList<string> ConservationStatuses,
        int TotalCount
    )> GetFilterMetaAsync(CancellationToken cancellationToken = default);
}
