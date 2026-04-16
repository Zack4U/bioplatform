namespace Bio.Application.DTOs;

/// <summary>
/// DTO ligero de especie para listados y grids (evita over-fetching).
/// Incluye datos de taxonomía aplanados.
/// </summary>
public record SpeciesListItemDTO(
    Guid Id,
    string Slug,
    string ScientificName,
    string? CommonName,
    string? ThumbnailUrl,
    string? ConservationStatus,
    bool IsSensitive,
    string? Kingdom,
    string? Family,
    DateTime CreatedAt
);
