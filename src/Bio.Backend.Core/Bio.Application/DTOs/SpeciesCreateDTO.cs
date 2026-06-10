namespace Bio.Application.DTOs;

/// <summary>
/// DTO para crear una especie.
/// Los datos de enriquecimiento (potencial económico y usos tradicionales)
/// se cargan vía POST /api/species/import-economic-potential y /import-traditional-uses.
/// </summary>
public record SpeciesCreateDTO
{
    public int? TaxonomyId { get; init; }
    public string Slug { get; init; } = "";
    public string? ThumbnailUrl { get; init; }
    public string ScientificName { get; init; } = "";
    public string? CommonName { get; init; }
    public string? Description { get; init; }
    public string? EcologicalInfo { get; init; }
    public string? ConservationStatus { get; init; }
    public string? AltitudeRange { get; init; }
    public bool LegalStatus { get; init; }
    public bool IsSensitive { get; init; }
}
