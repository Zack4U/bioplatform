namespace Bio.Domain.Entities;

/// <summary>
/// Domain entity representing the assignment of a role to a user.
/// Follows DDD principles with state protected by constructor.
/// </summary>
public class UserRole
{
    /// <summary>
    /// Identifier of the associated user.
    /// </summary>
    public Guid UserId { get; private set; }

    /// <summary>
    /// Identifier of the associated role.
    /// </summary>
    public Guid RoleId { get; private set; }

    /// <summary>
    /// Timestamp of when the role was assigned.
    /// </summary>
    public DateTime AssignedAt { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation property to the associated user.
    /// </summary>
    public virtual User User { get; private set; } = null!;

    /// <summary>
    /// Navigation property to the associated role.
    /// </summary>
    public virtual Role Role { get; private set; } = null!;

    // Required for EF Core
    private UserRole() { }

    public UserRole(Guid userId, Guid roleId)
    {
        if (userId == Guid.Empty) throw new ArgumentException("User ID cannot be empty.", nameof(userId));
        if (roleId == Guid.Empty) throw new ArgumentException("Role ID cannot be empty.", nameof(roleId));

        UserId = userId;
        RoleId = roleId;
        AssignedAt = DateTime.UtcNow;
    }
}
