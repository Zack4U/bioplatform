namespace Bio.Application.DTOs;

/// <summary>
/// DTO para un potencial económico de una especie.
/// </summary>
public record SpeciesEconomicPotentialDTO(
    Guid Id,
    Guid SpeciesId,
    string Sector,
    IReadOnlyList<string> Products,
    IReadOnlyList<string>? ActiveProperties,
    string? Description,
    string MarketValue,
    string SustainabilityLevel,
    string Confidence,
    DateTime CreatedAt
);
