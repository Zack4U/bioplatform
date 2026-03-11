using Bio.Domain.Entities;
using System.Security.Claims;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Defines the contract for generating security tokens (JWT and Refresh Tokens).
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Generates a JWT Access Token for a user with their claims and roles.
    /// </summary>
    string GenerateAccessToken(User user, IEnumerable<string> roles);

    /// <summary>
    /// Generates a cryptographically secure random Refresh Token.
    /// </summary>
    string GenerateRefreshToken();

    /// <summary>
    /// Extracts the user ID from an expired JWT token.
    /// </summary>
    Guid GetUserIdFromToken(string token);

    /// <summary>
    /// Extracts the user principal from an expired JWT token (used for validation during refresh).
    /// </summary>
    ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
}
