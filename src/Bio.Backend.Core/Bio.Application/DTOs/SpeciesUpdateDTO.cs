namespace Bio.Application.DTOs;

/// <summary>
/// DTO para actualizar una especie (campos opcionales).
/// Los datos de enriquecimiento (potencial económico y usos tradicionales)
/// se gestionan vía POST /api/species/import-economic-potential y /import-traditional-uses.
/// </summary>
public record SpeciesUpdateDTO
{
    public int? TaxonomyId { get; init; }
    public string? Slug { get; init; }
    public string? ThumbnailUrl { get; init; }
    public string? CommonName { get; init; }
    public string? Description { get; init; }
    public string? EcologicalInfo { get; init; }
    public string? ConservationStatus { get; init; }
    public string? AltitudeRange { get; init; }
    public bool? LegalStatus { get; init; }
    public bool? IsSensitive { get; init; }
}
