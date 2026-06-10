using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for role creation.
/// </summary>
/// <param name="Name">Name of the role (e.g., ADMIN). Will be normalized to uppercase.</param>
/// <param name="Description">Optional description of the role.</param>
public record RoleCreateDTO
{
    public RoleCreateDTO() { }

    public RoleCreateDTO(string name, string? description = null)
    {
        Name = name;
        Description = description;
    }

    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    public string Name { get; init; } = "";

    [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    public string? Description { get; init; } = null;
}
