namespace Bio.Application.DTOs;

/// <summary>
/// DTO para crear una taxonomía.
/// </summary>
public record TaxonomyCreateDTO
{
    public string? Kingdom { get; init; }
    public string? Phylum { get; init; }
    public string? ClassName { get; init; }
    public string? OrderName { get; init; }
    public string? Family { get; init; }
    public string? Genus { get; init; }
}
