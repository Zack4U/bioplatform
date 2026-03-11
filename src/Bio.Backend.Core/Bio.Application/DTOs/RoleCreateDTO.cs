using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for role creation.
/// </summary>
/// <param name="Name">Name of the role (e.g., ADMIN). Will be normalized to uppercase.</param>
/// <param name="Description">Optional description of the role.</param>
public record RoleCreateDTO(
    [property: Required(ErrorMessage = "Name is required.")]
    [property: StringLength(100, ErrorMessage = "Name cannot exceed 100 characters.")]
    string Name = "",

    [property: StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    string? Description = null
);
