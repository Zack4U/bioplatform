namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for reading user-role assignment details.
/// </summary>
public class UserRoleReadDTO
{
    /// <summary>
    /// The unique identifier of the user.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// The email address of the user.
    /// </summary>
    public string UserEmail { get; set; } = string.Empty;

    /// <summary>
    /// The unique identifier of the role.
    /// </summary>
    public Guid RoleId { get; set; }

    /// <summary>
    /// The name of the role.
    /// </summary>
    public string RoleName { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp of when the role was assigned.
    /// </summary>
    public DateTime AssignedAt { get; set; }
}
