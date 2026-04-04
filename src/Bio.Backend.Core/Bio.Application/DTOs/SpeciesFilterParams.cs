namespace Bio.Application.DTOs;

/// <summary>
/// Parámetros de filtro, búsqueda, paginación y ordenamiento
/// para la consulta de listado de especies del catálogo.
/// </summary>
public record SpeciesFilterParams
{
    public string? Query { get; init; }
    public string? Kingdom { get; init; }
    public string? Phylum { get; init; }
    public string? Family { get; init; }
    public string? Genus { get; init; }
    public bool? IsSensitive { get; init; }
    public string? ConservationStatus { get; init; }

    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 12;

    public string SortBy { get; init; } = "scientificName";
    public string SortOrder { get; init; } = "asc";
}
