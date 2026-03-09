using Bio.Domain.Entities;
using Bio.Domain.ReadModels;

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
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <returns>True if the user has the role, false otherwise.</returns>
    Task<bool> ExistsAsync(Guid userId, Guid roleId);

    /// <summary>
    /// Retrieves a specific user-role assignment by IDs.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <param name="roleId">The role's unique identifier.</param>
    /// <returns>The user-role assignment if found, otherwise null.</returns>
    Task<UserRole?> GetByIdsAsync(Guid userId, Guid roleId);

    /// <summary>
    /// Adds a new user-role assignment.
    /// </summary>
    /// <param name="userRole">The user-role assignment entity to add.</param>
    /// <returns>A task representing the asynchronous add operation.</returns>
    Task AddAsync(UserRole userRole);

    /// <summary>
    /// Removes a user-role assignment from the database.
    /// </summary>
    /// <param name="userRole">The user-role assignment entity to remove.</param>
    /// <returns>A task representing the asynchronous delete operation.</returns>
    Task DeleteAsync(UserRole userRole);

    /// <summary>
    /// Persists changes to the database.
    /// </summary>
    /// <returns>A task representing the asynchronous save operation.</returns>
    Task SaveChangesAsync();
}
