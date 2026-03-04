using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Interface for user persistence operations.
/// </summary>
public interface IUserRepository
{
    /// <summary>
    /// Adds a new user to the repository.
    /// </summary>
    Task AddAsync(User user);

    /// <summary>
    /// Persists changes to the repository.
    /// </summary>
    Task SaveChangesAsync();

    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    Task<User?> GetByEmailAsync(string email);
}
