namespace Bio.Domain.ReadModels;

/// <summary>
/// Read model representing a user-role assignment with expanded details.
/// Result of a JOIN query between Users, Roles and UserRoles tables.
/// </summary>
public class UserRoleDetail
{
    /// <summary>
    /// Gets or sets the unique identifier of the user.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Gets or sets the email address of the user.
    /// </summary>
    public string UserEmail { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the unique identifier of the role.
    /// </summary>
    public Guid RoleId { get; set; }

    /// <summary>
    /// Gets or sets the name of the role.
    /// </summary>
    public string RoleName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the date and time when the role was assigned to the user.
    /// </summary>
    public DateTime AssignedAt { get; set; }
}
