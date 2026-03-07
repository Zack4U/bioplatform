using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for creating a user-role assignment.
/// </summary>
public class UserRoleCreateDTO
{
    /// <summary>
    /// The unique identifier of the user.
    /// </summary>
    /// <example>123e4567-e89b-12d3-a456-426614174000</example>
    [Required(ErrorMessage = "User ID is required.")]
    public Guid? UserId { get; set; }

    /// <summary>
    /// The unique identifier of the role to assign.
    /// </summary>
    /// <example>123e4567-e89b-12d3-a456-426614174000</example>
    [Required(ErrorMessage = "Role ID is required.")]
    public Guid? RoleId { get; set; }
}
