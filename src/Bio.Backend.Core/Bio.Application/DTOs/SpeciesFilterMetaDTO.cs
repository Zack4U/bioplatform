namespace Bio.Application.DTOs;

/// <summary>
/// DTO que contiene los valores disponibles para filtros del catálogo de especies.
/// Se genera dinámicamente desde los datos existentes en la BD.
/// </summary>
public record SpeciesFilterMetaDTO
{
    public IReadOnlyList<string> Kingdoms { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> Phylums { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> Families { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> Genera { get; init; } = Array.Empty<string>();
    public IReadOnlyList<string> ConservationStatuses { get; init; } = Array.Empty<string>();
    public int TotalSpeciesCount { get; init; }
}
