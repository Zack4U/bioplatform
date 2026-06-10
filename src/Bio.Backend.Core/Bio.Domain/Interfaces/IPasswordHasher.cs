namespace Bio.Domain.Interfaces;

/// <summary>
/// Defines the contract for password hashing and verification.
/// This interface allows the application to remain decoupled from the specific hashing implementation.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>
    /// Hashes the provided plain text password.
    /// </summary>
    /// <param name="password">The password to hash.</param>
    /// <returns>A tuple containing the generated hash and the unique salt used.</returns>
    (string Hash, string Salt) HashPassword(string password);

    /// <summary>
    /// Verifies if a plain text password matches a stored hash and salt.
    /// </summary>
    /// <param name="password">The entry password to verify.</param>
    /// <param name="hash">The stored password hash.</param>
    /// <param name="salt">The unique salt used for the original hash.</param>
    /// <returns>True if the password is valid; otherwise, false.</returns>
    bool VerifyPassword(string password, string hash, string salt);
}