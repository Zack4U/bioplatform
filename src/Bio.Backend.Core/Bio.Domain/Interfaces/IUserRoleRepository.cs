using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Interface for user-role assignment persistence operations.
/// </summary>
public interface IUserRoleRepository
{
    /// <summary>
    /// Retrieves all user-role assignments with user and role names from the database.
    /// </summary>
    /// <returns>A collection of assignment details.</returns>
    Task<IEnumerable<UserRoleDetail>> GetAllWithDetailsAsync();

    /// <summary>
    /// Retrieves all roles assigned to a specific user.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <returns>A collection of roles assigned to the user.</returns>
    Task<IEnumerable<UserRoleDetail>> GetByUserIdWithDetailsAsync(Guid userId);

    /// <summary>
    /// Retrieves all users assigned to a specific role name.
    /// </summary>
    /// <param name="roleName">The name of the role.</param>
    /// <returns>A collection of users assigned to the role.</returns>
    Task<IEnumerable<UserRoleDetail>> GetByRoleNameWithDetailsAsync(string roleName);

    /// <summary>
    /// Retrieves all users assigned to a specific role ID.
    /// </summary>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>A collection of users assigned to the role.</returns>
    Task<IEnumerable<UserRoleDetail>> GetByRoleIdWithDetailsAsync(Guid roleId);
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
