using Bio.Application.DTOs;

namespace Bio.Application.Interfaces;

/// <summary>
/// Defines the services for role management.
/// </summary>
public interface IRoleService
{
    /// <summary>
    /// Creates a new role in the system.
    /// </summary>
    /// <param name="dto">Role creation data.</param>
    /// <returns>Information of the created role.</returns>
    Task<RoleResponseDTO> CreateRoleAsync(RoleCreateDTO dto);

    /// <summary>
    /// Updates an existing security role.
    /// </summary>
    /// <param name="id">The unique identifier of the role to update.</param>
    /// <param name="dto">The update data.</param>
    /// <returns>The updated role information.</returns>
    Task<RoleResponseDTO> UpdateRoleAsync(Guid id, RoleUpdateDTO dto);

    /// <summary>
    /// Deletes an existing security role.
    /// </summary>
    /// <param name="id">The unique identifier of the role to delete.</param>
    Task DeleteRoleAsync(Guid id);

    /// <summary>
    /// Retrieves all roles.
    /// </summary>
    /// <returns>A collection of roles.</returns>
    Task<IEnumerable<RoleResponseDTO>> GetAllRolesAsync();

    /// <summary>
    /// Retrieves a role by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the role.</param>
    /// <returns>The role information or null if not found.</returns>
    Task<RoleResponseDTO?> GetRoleByIdAsync(Guid id);

    /// <summary>
    /// Retrieves a role by its unique name.
    /// </summary>
    /// <param name="name">The name of the role.</param>
    /// <returns>The role information or null if not found.</returns>
    Task<RoleResponseDTO?> GetRoleByNameAsync(string name);
}
