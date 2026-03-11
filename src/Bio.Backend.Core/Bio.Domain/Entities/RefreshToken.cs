using Bio.Domain.Entities;

namespace Bio.Domain.Entities;

/// <summary>
/// Represents a refresh token used to obtain new access tokens without re-authenticating.
/// </summary>
public class RefreshToken
{
    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public string Token { get; private set; } = string.Empty;
    public DateTime ExpiresAt { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? RevokedAt { get; private set; }
    public string? ReplacedByToken { get; private set; }

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
    public bool IsRevoked => RevokedAt != null;
    public bool IsActive => !IsRevoked && !IsExpired;

    // Required for EF Core
    private RefreshToken() { }

    /// <summary>
    /// Initializes a new instance of the <see cref="RefreshToken"/> class.
    /// </summary>
    public RefreshToken(Guid userId, string token, DateTime expiresAt)
    {
        if (userId == Guid.Empty) throw new ArgumentException("User ID cannot be empty.", nameof(userId));
        if (string.IsNullOrWhiteSpace(token)) throw new ArgumentException("Token cannot be null or empty.", nameof(token));
        if (expiresAt <= DateTime.UtcNow) throw new ArgumentException("Expiration date must be in the future.", nameof(expiresAt));

        Id = Guid.NewGuid();
        UserId = userId;
        Token = token;
        ExpiresAt = expiresAt;
        CreatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Revokes the current refresh token.
    /// </summary>
    public void Revoke(string? replacedByToken = null)
    {
        if (IsRevoked) return;
        
        RevokedAt = DateTime.UtcNow;
        ReplacedByToken = replacedByToken;
    }

    // Navigation property
    public virtual User User { get; private set; } = null!;
}
