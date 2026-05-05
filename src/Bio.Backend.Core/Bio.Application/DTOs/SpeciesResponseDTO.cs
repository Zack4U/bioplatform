namespace Bio.Application.DTOs;

/// <summary>
/// DTO de respuesta resumida para Species (incluye taxonomía). Sin datos de enriquecimiento.
/// Para el detalle completo con potenciales y usos, usa SpeciesDetailDTO.
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
    string? ConservationStatus,
    string? AltitudeRange,
    bool LegalStatus,
    bool IsSensitive,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
