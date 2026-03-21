namespace Bio.Application.DTOs;

/// <summary>
/// DTO de respuesta para Species (incluye taxonomía si existe).
/// </summary>
public record SpeciesResponseDTO(
    Guid Id,
    int? TaxonomyId,
    TaxonomyResponseDTO? Taxonomy,
    string Slug,
    string? ThumbnailUrl,
    string ScientificName,
    string? CommonName,
    string? Description,
    string? EcologicalInfo,
    string? TraditionalUses,
    string? EconomicPotential,
    string? ConservationStatus,
    bool IsSensitive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
