using Bio.Application.Common.Models;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Application.Services;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Bio.Domain.ReadModels;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Services;

/// <summary>
/// Unit tests for the <see cref="AuthService"/> class.
/// </summary>
public class AuthServiceTests
{
    /// <summary>
    /// Mocks for the <see cref="AuthService"/> class.
    /// </summary>
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IOptions<JwtSettings>> _jwtSettingsMock;
    private readonly JwtSettings _jwtSettings;
    private readonly AuthService _authService;

    /// <summary>
    /// Initializes a new instance of the <see cref="AuthServiceTests"/> class.
    /// </summary>
    public AuthServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _refreshTokenRepositoryMock = new Mock<IRefreshTokenRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _tokenServiceMock = new Mock<ITokenService>();
        _jwtSettingsMock = new Mock<IOptions<JwtSettings>>();

        _jwtSettings = new JwtSettings
        {
            Secret = "SuperSecretKey12345678901234567890",
            ExpiryMinutes = 60,
            RefreshTokenExpiryDays = 7,
            Issuer = "TestIssuer",
            Audience = "TestAudience"
        };

        _jwtSettingsMock.Setup(s => s.Value).Returns(_jwtSettings);

        _authService = new AuthService(
            _userRepositoryMock.Object,
            _userRoleRepositoryMock.Object,
            _refreshTokenRepositoryMock.Object,
            _passwordHasherMock.Object,
            _tokenServiceMock.Object,
            _jwtSettingsMock.Object);
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.LoginAsync"/> method.
    /// </summary>
    public class LoginAsync : AuthServiceTests
    {
        /// <summary>
        /// Verifies that a valid login request returns an <see cref="AuthResponseDTO"/>.
        /// </summary>
        [Fact]
        public async Task ValidCredentials_ShouldReturnAuthResponse()
        {
            // Arrange
            var request = new LoginRequestDTO("test@example.com", "Password123!");
            var user = new User(Guid.NewGuid(), "Test User", request.Email, "hash", "salt");
            var roles = new List<string> { "USER" };
            var accessToken = "access_token";
            var refreshToken = "refresh_token";

            _userRepositoryMock.Setup(r => r.GetByEmailAsync(request.Email))
                .ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.VerifyPassword(request.Password, user.PasswordHash, user.Salt))
                .Returns(true);
            _userRoleRepositoryMock.Setup(r => r.GetByUserIdWithDetailsAsync(user.Id))
                .ReturnsAsync(new List<UserRoleDetail> { new UserRoleDetail { RoleName = "USER" } });
            _tokenServiceMock.Setup(s => s.GenerateAccessToken(user, It.IsAny<IEnumerable<string>>()))
                .Returns(accessToken);
            _tokenServiceMock.Setup(s => s.GenerateRefreshToken())
                .Returns(refreshToken);

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be(accessToken);
            result.RefreshToken.Should().Be(refreshToken);
            _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.Is<RefreshToken>(rt => rt.UserId == user.Id && rt.Token == refreshToken)), Times.Once);
            _refreshTokenRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that an invalid email throws an <see cref="UnauthorizedException"/>.
        /// </summary>
        [Fact]
        public async Task InvalidEmail_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var request = new LoginRequestDTO("wrong@example.com", "Password123!");
            _userRepositoryMock.Setup(r => r.GetByEmailAsync(request.Email))
                .ReturnsAsync((User?)null);

            // Act
            var act = async () => await _authService.LoginAsync(request);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Invalid email or password.");
        }

        /// <summary>
        /// Verifies that an invalid password throws an <see cref="UnauthorizedException"/>.
        /// </summary>
        [Fact]
        public async Task InvalidPassword_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var request = new LoginRequestDTO("test@example.com", "WrongPassword!");
            var user = new User(Guid.NewGuid(), "Test User", request.Email, "hash", "salt");

            _userRepositoryMock.Setup(r => r.GetByEmailAsync(request.Email))
                .ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.VerifyPassword(request.Password, user.PasswordHash, user.Salt))
                .Returns(false);

            // Act
            var act = async () => await _authService.LoginAsync(request);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Invalid email or password.");
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.RefreshTokenAsync"/> method.
    /// </summary>
    public class RefreshTokenAsync : AuthServiceTests
    {
        /// <summary>
        /// Verifies that a valid refresh token request returns a new <see cref="AuthResponseDTO"/>.
        /// </summary>
        [Fact]
        public async Task ValidToken_ShouldReturnNewAuthResponse()
        {
            // Arrange
            var refreshToken = "old_refresh_token";
            var accessToken = "old_access_token";
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "hash", "salt");
            var storedToken = new RefreshToken(userId, refreshToken, DateTime.UtcNow.AddDays(1));
            var newAccessToken = "new_access_token";
            var newRefreshToken = "new_refresh_token";

            _tokenServiceMock.Setup(s => s.GetUserIdFromToken(accessToken))
                .Returns(userId);
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId))
                .ReturnsAsync(user);
            _refreshTokenRepositoryMock.Setup(r => r.GetByTokenAsync(refreshToken, userId))
                .ReturnsAsync(storedToken);
            _userRoleRepositoryMock.Setup(r => r.GetByUserIdWithDetailsAsync(userId))
                .ReturnsAsync(new List<UserRoleDetail> { new UserRoleDetail { RoleName = "USER" } });
            _tokenServiceMock.Setup(s => s.GenerateAccessToken(user, It.IsAny<IEnumerable<string>>()))
                .Returns(newAccessToken);
            _tokenServiceMock.Setup(s => s.GenerateRefreshToken())
                .Returns(newRefreshToken);

            // Act
            var result = await _authService.RefreshTokenAsync(refreshToken, accessToken);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be(newAccessToken);
            result.RefreshToken.Should().Be(newRefreshToken);
            storedToken.IsActive.Should().BeFalse();
            _refreshTokenRepositoryMock.Verify(r => r.UpdateAsync(storedToken), Times.Once);
            _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.Is<RefreshToken>(rt => rt.Token == newRefreshToken)), Times.Once);
            _refreshTokenRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that an invalid refresh token throws an <see cref="UnauthorizedException"/>.
        /// </summary>
        [Fact]
        public async Task InvalidToken_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var refreshToken = "invalid_token";
            var accessToken = "access_token";
            var userId = Guid.NewGuid();

            _tokenServiceMock.Setup(s => s.GetUserIdFromToken(accessToken))
                .Returns(userId);
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId))
                .ReturnsAsync((User?)null); // User not found

            // Act
            var act = async () => await _authService.RefreshTokenAsync(refreshToken, accessToken);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Invalid refresh token.");
        }

        /// <summary>
        /// Verifies that an inactive refresh token throws an <see cref="UnauthorizedException"/>.
        /// </summary>
        [Fact]
        public async Task InactiveToken_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var refreshToken = "inactive_token";
            var accessToken = "access_token";
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "hash", "salt");
            var storedToken = new RefreshToken(userId, refreshToken, DateTime.UtcNow.AddDays(1));
            storedToken.Revoke(); // Now IsActive is false

            _tokenServiceMock.Setup(s => s.GetUserIdFromToken(accessToken))
                .Returns(userId);
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId))
                .ReturnsAsync(user);
            _refreshTokenRepositoryMock.Setup(r => r.GetByTokenAsync(refreshToken, userId))
                .ReturnsAsync(storedToken);

            // Act
            var act = async () => await _authService.RefreshTokenAsync(refreshToken, accessToken);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Invalid refresh token.");
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.RevokeTokenAsync"/> method.
    /// </summary>
    public class RevokeTokenAsync : AuthServiceTests
    {
        /// <summary>
        /// Verifies that an active refresh token is successfully revoked.
        /// </summary>
        [Fact]
        public async Task ActiveToken_ShouldRevoke()
        {
            // Arrange
            var token = "active_token";
            var storedToken = new RefreshToken(Guid.NewGuid(), token, DateTime.UtcNow.AddDays(1));
            _refreshTokenRepositoryMock.Setup(r => r.GetByTokenAsync(token))
                .ReturnsAsync(storedToken);

            // Act
            await _authService.RevokeTokenAsync(token);

            // Assert
            storedToken.IsActive.Should().BeFalse();
            _refreshTokenRepositoryMock.Verify(r => r.UpdateAsync(storedToken), Times.Once);
            _refreshTokenRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that revoking a non-existent token does nothing.
        /// </summary>
        [Fact]
        public async Task NonExistentToken_ShouldDoNothing()
        {
            // Arrange
            var token = "mystery_token";
            _refreshTokenRepositoryMock.Setup(r => r.GetByTokenAsync(token))
                .ReturnsAsync((RefreshToken?)null);

            // Act
            await _authService.RevokeTokenAsync(token);

            // Assert
            _refreshTokenRepositoryMock.Verify(r => r.UpdateAsync(It.IsAny<RefreshToken>()), Times.Never);
            _refreshTokenRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.ChangePasswordAsync"/> method.
    /// </summary>
    public class ChangePasswordAsync : AuthServiceTests
    {
        [Fact]
        public async Task ValidRequest_ShouldChangePassword()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "oldHash", "oldSalt");
            var request = new ChangePasswordRequestDTO("OldPassword123!", "NewPassword123!", "NewPassword123!");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId))
                .ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.VerifyPassword(request.CurrentPassword, user.PasswordHash, user.Salt))
                .Returns(true);
            _passwordHasherMock.Setup(h => h.HashPassword(request.NewPassword))
                .Returns(("newHash", "newSalt"));

            // Act
            await _authService.ChangePasswordAsync(userId, request);

            // Assert
            user.PasswordHash.Should().Be("newHash");
            user.Salt.Should().Be("newSalt");
            _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        [Fact]
        public async Task UserNotFound_ShouldThrowNotFoundException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var request = new ChangePasswordRequestDTO("OldPassword123!", "NewPassword123!", "NewPassword123!");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId))
                .ReturnsAsync((User?)null);

            // Act
            var act = async () => await _authService.ChangePasswordAsync(userId, request);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"User with ID {userId} not found.");
        }

        [Fact]
        public async Task WrongCurrentPassword_ShouldThrowUnauthorizedException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "oldHash", "oldSalt");
            var request = new ChangePasswordRequestDTO("WrongPassword!", "NewPassword123!", "NewPassword123!");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId))
                .ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.VerifyPassword(request.CurrentPassword, user.PasswordHash, user.Salt))
                .Returns(false);

            // Act
            var act = async () => await _authService.ChangePasswordAsync(userId, request);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Invalid current password.");
        }
    }
}
