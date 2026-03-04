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

    /// <summary>
    /// Checks if another user (excluding a given ID) already has the specified email.
    /// Used during update to allow a user to keep their own email.
    /// </summary>
    Task<User?> GetByEmailExcludingIdAsync(string email, Guid excludeId);

    /// <summary>
    /// Checks if another user (excluding a given ID) already has the specified phone number.
    /// Used during update to allow a user to keep their own phone.
    /// </summary>
    Task<User?> GetByPhoneNumberExcludingIdAsync(string phoneNumber, Guid excludeId);

    /// <summary>
    /// Removes a user from the repository by their unique identifier.
    /// </summary>
    /// <param name="user">The user entity to remove.</param>
    Task DeleteAsync(User user);
}
