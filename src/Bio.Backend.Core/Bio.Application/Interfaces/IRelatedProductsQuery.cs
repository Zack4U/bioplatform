using Bio.Application.DTOs;

namespace Bio.Application.Interfaces;

/// <summary>
/// Interfaz para consultar productos relacionados a una especie.
/// Cruza la frontera SQL Server ↔ PostgreSQL usando el BaseSpeciesId (UUID lógico).
/// </summary>
public interface IRelatedProductsQuery
{
    /// <summary>
    /// Obtiene los productos activos relacionados a una especie por su Id.
    /// </summary>
    Task<IReadOnlyList<RelatedProductDTO>> GetBySpeciesIdAsync(
        Guid speciesId,
        CancellationToken cancellationToken = default);
}
