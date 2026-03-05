namespace Bio.Domain.Entities;

/// <summary>
/// Domain entity representing the assignment of a role to a user.
/// This is treated as an independent link between User and Role.
/// </summary>
public class UserRole
{
    /// <summary>
    /// Identifier of the associated user.
    /// </summary>
    public Guid UserId { get; set; }

    /// <summary>
    /// Identifier of the associated role.
    /// </summary>
    public Guid RoleId { get; set; }

    /// <summary>
    /// Timestamp of when the role was assigned.
    /// </summary>
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
