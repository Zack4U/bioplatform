using Bio.API.Controllers;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Domain.Exceptions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="AuthController"/> class, organized by endpoint.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IAuthService"/>.
/// </summary>
public class AuthControllerTests
{
    /// <summary>
    /// Mock of the authentication service used by the controller under test.
    /// </summary>
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly AuthController _authController;

    /// <summary>
    /// Initializes a new instance of the <see cref="AuthControllerTests"/> class.
    /// </summary>
    public AuthControllerTests()
    {
        _authServiceMock = new Mock<IAuthService>();
        _authController = new AuthController(_authServiceMock.Object);
    }

    /// <summary>
    /// Tests for the <see cref="AuthController.Login"/> endpoint.
    /// </summary>
    public class Login : AuthControllerTests
    {
        /// <summary>
        /// Verifies that valid credentials return a 200 OK response with the authentication tokens.
        /// </summary>
        [Fact]
        public async Task ValidCredentials_ShouldReturnOkWithTokens()
        {
            // Arrange
            var request = new LoginRequestDTO("user@test.com", "Pass123!");
            var response = new AuthResponseDTO("access-token", "refresh-token", DateTime.UtcNow.AddMinutes(15));

            _authServiceMock.Setup(s => s.LoginAsync(request))
                .ReturnsAsync(response);

            // Act
            var result = await _authController.Login(request);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
            okResult.Value.Should().Be(response);
        }

        /// <summary>
        /// Verifies that a login attempt for a non-existent user causes the service exception to propagate.
        /// </summary>
        [Fact]
        public async Task NonExistentUser_ShouldThrowAuthenticationException()
        {
            // Arrange
            var request = new LoginRequestDTO("ghost@test.com", "Pass123!");

            _authServiceMock.Setup(s => s.LoginAsync(request))
                .ThrowsAsync(new UnauthorizedException("User not found."));

            // Act
            var act = async () => await _authController.Login(request);

            // Assert
            await act.Should()
                .ThrowAsync<UnauthorizedException>()
                .WithMessage("User not found.");
        }

        /// <summary>
        /// Verifies that a login attempt with an existing user but incorrect password
        /// causes the service exception to propagate.
        /// </summary>
        [Fact]
        public async Task ExistingUserWrongPassword_ShouldThrowAuthenticationException()
        {
            // Arrange
            // The email belongs to a real account, but the password does not match.
            var request = new LoginRequestDTO("user@test.com", "IncorrectPass!");

            _authServiceMock.Setup(s => s.LoginAsync(request))
                .ThrowsAsync(new UnauthorizedException("Invalid password."));

            // Act
            var act = async () => await _authController.Login(request);

            // Assert
            await act.Should()
                .ThrowAsync<UnauthorizedException>()
                .WithMessage("Invalid password.");
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthController.Refresh"/> endpoint.
    /// </summary>
    public class Refresh : AuthControllerTests
    {
        /// <summary>
        /// Verifies that a valid refresh token returns a 200 OK response with a new token pair.
        /// </summary>
        [Fact]
        public async Task ValidTokens_ShouldReturnOkWithNewTokens()
        {
            // Arrange
            var request = new RefreshRequestDTO("old-access-token", "valid-refresh-token");
            var response = new AuthResponseDTO("new-access-token", "new-refresh-token", DateTime.UtcNow.AddMinutes(15));

            _authServiceMock.Setup(s => s.RefreshTokenAsync(request.RefreshToken, request.AccessToken))
                .ReturnsAsync(response);

            // Act
            var result = await _authController.Refresh(request);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.StatusCode.Should().Be(StatusCodes.Status200OK);
            okResult.Value.Should().Be(response);
        }

        /// <summary>
        /// Verifies that an invalid or expired refresh token causes the service exception to propagate.
        /// </summary>
        [Fact]
        public async Task InvalidRefreshToken_ShouldThrowSecurityException()
        {
            // Arrange
            var request = new RefreshRequestDTO("old-access-token", "invalid-refresh-token");

            _authServiceMock.Setup(s => s.RefreshTokenAsync(request.RefreshToken, request.AccessToken))
                .ThrowsAsync(new UnauthorizedException("Invalid or expired refresh token."));

            // Act
            var act = async () => await _authController.Refresh(request);

            // Assert
            await act.Should()
                .ThrowAsync<UnauthorizedException>()
                .WithMessage("Invalid or expired refresh token.");
        }

        /// <summary>
        /// Verifies that a revoked refresh token causes the service exception to propagate.
        /// </summary>
        [Fact]
        public async Task RevokedRefreshToken_ShouldThrowSecurityException()
        {
            // Arrange
            var request = new RefreshRequestDTO("old-access-token", "revoked-refresh-token");

            _authServiceMock.Setup(s => s.RefreshTokenAsync(request.RefreshToken, request.AccessToken))
                .ThrowsAsync(new UnauthorizedException("Refresh token has been revoked."));

            // Act
            var act = async () => await _authController.Refresh(request);

            // Assert
            await act.Should()
                .ThrowAsync<UnauthorizedException>()
                .WithMessage("Refresh token has been revoked.");
        }
    }

    /// <summary>
    /// Tests for the <see cref="AuthController.Revoke"/> endpoint.
    /// </summary>
    public class Revoke : AuthControllerTests
    {
        /// <summary>
        /// Verifies that a valid refresh token is revoked and returns a 204 No Content response.
        /// </summary>
        [Fact]
        public async Task ValidToken_ShouldReturnNoContent()
        {
            // Arrange
            var refreshToken = "valid-refresh-token";

            _authServiceMock.Setup(s => s.RevokeTokenAsync(refreshToken))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _authController.Revoke(refreshToken);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that an invalid or non-existent refresh token causes the service exception to propagate.
        /// </summary>
        [Fact]
        public async Task InvalidToken_ShouldThrowSecurityException()
        {
            // Arrange
            var refreshToken = "non-existent-token";

            _authServiceMock.Setup(s => s.RevokeTokenAsync(refreshToken))
                .ThrowsAsync(new UnauthorizedException("Refresh token not found."));

            // Act
            var act = async () => await _authController.Revoke(refreshToken);

            // Assert
            await act.Should()
                .ThrowAsync<UnauthorizedException>()
                .WithMessage("Refresh token not found.");
        }

        /// <summary>
        /// Verifies that revoking an already-revoked token causes the service exception to propagate.
        /// </summary>
        [Fact]
        public async Task AlreadyRevokedToken_ShouldThrowSecurityException()
        {
            // Arrange
            var refreshToken = "already-revoked-token";

            _authServiceMock.Setup(s => s.RevokeTokenAsync(refreshToken))
                .ThrowsAsync(new UnauthorizedException("Refresh token has already been revoked."));

            // Act
            var act = async () => await _authController.Revoke(refreshToken);

            // Assert
            await act.Should()
                .ThrowAsync<UnauthorizedException>()
                .WithMessage("Refresh token has already been revoked.");
        }
    }
}
