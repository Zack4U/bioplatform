using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data Transfer Object for updating an existing security role.
/// </summary>
/// <param name="Name">Gets or sets the name of the role. Case-insensitive.</param>
/// <param name="Description">Gets or sets the optional description of the role.</param>
public record RoleUpdateDTO
{
    public RoleUpdateDTO() { }

    public RoleUpdateDTO(string name, string? description = null)
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
