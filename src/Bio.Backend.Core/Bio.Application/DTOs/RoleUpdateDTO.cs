using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data Transfer Object for updating an existing security role.
/// </summary>
/// <param name="Name">Gets or sets the name of the role. Case-insensitive.</param>
/// <param name="Description">Gets or sets the optional description of the role.</param>
public record RoleUpdateDTO(
    [property: Required(ErrorMessage = "Name is required.")]
    [property: StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    string Name = "",

    [property: StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    string? Description = null
);
