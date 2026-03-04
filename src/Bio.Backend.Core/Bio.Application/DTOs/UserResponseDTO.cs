namespace Bio.Application.DTOs;

/// <summary>
/// Data Transfer Object representing the user information sent back to the client.
/// This object excludes sensitive data like password hashes or salts.
/// </summary>
public class UserResponseDTO
{
    /// <summary>
    /// Unique identifier for the user.
    /// </summary>
    /// <example>f47ac10b-58cc-4372-a567-0e02b2c3d479</example>
    public Guid Id { get; set; }

    /// <summary>
    /// Full name of the user.
    /// </summary>
    /// <example>Juan Pérez</example>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// User's registered email address.
    /// </summary>
    /// <example>juan.perez@example.com</example>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// The date and time when the user account was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}
