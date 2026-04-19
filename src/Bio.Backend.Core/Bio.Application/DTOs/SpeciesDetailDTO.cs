namespace Bio.Application.DTOs;

/// <summary>
/// DTO de respuesta completo para el detalle de una especie.
/// Incluye taxonomía, distribuciones (con protección), potenciales económicos,
/// usos tradicionales y productos relacionados.
/// </summary>
public record SpeciesDetailDTO(
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
    DateTime? UpdatedAt,
    IReadOnlyList<GeographicDistributionDTO> Distributions,
    IReadOnlyList<SpeciesEconomicPotentialDTO> EconomicPotentials,
    IReadOnlyList<SpeciesTraditionalUseDTO> TraditionalUses,
    IReadOnlyList<RelatedProductDTO> RelatedProducts
);
