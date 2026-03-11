using Bio.Application.DTOs;

namespace Bio.Application.Interfaces;

/// <summary>
/// Defines the contract for user authentication and token management.
/// </summary>
public interface IAuthService
{
    /// <summary>
    /// Authenticates a user and returns access/refresh tokens.
    /// </summary>
    Task<AuthResponseDTO> LoginAsync(LoginRequestDTO request);

    /// <summary>
    /// Validates a refresh token and generates a new pair of tokens.
    /// </summary>
    Task<AuthResponseDTO> RefreshTokenAsync(string refreshToken, string accessToken);

    /// <summary>
    /// Revokes a refresh token, effectively ending the session.
    /// </summary>
    Task RevokeTokenAsync(string refreshToken);
}
