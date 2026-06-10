namespace Bio.Application.DTOs;

/// <summary>
/// DTO de respuesta para Taxonomy.
/// </summary>
public record TaxonomyResponseDTO(
    int Id,
    string? Kingdom,
    string? Phylum,
    string? ClassName,
    string? OrderName,
    string? Family,
    string? Genus
);
