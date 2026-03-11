using Bio.Application.Common.Models;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Microsoft.Extensions.Options;

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

        var accessToken = _tokenService.GenerateAccessToken(user, roles);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken(
            user.Id,
            refreshToken,
            DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpiryDays));

        await _refreshTokenRepository.AddAsync(refreshTokenEntity);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDTO(
            accessToken,
            refreshToken,
            DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes));
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
}