using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Interface for user-role assignment persistence operations.
/// </summary>
public interface IUserRoleRepository
{
    /// <summary>
    /// Checks if a user already has a specific role assigned.
    /// </summary>
    Task<bool> ExistsAsync(Guid userId, Guid roleId);

    /// <summary>
    /// Adds a new user-role assignment.
    /// </summary>
    Task AddAsync(UserRole userRole);

    /// <summary>
    /// Persists changes to the database.
    /// </summary>
    Task SaveChangesAsync();
}
