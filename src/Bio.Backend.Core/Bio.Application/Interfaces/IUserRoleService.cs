using Bio.Application.DTOs;

namespace Bio.Application.Interfaces;

/// <summary>
/// Service interface for independent user-role management.
/// </summary>
public interface IUserRoleService
{
    /// <summary>
    /// Assigns a role to a user, validating existence and preventing duplicates.
    /// </summary>
    /// <param name="dto">Assignment data.</param>
    Task AssignRoleAsync(UserRoleCreateDTO dto);

    /// <summary>
    /// Retrieves all existing user-role assignments with full details.
    /// </summary>
    /// <returns>A list of assignment details.</returns>
    Task<IEnumerable<UserRoleResponseDTO>> GetAllAssignmentsAsync();

    /// <summary>
    /// Retrieves all roles assigned to a specific user.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <returns>A list of roles assigned to the user.</returns>
    Task<IEnumerable<UserRoleResponseDTO>> GetAssignmentsByUserIdAsync(Guid userId);

    /// <summary>
    /// Retrieves all users assigned to a specific role.
    /// </summary>
    /// <param name="roleName">The name of the role.</param>
    /// <returns>A list of users with that role.</returns>
    Task<IEnumerable<UserRoleResponseDTO>> GetAssignmentsByRoleNameAsync(string roleName);

    /// <summary>
    /// Retrieves all users assigned to a specific role ID.
    /// </summary>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>A list of users with that role ID.</returns>
    Task<IEnumerable<UserRoleResponseDTO>> GetAssignmentsByRoleIdAsync(Guid roleId);

    /// <summary>
    /// Unassigns a role from a user.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="roleId">The unique identifier of the role.</param>
    Task UnassignRoleAsync(Guid userId, Guid roleId);
}
