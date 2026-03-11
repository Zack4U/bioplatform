using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for creating a user-role assignment.
/// </summary>
/// <param name="UserId">The unique identifier of the user.</param>
/// <param name="RoleId">The unique identifier of the role to assign.</param>
public record UserRoleCreateDTO
{
    public UserRoleCreateDTO() { }

    public UserRoleCreateDTO(Guid? userId, Guid? roleId)
    {
        UserId = userId;
        RoleId = roleId;
    }

    [Required(ErrorMessage = "User ID is required.")]
    public Guid? UserId { get; init; } = null;

    [Required(ErrorMessage = "Role ID is required.")]
    public Guid? RoleId { get; init; } = null;
}
