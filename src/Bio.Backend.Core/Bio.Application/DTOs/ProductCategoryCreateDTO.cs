namespace Bio.Application.DTOs;

public record ProductCategoryCreateDTO
{
    public string Name { get; init; } = string.Empty;
}
