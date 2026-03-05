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
    Task AddAsync(Role role);

    /// <summary>
    /// Retrieves a role by its unique identifier.
    /// </summary>
    Task<Role?> GetByIdAsync(Guid id);

    /// <summary>
    /// Retrieves a role by its unique name.
    /// </summary>
    Task<Role?> GetByNameAsync(string name);

    /// <summary>
    /// Retrieves a role by its unique name, excluding a specified ID.
    /// Useful for verifying name uniqueness during updates.
    /// </summary>
    Task<Role?> GetByNameExcludingIdAsync(string name, Guid id);

    /// <summary>
    /// Retrieves all roles.
    /// </summary>
    Task<IEnumerable<Role>> GetAllAsync();

    /// <summary>
    /// Persists changes to the repository.
    /// </summary>
    Task SaveChangesAsync();
}
