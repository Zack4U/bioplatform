namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for authentication responses.
/// Supports two-factor authentication challenges.
/// </summary>
/// <param name="AccessToken">The JWT access token (null if 2FA is required).</param>
/// <param name="RefreshToken">The refresh token (null if 2FA is required).</param>
/// <param name="AccessTokenExpiration">Expiration time for the access token.</param>
/// <param name="TwoFactorRequired">Indicates if the user must complete a 2FA challenge.</param>
/// <param name="TwoFactorToken">A temporary token to be used for 2FA verification.</param>
public record AuthResponseDTO(
    string? AccessToken = null,
    string? RefreshToken = null,
    DateTime? AccessTokenExpiration = null,
    bool TwoFactorRequired = false,
    string? TwoFactorToken = null
);
