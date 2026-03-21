namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for user-role assignment details.
/// </summary>
/// <param name="UserId">The unique identifier of the user.</param>
/// <param name="UserEmail">The email address of the user.</param>
/// <param name="RoleId">The unique identifier of the role.</param>
/// <param name="RoleName">The name of the role.</param>
/// <param name="AssignedAt">Timestamp of when the role was assigned.</param>
public record UserRoleResponseDTO(
    Guid UserId,
    string UserEmail = "",
    Guid RoleId = default,
    string RoleName = "",
    DateTime AssignedAt = default
);
