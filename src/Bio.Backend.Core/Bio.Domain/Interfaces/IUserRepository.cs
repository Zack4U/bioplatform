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
    /// Retrieves all users from the repository.
    /// </summary>
    Task<IEnumerable<User>> GetAllAsync();

    /// <summary>
    /// Retrieves a user by their unique identifier.
    /// </summary>
    Task<User?> GetByIdAsync(Guid id);

    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    Task<User?> GetByEmailAsync(string email);

    /// <summary>
    /// Retrieves a user by their phone number.
    /// </summary>
    Task<User?> GetByPhoneNumberAsync(string phoneNumber);
}
