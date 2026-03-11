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
    /// <param name="user">The user entity to add.</param>
    /// <returns>A task representing the asynchronous add operation.</returns>
    Task AddAsync(User user);

    /// <summary>
    /// Retrieves all users from the repository.
    /// </summary>
    /// <returns>An enumerable collection of user entities.</returns>
    Task<IEnumerable<User>> GetAllAsync();

    /// <summary>
    /// Retrieves a user by their unique identifier.
    /// </summary>
    /// <param name="id">The ID of the user to retrieve.</param>
    /// <returns>The user if found, otherwise null.</returns>
    Task<User?> GetByIdAsync(Guid id);

    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    /// <param name="email">The email address of the user to retrieve.</param>
    /// <returns>The user if found, otherwise null.</returns>
    Task<User?> GetByEmailAsync(string email);

    /// <summary>
    /// Retrieves a user by their phone number.
    /// </summary>
    /// <param name="phoneNumber">The phone number of the user to retrieve.</param>
    /// <returns>The user if found, otherwise null.</returns>
    Task<User?> GetByPhoneNumberAsync(string phoneNumber);

    /// <summary>
    /// Checks if another user (excluding a given ID) already has the specified email.
    /// Used during update to allow a user to keep their own email.
    /// </summary>
    /// <param name="email">The email address to search for.</param>
    /// <param name="excludeId">The ID of the user to exclude from the search.</param>
    /// <returns>The user if found, otherwise null.</returns>
    Task<User?> GetByEmailExcludingIdAsync(string email, Guid excludeId);

    /// <summary>
    /// Checks if another user (excluding a given ID) already has the specified phone number.
    /// Used during update to allow a user to keep their own phone.
    /// </summary>
    /// <param name="phoneNumber">The phone number to search for.</param>
    /// <param name="excludeId">The ID of the user to exclude from the search.</param>
    /// <returns>The user if found, otherwise null.</returns>
    Task<User?> GetByPhoneNumberExcludingIdAsync(string phoneNumber, Guid excludeId);

    /// <summary>
    /// Removes a user from the repository by their unique identifier.
    /// </summary>
    /// <param name="user">The user entity to remove.</param>
    /// <returns>A task representing the asynchronous delete operation.</returns>
    Task DeleteAsync(User user);
}
