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
    /// Completes the 2FA challenge and returns access/refresh tokens.
    /// </summary>
    Task<AuthResponseDTO> LoginTwoFactorAsync(TwoFactorLoginRequestDTO request);

    /// <summary>
    /// Validates a refresh token and generates a new pair of tokens.
    /// </summary>
    Task<AuthResponseDTO> RefreshTokenAsync(string refreshToken, string accessToken);

    /// <summary>
    /// Revokes a refresh token, effectively ending the session.
    /// </summary>
    Task RevokeTokenAsync(string refreshToken);

    /// <summary>
    /// Changes an authenticated user's password.
    /// </summary>
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDTO request);

    /// <summary>
    /// Starts the Two-Factor Authentication setup process.
    /// </summary>
    Task<TwoFactorSetupResponseDTO> SetupTwoFactorAsync(Guid userId);

    /// <summary>
    /// Validates the first code and enables 2FA for the user.
    /// </summary>
    Task<bool> VerifyTwoFactorAsync(Guid userId, TwoFactorVerifyRequestDTO request);

    /// <summary>
    /// Disables 2FA for the user.
    /// </summary>
    Task DisableTwoFactorAsync(Guid userId);
}
