namespace Bio.Application.DTOs;

/// <summary>
/// DTO para actualizar una especie (campos opcionales).
/// </summary>
public record SpeciesUpdateDTO
{
    public int? TaxonomyId { get; init; }
    public string? Slug { get; init; }
    public string? ThumbnailUrl { get; init; }
    public string? CommonName { get; init; }
    public string? Description { get; init; }
    public string? EcologicalInfo { get; init; }
    public string? TraditionalUses { get; init; }
    public string? EconomicPotential { get; init; }
    public string? ConservationStatus { get; init; }
    public bool? IsSensitive { get; init; }
}
