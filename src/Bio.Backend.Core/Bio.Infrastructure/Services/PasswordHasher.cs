using System.Security.Cryptography;
using Bio.Domain.Interfaces;

namespace Bio.Backend.Core.Bio.Infrastructure.Services;

/// <summary>
/// Service for hashing and verifying passwords using PBKDF2 (Password-Based Key Derivation Function 2).
/// This implementation uses HMAC-SHA256 with 100,000 iterations for high security.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    private const int Iterations = 100000;
    private const int KeySize = 32; // 256 bits
    private const int SaltSize = 16; // 128 bits
    private static readonly HashAlgorithmName HashAlgorithm = HashAlgorithmName.SHA256;

    /// <summary>
    /// Hashes a password using a newly generated random salt.
    /// </summary>
    /// <param name="password">The plain text password to hash.</param>
    /// <returns>A tuple containing the Base64 encoded hash and the Base64 encoded salt.</returns>
    public (string Hash, string Salt) HashPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
            throw new ArgumentException("Password cannot be null or empty.", nameof(password));

        // 1. Generate a secure random salt (16 bytes)
        byte[] salt = RandomNumberGenerator.GetBytes(SaltSize);

        // 2. Derive a 32-byte key from the password and salt using PBKDF2
        byte[] hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithm, KeySize);

        // 3. Convert bytes to Base64 strings for storage in the database
        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    /// <summary>
    /// Verifies if a plain text password matches a stored hash and salt.
    /// </summary>
    /// <param name="password">The plain text password to verify.</param>
    /// <param name="hash">The stored Base64 encoded hash.</param>
    /// <param name="salt">The stored Base64 encoded salt.</param>
    /// <returns>True if the password is valid; otherwise, false.</returns>
    public bool VerifyPassword(string password, string hash, string salt)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(hash) || string.IsNullOrWhiteSpace(salt))
            return false;

        // 1. Convert the stored Base64 strings back to bytes
        byte[] saltBytes = Convert.FromBase64String(salt);
        byte[] hashBytes = Convert.FromBase64String(hash);

        // 2. Re-calculate the hash for the provided password using the same salt and iterations
        byte[] newHash = Rfc2898DeriveBytes.Pbkdf2(password, saltBytes, Iterations, HashAlgorithm, KeySize);

        // 3. Use a fixed-time comparison to prevent timing attacks
        return CryptographicOperations.FixedTimeEquals(hashBytes, newHash);
    }
}
