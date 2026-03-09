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
    public Guid Id { get; set; }

    /// <summary>
    /// Full name of the user.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// User's registered email address.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// User's phone number.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// The date and time when the user account was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The date and time when the user account was updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
