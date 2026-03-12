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
/// Verifies authentication logic, token management, password changes, and 2FA flows.
/// </summary>
public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IRefreshTokenRepository> _refreshTokenRepositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IOptions<JwtSettings>> _jwtSettingsMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly JwtSettings _jwtSettings;
    private readonly AuthService _authService;

    public AuthServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _refreshTokenRepositoryMock = new Mock<IRefreshTokenRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _tokenServiceMock = new Mock<ITokenService>();
        _jwtSettingsMock = new Mock<IOptions<JwtSettings>>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();

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
            _unitOfWorkMock.Object,
            _jwtSettingsMock.Object);
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.LoginAsync"/> method focusing on standard authentication.
    /// </summary>
    public class LoginAsync : AuthServiceTests
    {
        /// <summary>
        /// Verifies that a valid login request returns an <see cref="AuthResponseDTO"/> with access and refresh tokens.
        /// </summary>
        [Fact]
        public async Task ValidCredentials_ShouldReturnAuthResponse()
        {
            // Arrange
            var request = new LoginRequestDTO("test@example.com", "Password123!");
            var user = new User(Guid.NewGuid(), "Test User", request.Email, "hash", "salt");
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
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Once);
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
        /// Verifies that a valid refresh token request returns a new set of tokens and revokes the old refresh token.
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
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Once);
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
                .ReturnsAsync((User?)null);

            // Act
            var act = async () => await _authService.RefreshTokenAsync(refreshToken, accessToken);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedException>()
                .WithMessage("Invalid refresh token.");
        }

        /// <summary>
        /// Verifies that an inactive (already revoked or expired) refresh token throws an <see cref="UnauthorizedException"/>.
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
            storedToken.Revoke();

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
        /// Verifies that an active refresh token is correctly revoked.
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
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Once);
        }

        /// <summary>
        /// Verifies that trying to revoke a non-existent token does not cause errors or side effects.
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
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Never);
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.ChangePasswordAsync"/> method.
    /// </summary>
    public class ChangePasswordAsync : AuthServiceTests
    {
        /// <summary>
        /// Verifies that a valid password change request updates the user's hash and salt.
        /// </summary>
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
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Once);
        }

        /// <summary>
        /// Verifies that attempting to change password for a non-existent user throws a <see cref="NotFoundException"/>.
        /// </summary>
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

        /// <summary>
        /// Verifies that providing an incorrect current password throws an <see cref="UnauthorizedException"/>.
        /// </summary>
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

    /// <summary>
    /// Tests for the <see cref="AuthService.LoginAsync"/> method specifically when 2FA is enabled.
    /// </summary>
    public class LoginAsyncWith2FA : AuthServiceTests
    {
        /// <summary>
        /// Verifies that when 2FA is enabled, LoginAsync returns a challenge response instead of access tokens.
        /// </summary>
        [Fact]
        public async Task Enabled2FA_ShouldReturnTwoFactorRequired()
        {
            // Arrange
            var request = new LoginRequestDTO("test@example.com", "Password123!");
            var user = new User(Guid.NewGuid(), "Test User", request.Email, "hash", "salt");
            user.SetTwoFactorSecret("SECRET");
            user.EnableTwoFactor();

            _userRepositoryMock.Setup(r => r.GetByEmailAsync(request.Email))
                .ReturnsAsync(user);
            _passwordHasherMock.Setup(h => h.VerifyPassword(request.Password, user.PasswordHash, user.Salt))
                .Returns(true);
            _userRoleRepositoryMock.Setup(r => r.GetByUserIdWithDetailsAsync(user.Id))
                .ReturnsAsync(new List<UserRoleDetail> { new UserRoleDetail { RoleName = "USER" } });
            _tokenServiceMock.Setup(s => s.GenerateTwoFactorToken(user))
                .Returns("temp_2fa_token");

            // Act
            var result = await _authService.LoginAsync(request);

            // Assert
            result.TwoFactorRequired.Should().BeTrue();
            result.TwoFactorToken.Should().Be("temp_2fa_token");
            result.AccessToken.Should().BeNull();
            _tokenServiceMock.Verify(s => s.GenerateAccessToken(It.IsAny<User>(), It.IsAny<IEnumerable<string>>()), Times.Never);
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.SetupTwoFactorAsync"/> method.
    /// </summary>
    public class SetupTwoFactorAsync : AuthServiceTests
    {
        /// <summary>
        /// Verifies that the setup result contains a non-empty shared key.
        /// </summary>
        [Fact]
        public async Task ValidUser_ShouldReturnSharedKey()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "h", "s");
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            var result = await _authService.SetupTwoFactorAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result.SharedKey.Should().NotBeNullOrEmpty();
        }

        /// <summary>
        /// Verifies that the setup result contains an OTP URI with the user's email.
        /// </summary>
        [Fact]
        public async Task ValidUser_ShouldReturnAuthenticatorUri()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "h", "s");
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            var result = await _authService.SetupTwoFactorAsync(userId);

            // Assert
            result.AuthenticatorUri.Should().NotBeNullOrEmpty();
            result.AuthenticatorUri.Should().Contain(user.Email);
        }

        /// <summary>
        /// Verifies that the setup persists the generated secret to the database.
        /// </summary>
        [Fact]
        public async Task ValidUser_ShouldPersistSecret()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "h", "s");
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            await _authService.SetupTwoFactorAsync(userId);

            // Assert
            user.TwoFactorSecret.Should().NotBeNullOrEmpty();
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.VerifyTwoFactorAsync"/> method.
    /// </summary>
    public class VerifyTwoFactorAsync : AuthServiceTests
    {
        /// <summary>
        /// Verifies that providing a correct TOTP code successfully enables 2FA for the user.
        /// </summary>
        [Fact]
        public async Task ValidCode_ShouldEnable2FA()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "h", "s");
            // Generate a real valid code for the test using OtpNet
            var key = OtpNet.KeyGeneration.GenerateRandomKey(20);
            var base32Secret = OtpNet.Base32Encoding.ToString(key);
            user.SetTwoFactorSecret(base32Secret);

            var totp = new OtpNet.Totp(key);
            var validCode = totp.ComputeTotp();

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            var result = await _authService.VerifyTwoFactorAsync(userId, new TwoFactorVerifyRequestDTO { Code = validCode });

            // Assert
            result.Should().BeTrue();
            user.TwoFactorEnabled.Should().BeTrue();
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        /// <summary>
        /// Verifies that providing an incorrect TOTP code does not enable 2FA.
        /// </summary>
        [Fact]
        public async Task InvalidCode_ShouldNotEnable2FA()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "h", "s");
            user.SetTwoFactorSecret("JBSWY3DPEHPK3PXP");
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            var result = await _authService.VerifyTwoFactorAsync(userId, new TwoFactorVerifyRequestDTO { Code = "000000" });

            // Assert
            result.Should().BeFalse();
            user.TwoFactorEnabled.Should().BeFalse();
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.LoginTwoFactorAsync"/> method.
    /// </summary>
    public class LoginTwoFactorAsync : AuthServiceTests
    {
        private (System.Security.Claims.ClaimsPrincipal Claims, User User, OtpNet.Totp Totp) BuildValidScenario()
        {
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "h", "s");
            var key = OtpNet.KeyGeneration.GenerateRandomKey(20);
            user.SetTwoFactorSecret(OtpNet.Base32Encoding.ToString(key));
            user.EnableTwoFactor();

            var claims = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(new[]
            {
                new System.Security.Claims.Claim(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub, userId.ToString()),
                new System.Security.Claims.Claim("2fa_pending", "true")
            }));

            _tokenServiceMock.Setup(s => s.GetPrincipalFromExpiredToken("temp_token")).Returns(claims);
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _userRoleRepositoryMock.Setup(r => r.GetByUserIdWithDetailsAsync(userId))
                .ReturnsAsync(new List<UserRoleDetail> { new UserRoleDetail { RoleName = "USER" } });
            _tokenServiceMock.Setup(s => s.GenerateAccessToken(user, It.IsAny<IEnumerable<string>>())).Returns("access");
            _tokenServiceMock.Setup(s => s.GenerateRefreshToken()).Returns("refresh");

            return (claims, user, new OtpNet.Totp(key));
        }

        /// <summary>
        /// Verifies that a valid 2FA confirmation returns a non-null access token.
        /// </summary>
        [Fact]
        public async Task ValidTokenAndCode_ShouldReturnAccessToken()
        {
            // Arrange
            var (_, _, totp) = BuildValidScenario();
            var validCode = totp.ComputeTotp();

            // Act
            var result = await _authService.LoginTwoFactorAsync(new TwoFactorLoginRequestDTO { TwoFactorToken = "temp_token", Code = validCode });

            // Assert
            result.AccessToken.Should().Be("access");
        }

        /// <summary>
        /// Verifies that a valid 2FA confirmation returns a non-null refresh token.
        /// </summary>
        [Fact]
        public async Task ValidTokenAndCode_ShouldReturnRefreshToken()
        {
            // Arrange
            var (_, _, totp) = BuildValidScenario();
            var validCode = totp.ComputeTotp();

            // Act
            var result = await _authService.LoginTwoFactorAsync(new TwoFactorLoginRequestDTO { TwoFactorToken = "temp_token", Code = validCode });

            // Assert
            result.RefreshToken.Should().Be("refresh");
        }

        /// <summary>
        /// Verifies that a successful 2FA confirmation persists the new refresh token to the database.
        /// </summary>
        [Fact]
        public async Task ValidTokenAndCode_ShouldPersistRefreshToken()
        {
            // Arrange
            var (_, _, totp) = BuildValidScenario();
            var validCode = totp.ComputeTotp();

            // Act
            await _authService.LoginTwoFactorAsync(new TwoFactorLoginRequestDTO { TwoFactorToken = "temp_token", Code = validCode });

            // Assert
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthService.DisableTwoFactorAsync"/> method.
    /// </summary>
    public class DisableTwoFactorAsync : AuthServiceTests
    {
        /// <summary>
        /// Verifies that 2FA can be successfully disabled for a user.
        /// </summary>
        [Fact]
        public async Task ValidUser_ShouldDisable2FA()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Test User", "test@example.com", "h", "s");
            user.SetTwoFactorSecret("SECRET");
            user.EnableTwoFactor();
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            await _authService.DisableTwoFactorAsync(userId);

            // Assert
            user.TwoFactorEnabled.Should().BeFalse();
            user.TwoFactorSecret.Should().BeNull();
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
