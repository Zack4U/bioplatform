using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Interface for role persistence operations.
/// </summary>
public interface IRoleRepository
{
    /// <summary>
    /// Adds a new role to the repository.
    /// </summary>
    /// <param name="role">The role entity to add.</param>
    /// <returns>A task representing the asynchronous add operation.</returns>
    Task AddAsync(Role role);

    /// <summary>
    /// Retrieves a role by its unique identifier.
    /// </summary>
    /// <param name="id">The ID of the role to retrieve.</param>
    /// <returns>The role if found, otherwise null.</returns>
    Task<Role?> GetByIdAsync(Guid id);

    /// <summary>
    /// Retrieves a role by its unique name.
    /// </summary>
    /// <param name="name">The name of the role to search for.</param>
    /// <returns>The role if found, otherwise null.</returns>
    Task<Role?> GetByNameAsync(string name);

    /// <summary>
    /// Retrieves a role by its unique name, excluding a specified ID.
    /// Useful for verifying name uniqueness during updates.
    /// </summary>
    /// <param name="name">The name of the role to search for.</param>
    /// <param name="id">The ID of the role to exclude from the search.</param>
    /// <returns>The role if found, otherwise null.</returns>
    Task<Role?> GetByNameExcludingIdAsync(string name, Guid id);

    /// <summary>
    /// Retrieves all roles.
    /// </summary>
    /// <returns>An enumerable collection of role entities.</returns>
    Task<IEnumerable<Role>> GetAllAsync();

    /// <summary>
    /// Deletes a role from the repository.
    /// </summary>
    /// <param name="role">The role entity to delete.</param>
    /// <returns>A task representing the asynchronous delete operation.</returns>
    Task DeleteAsync(Role role);
}
