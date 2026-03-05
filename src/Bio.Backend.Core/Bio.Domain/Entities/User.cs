namespace Bio.Domain.Entities;

/// <summary>
/// Domain entity representing a registered user in the BioPlatform.
/// This class is used for persistence in the database.
/// </summary>
public class User
{
    /// <summary>
    /// Unique identifier for the user.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The user's full name.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Registered email address. Used for authentication.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Secure hash of the user's password (PBKDF2).
    /// </summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>
    /// User's contact phone number.
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// Unique random salt used for password hashing.
    /// </summary>
    public string Salt { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp of when the account was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp of the last profile update.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
