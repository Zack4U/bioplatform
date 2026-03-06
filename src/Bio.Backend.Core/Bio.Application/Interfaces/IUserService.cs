using Bio.Application.DTOs;

namespace Bio.Application.Interfaces;

/// <summary>
/// Defines the services for user management.
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Creates a new user in the system, processing their password and saving it to the database.
    /// </summary>
    /// <param name="userCreateDTO">User creation data.</param>
    /// <returns>Information of the created user without sensitive data.</returns>
    Task<UserResponseDTO> CreateUserAsync(UserCreateDTO userCreateDTO);

    /// <summary>
    /// Retrieves all registered users in the system.
    /// </summary>
    /// <returns>A collection of users without sensitive information.</returns>
    Task<IEnumerable<UserResponseDTO>> GetAllUsersAsync();

    /// <summary>
    /// Retrieves a user by their unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the user.</param>
    /// <returns>The user information or null if not found.</returns>
    Task<UserResponseDTO?> GetUserByIdAsync(Guid id);

    /// <summary>
    /// Retrieves a user by their email address.
    /// </summary>
    /// <param name="email">The email to search for.</param>
    /// <returns>The user information or null if not found.</returns>
    Task<UserResponseDTO?> GetUserByEmailAsync(string email);

    /// <summary>
    /// Retrieves a user by their phone number.
    /// </summary>
    /// <param name="phoneNumber">The phone number to search for.</param>
    /// <returns>The user information or null if not found.</returns>
    Task<UserResponseDTO?> GetUserByPhoneNumberAsync(string phoneNumber);

    /// <summary>
    /// Updates an existing user's profile (FullName, Email, PhoneNumber).
    /// Validates uniqueness of email and phone against other users.
    /// </summary>
    /// <param name="id">The user's ID.</param>
    /// <param name="dto">The update data.</param>
    /// <returns>The updated user, or null if the user was not found.</returns>
    Task<UserResponseDTO?> UpdateUserAsync(Guid id, UserUpdateDTO dto);

    /// <summary>
    /// Deletes a user by their unique identifier.
    /// </summary>
    /// <param name="id">The user's ID.</param>
    /// <returns>True if deleted; false if user was not found.</returns>
    Task<bool> DeleteUserAsync(Guid id);
}
