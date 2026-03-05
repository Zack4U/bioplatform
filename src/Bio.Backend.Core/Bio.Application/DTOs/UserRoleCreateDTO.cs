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
    [Required]
    public Guid UserId { get; set; }

    /// <summary>
    /// The unique identifier of the role to assign.
    /// </summary>
    [Required]
    public Guid RoleId { get; set; }
}
