namespace Bio.Application.DTOs;

/// <summary>
/// DTO para un uso tradicional de una especie.
/// </summary>
public record SpeciesTraditionalUseDTO(
    Guid Id,
    Guid SpeciesId,
    string Part,
    IReadOnlyList<string> Category,
    string? SpecificPurpose,
    string? PreparationMethod,
    string? Description,
    string? Community,
    string? TraditionalWarnings,
    string Confidence,
    DateTime CreatedAt
);
