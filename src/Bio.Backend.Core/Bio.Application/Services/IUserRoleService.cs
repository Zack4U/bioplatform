using Bio.Application.DTOs;

namespace Bio.Application.Services;

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
}
