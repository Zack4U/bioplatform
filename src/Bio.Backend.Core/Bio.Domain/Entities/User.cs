namespace Bio.Domain.Entities;

/// <summary>
/// Domain entity representing a registered user in the BioPlatform.
/// This class follows DDD principles with encapsulated state and business behavior.
/// </summary>
public class User
{
    /// <summary>
    /// Unique identifier for the user.
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// The user's full name.
    /// </summary>
    public string FullName { get; private set; } = string.Empty;

    /// <summary>
    /// Registered email address. Used for authentication.
    /// </summary>
    public string Email { get; private set; } = string.Empty;

    /// <summary>
    /// Secure hash of the user's password (PBKDF2).
    /// </summary>
    public string PasswordHash { get; private set; } = string.Empty;

    /// <summary>
    /// User's contact phone number.
    /// </summary>
    public string? PhoneNumber { get; private set; }

    /// <summary>
    /// Unique random salt used for password hashing.
    /// </summary>
    public string Salt { get; private set; } = string.Empty;

    /// <summary>
    /// Timestamp of when the account was created.
    /// </summary>
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp of the last profile update.
    /// </summary>
    public DateTime? UpdatedAt { get; private set; }

    // Required for EF Core
    private User() { }

    /// <summary>
    /// Factory method or constructor to ensure a user is always created in a valid state.
    /// </summary>
    public User(Guid id, string fullName, string email, string passwordHash, string salt, string? phoneNumber = null)
    {
        if (id == Guid.Empty) throw new ArgumentException("User ID cannot be empty.", nameof(id));
        if (string.IsNullOrWhiteSpace(fullName)) throw new ArgumentException("Full name is required.", nameof(fullName));
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email is required.", nameof(email));

        Id = id;
        FullName = fullName.Trim();
        Email = email.Trim().ToLowerInvariant();
        PasswordHash = passwordHash;
        Salt = salt;
        PhoneNumber = phoneNumber?.Trim();
        CreatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates the user's profile information.
    /// </summary>
    public void UpdateProfile(string fullName, string email, string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(fullName)) throw new ArgumentException("Full name cannot be empty.", nameof(fullName));
        if (string.IsNullOrWhiteSpace(email)) throw new ArgumentException("Email cannot be empty.", nameof(email));

        FullName = fullName.Trim();
        Email = email.Trim().ToLowerInvariant();
        PhoneNumber = phoneNumber?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Changes the user's password.
    /// </summary>
    public void ChangePassword(string newPasswordHash, string newSalt)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash)) throw new ArgumentException("Password hash cannot be empty.", nameof(newPasswordHash));
        if (string.IsNullOrWhiteSpace(newSalt)) throw new ArgumentException("Salt cannot be empty.", nameof(newSalt));

        PasswordHash = newPasswordHash;
        Salt = newSalt;
        UpdatedAt = DateTime.UtcNow;
    }
}
