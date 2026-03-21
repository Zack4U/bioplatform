namespace Bio.Application.DTOs;

/// <summary>
/// DTO para crear una especie.
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
    public string? TraditionalUses { get; init; }
    public string? EconomicPotential { get; init; }
    public string? ConservationStatus { get; init; }
    public bool IsSensitive { get; init; }
}
