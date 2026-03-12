using Bio.Application.Common.Models;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Microsoft.Extensions.Options;
using OtpNet;
using System.Security.Claims;

namespace Bio.Application.Services;

/// <summary>
/// Service for authentication and authorization.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly JwtSettings _jwtSettings;

    public AuthService(
        IUserRepository userRepository,
        IUserRoleRepository userRoleRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IUnitOfWork unitOfWork,
        IOptions<JwtSettings> jwtSettings)
    {
        _userRepository = userRepository;
        _userRoleRepository = userRoleRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _unitOfWork = unitOfWork;
        _jwtSettings = jwtSettings.Value;
    }

    /// <summary>
    /// Logs in a user with the provided credentials.
    /// </summary>
    /// <param name="request">The login request.</param>
    /// <returns>The authentication response.</returns>
    public async Task<AuthResponseDTO> LoginAsync(LoginRequestDTO request)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash, user.Salt))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        var roles = (await _userRoleRepository.GetByUserIdWithDetailsAsync(user.Id))
            .Select(ur => ur.RoleName)
            .ToList();

        // Check if 2FA is enabled
        if (user.TwoFactorEnabled)
        {
            var twoFactorToken = _tokenService.GenerateTwoFactorToken(user);
            return new AuthResponseDTO(TwoFactorRequired: true, TwoFactorToken: twoFactorToken);
        }

        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken(
            user.Id,
            refreshToken,
            DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays));

        await _refreshTokenRepository.AddAsync(refreshTokenEntity);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDTO(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            AccessTokenExpiration: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes));
    }

    /// <summary>
    /// Refreshes the access token with the provided refresh token.
    /// </summary>
    /// <param name="refreshToken">The refresh token.</param>
    /// <param name="accessToken">The access token.</param>
    /// <returns>The authentication response.</returns>
    public async Task<AuthResponseDTO> RefreshTokenAsync(string refreshToken, string accessToken)
    {
        var userId = _tokenService.GetUserIdFromToken(accessToken);

        var user = await _userRepository.GetByIdAsync(userId);
        var storedRefreshToken = await _refreshTokenRepository.GetByTokenAsync(refreshToken, userId);

        if (user == null || storedRefreshToken == null || !storedRefreshToken.IsActive)
        {
            throw new UnauthorizedException("Invalid refresh token.");
        }

        var roles = (await _userRoleRepository.GetByUserIdWithDetailsAsync(user.Id))
            .Select(ur => ur.RoleName)
            .ToList();

        var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        // Revoke current token
        storedRefreshToken.Revoke(newRefreshToken);
        await _refreshTokenRepository.UpdateAsync(storedRefreshToken);

        var newRefreshTokenEntity = new RefreshToken(
            user.Id,
            newRefreshToken,
            DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays));

        await _refreshTokenRepository.AddAsync(newRefreshTokenEntity);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDTO(
            newAccessToken,
            newRefreshToken,
            DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes));
    }

    /// <summary>
    /// Revokes the refresh token.
    /// </summary>
    /// <param name="refreshToken">The refresh token.</param>
    public async Task RevokeTokenAsync(string refreshToken)
    {
        var storedToken = await _refreshTokenRepository.GetByTokenAsync(refreshToken);
        if (storedToken != null && storedToken.IsActive)
        {
            storedToken.Revoke();
            await _refreshTokenRepository.UpdateAsync(storedToken);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Changes the user's password.
    /// </summary>
    /// <param name="userId">The ID of the user requesting the change.</param>
    /// <param name="request">The change password request containing current and new passwords.</param>
    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequestDTO request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found.");
        }

        if (!_passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash, user.Salt))
        {
            throw new UnauthorizedException("Invalid current password.");
        }

        var (newHash, newSalt) = _passwordHasher.HashPassword(request.NewPassword);

        user.ChangePassword(newHash, newSalt);

        await _unitOfWork.SaveChangesAsync();
    }

    /// <summary>
    /// Completes the 2FA challenge and returns access/refresh tokens.
    /// </summary>
    public async Task<AuthResponseDTO> LoginTwoFactorAsync(TwoFactorLoginRequestDTO request)
    {
        var principal = _tokenService.GetPrincipalFromExpiredToken(request.TwoFactorToken);

        // Find user ID (sub or NameIdentifier due to potential claim mapping)
        var sub = principal.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                  ?? principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(sub) || !Guid.TryParse(sub, out var userId))
        {
            throw new UnauthorizedException("Invalid 2FA token.");
        }

        var isPending = principal.HasClaim("2fa_pending", "true");
        if (!isPending)
        {
            throw new UnauthorizedException("Invalid 2FA token.");
        }

        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || !user.TwoFactorEnabled || string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            throw new UnauthorizedException("2FA is not enabled for this user.");
        }

        // Verify the TOTP code
        var key = Base32Encoding.ToBytes(user.TwoFactorSecret);
        var totp = new Totp(key);
        var isValid = totp.VerifyTotp(request.Code, out _, VerificationWindow.RfcSpecifiedNetworkDelay);

        if (!isValid)
        {
            throw new UnauthorizedException("Invalid 2FA code.");
        }

        // Finalize login
        var roles = (await _userRoleRepository.GetByUserIdWithDetailsAsync(user.Id))
            .Select(ur => ur.RoleName)
            .ToList();

        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken(
            user.Id,
            refreshToken,
            DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays));

        await _refreshTokenRepository.AddAsync(refreshTokenEntity);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDTO(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            AccessTokenExpiration: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes));
    }

    /// <summary>
    /// Starts the Two-Factor Authentication setup process.
    /// </summary>
    public async Task<TwoFactorSetupResponseDTO> SetupTwoFactorAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found.");
        }

        // Generate a new 160-bit secret (standard)
        var key = KeyGeneration.GenerateRandomKey(20);
        var base32Secret = Base32Encoding.ToString(key);

        user.SetTwoFactorSecret(base32Secret);
        await _unitOfWork.SaveChangesAsync();

        // format: otpauth://totp/{Issuer}:{Account}?secret={Secret}&issuer={Issuer}
        var issuer = "BioPlatform";
        var authenticatorUri = $"otpauth://totp/{issuer}:{user.Email}?secret={base32Secret}&issuer={issuer}";

        return new TwoFactorSetupResponseDTO(base32Secret, authenticatorUri);
    }

    /// <summary>
    /// Validates the first code and enables 2FA for the user.
    /// </summary>
    public async Task<bool> VerifyTwoFactorAsync(Guid userId, TwoFactorVerifyRequestDTO request)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || string.IsNullOrEmpty(user.TwoFactorSecret))
        {
            return false;
        }

        var key = Base32Encoding.ToBytes(user.TwoFactorSecret);
        var totp = new Totp(key);

        // Verify the code (allows for a small time window drift of 1 cycle)
        var isValid = totp.VerifyTotp(request.Code, out long timeStepMatched, VerificationWindow.RfcSpecifiedNetworkDelay);

        if (isValid)
        {
            user.EnableTwoFactor();
            await _unitOfWork.SaveChangesAsync();
        }

        return isValid;
    }

    /// <summary>
    /// Disables 2FA for the user.
    /// </summary>
    public async Task DisableTwoFactorAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user != null)
        {
            user.DisableTwoFactor();
            await _unitOfWork.SaveChangesAsync();
        }
    }
}