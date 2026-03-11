using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for creating a user-role assignment.
/// </summary>
/// <param name="UserId">The unique identifier of the user.</param>
/// <param name="RoleId">The unique identifier of the role to assign.</param>
public record UserRoleCreateDTO(
    [Required(ErrorMessage = "User ID is required.")]
    Guid? UserId = null,

    [Required(ErrorMessage = "Role ID is required.")]
    Guid? RoleId = null
);
