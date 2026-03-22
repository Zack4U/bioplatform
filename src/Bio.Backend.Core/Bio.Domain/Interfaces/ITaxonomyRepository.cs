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
    Task AddRangeAsync(IEnumerable<Taxonomy> taxonomies, CancellationToken cancellationToken = default);
    Task DeleteAsync(Taxonomy taxonomy, CancellationToken cancellationToken = default);
    /// <summary>
    /// Looks up an existing taxonomy by all six classification fields.
    /// Used during bulk import to avoid duplicate taxonomy entries.
    /// </summary>
    Task<Taxonomy?> GetByFieldsAsync(string? kingdom, string? phylum, string? className, string? orderName, string? family, string? genus, CancellationToken cancellationToken = default);

}
