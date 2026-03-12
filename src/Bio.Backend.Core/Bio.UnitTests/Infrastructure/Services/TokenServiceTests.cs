using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Bio.Application.Common.Models;
using Bio.Backend.Core.Bio.Infrastructure.Services;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Services;

/// <summary>
/// Unit tests for the <see cref="TokenService"/> class.
/// Tests the generation and validation of JWT and refresh tokens.
/// </summary>
public class TokenServiceTests
{
    private readonly JwtSettings _jwtSettings;
    private readonly TokenService _tokenService;

    /// <summary>
    /// Initializes a new instance of the <see cref="TokenServiceTests"/> class.
    /// Sets up the JWT settings and the TokenService instance for testing.
    /// </summary>
    public TokenServiceTests()
    {
        // Prevent default claim mapping so standard JWT claim names (like 'sub') are preserved.
        JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

        _jwtSettings = new JwtSettings
        {
            Secret = "super_secret_key_that_is_long_enough_for_hmacsha256_which_requires_at_least_256_bits",
            Issuer = "TestIssuer",
            Audience = "TestAudience",
            ExpiryMinutes = 60,
            RefreshTokenExpiryDays = 7
        };

        var options = Options.Create(_jwtSettings);
        _tokenService = new TokenService(options);
    }

    /// <summary>
    /// Tests for the GenerateAccessToken method.
    /// </summary>
    public class GenerateAccessToken : TokenServiceTests
    {
        /// <summary>
        /// Tests that a valid JWT access token is generated with correct claims.
        /// </summary>
        [Fact]
        public void ShouldGenerateValidJwtToken()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "John Doe", "john@example.com", "hash", "salt");
            var roles = new List<string> { "Admin", "User" };

            // Act
            var tokenString = _tokenService.GenerateAccessToken(user, roles);

            // Assert
            tokenString.Should().NotBeNullOrWhiteSpace();

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(tokenString);

            jwtToken.Issuer.Should().Be(_jwtSettings.Issuer);
            jwtToken.Audiences.Should().Contain(_jwtSettings.Audience);

            var claims = jwtToken.Claims.ToList();
            claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id.ToString());
            claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Email && c.Value == user.Email);
            claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == user.FullName);
            claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "Admin");
            claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "User");
        }
    }

    /// <summary>
    /// Tests for the GenerateRefreshToken method.
    /// </summary>
    public class GenerateRefreshToken : TokenServiceTests
    {
        /// <summary>
        /// Tests that a generated refresh token is not null or whitespace.
        /// </summary>
        [Fact]
        public void ShouldNotBeNullOrWhiteSpace()
        {
            // Act
            var refreshToken = _tokenService.GenerateRefreshToken();

            // Assert
            refreshToken.Should().NotBeNullOrWhiteSpace();
        }

        /// <summary>
        /// Tests that a generated refresh token is a valid base64 encoded string.
        /// </summary>
        [Fact]
        public void ShouldBeValidBase64()
        {
            // Act
            var refreshToken = _tokenService.GenerateRefreshToken();

            // Assert
            Action act = () => Convert.FromBase64String(refreshToken);
            act.Should().NotThrow();
        }
    }

    /// <summary>
    /// Tests for the GetPrincipalFromExpiredToken method.
    /// </summary>
    public class GetPrincipalFromExpiredToken : TokenServiceTests
    {
        /// <summary>
        /// Tests that a valid principal is returned from an expired token.
        /// </summary>
        [Fact]
        public void ShouldReturnPrincipal_WhenTokenIsValidButExpired()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "Jane Doe", "jane@example.com", "hash", "salt");

            // To create an expired token for testing, we can use a service instance with a negative ExpiryMinutes
            var settings = new JwtSettings
            {
                Secret = _jwtSettings.Secret,
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                ExpiryMinutes = -10 // Expired 10 minutes ago
            };

            var expiredTokenService = new TokenService(Options.Create(settings));
            var expiredToken = expiredTokenService.GenerateAccessToken(user, new List<string> { "User" });

            // Act
            var principal = _tokenService.GetPrincipalFromExpiredToken(expiredToken);

            // Assert
            principal.Should().NotBeNull();
            principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value.Should().Be(user.Id.ToString());
            principal.FindFirst(ClaimTypes.Role)?.Value.Should().Be("User");
        }

        /// <summary>
        /// Tests that a SecurityTokenException is thrown when the token has an invalid signature.
        /// </summary>
        [Fact]
        public void ShouldThrowException_WhenTokenHasInvalidSignature()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "Jane Doe", "jane@example.com", "hash", "salt");

            // Create a token with a different secret
            var settingsWithDifferentSecret = new JwtSettings
            {
                Secret = "another_secret_key_that_is_long_enough_for_hmacsha256_which_requires_at_least_256_bits",
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                ExpiryMinutes = 60
            };
            var otherService = new TokenService(Options.Create(settingsWithDifferentSecret));
            var invalidToken = otherService.GenerateAccessToken(user, new List<string>());

            // Act & Assert
            Action act = () => _tokenService.GetPrincipalFromExpiredToken(invalidToken);
            act.Should().Throw<SecurityTokenException>();
        }

        /// <summary>
        /// Tests that a SecurityTokenException (or similar) is thrown when the token is a malformed string.
        /// </summary>
        [Fact]
        public void ShouldThrowException_WhenTokenIsMalformed()
        {
            // Arrange
            var malformedToken = "not.a.jwt.token";

            // Act & Assert
            Action act = () => _tokenService.GetPrincipalFromExpiredToken(malformedToken);
            act.Should().Throw<Exception>(); // Usually ArgumentException or SecurityTokenMalformedException
        }

        /// <summary>
        /// Tests that an UnauthorizedException is thrown when the token uses an incorrect algorithm.
        /// </summary>
        [Fact]
        public void ShouldThrowUnauthorizedException_WhenAlgorithmIsIncorrect()
        {
            // Arrange
            var claims = new List<Claim> { new Claim(JwtRegisteredClaimNames.Sub, Guid.NewGuid().ToString()) };
            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_jwtSettings.Secret));

            // Generate token with HmacSha512 instead of HmacSha256
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(10),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Act & Assert
            Action act = () => _tokenService.GetPrincipalFromExpiredToken(tokenString);
            act.Should().Throw<UnauthorizedException>().WithMessage("Invalid token");
        }

        /// <summary>
        /// Tests that an ArgumentException or ArgumentNullException is thrown when the token is null.
        /// </summary>
        [Fact]
        public void ShouldThrowException_WhenTokenIsNull()
        {
            // Act & Assert
            Action act = () => _tokenService.GetPrincipalFromExpiredToken(null!);
            act.Should().Throw<ArgumentException>();
        }

        /// <summary>
        /// Tests that an ArgumentException is thrown when the token is empty or whitespace.
        /// </summary>
        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public void ShouldThrowException_WhenTokenIsEmptyOrWhitespace(string token)
        {
            // Act & Assert
            Action act = () => _tokenService.GetPrincipalFromExpiredToken(token);
            act.Should().Throw<ArgumentException>();
        }
    }

    /// <summary>
    /// Tests for the GetUserIdFromToken method.
    /// </summary>
    public class GetUserIdFromToken : TokenServiceTests
    {
        /// <summary>
        /// Tests that the correct user ID is extracted from a valid expired token.
        /// </summary>
        [Fact]
        public void ShouldExtractUserId_WhenValidExpiredToken()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Jane Doe", "jane@example.com", "hash", "salt");

            var expiredTokenService = new TokenService(Options.Create(new JwtSettings
            {
                Secret = _jwtSettings.Secret,
                Issuer = _jwtSettings.Issuer,
                Audience = _jwtSettings.Audience,
                ExpiryMinutes = -5
            }));
            var token = expiredTokenService.GenerateAccessToken(user, new List<string>());

            // Act
            var extractedId = _tokenService.GetUserIdFromToken(token);

            // Assert
            extractedId.Should().Be(userId);
        }

        /// <summary>
        /// Tests that an UnauthorizedException is thrown if the token lacks a user ID claim.
        /// </summary>
        [Fact]
        public void ShouldThrowUnauthorizedException_WhenUserIdClaimIsMissing()
        {
            // Arrange
            var claims = new List<Claim> { new Claim(ClaimTypes.Name, "TestUserWithoutId") };
            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_jwtSettings.Secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(10),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // Act & Assert
            Action act = () => _tokenService.GetUserIdFromToken(tokenString);
            act.Should().Throw<UnauthorizedException>().WithMessage("Invalid token: User ID not found.");
        }

        /// <summary>
        /// Tests that an ArgumentException or ArgumentNullException is thrown when the token is null.
        /// </summary>
        [Fact]
        public void ShouldThrowException_WhenTokenIsNull()
        {
            // Act & Assert
            Action act = () => _tokenService.GetUserIdFromToken(null!);
            act.Should().Throw<ArgumentException>();
        }

        /// <summary>
        /// Tests that an ArgumentException is thrown when the token is empty or whitespace.
        /// </summary>
        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public void ShouldThrowException_WhenTokenIsEmptyOrWhitespace(string token)
        {
            // Act & Assert
            Action act = () => _tokenService.GetUserIdFromToken(token);
            act.Should().Throw<ArgumentException>();
        }
    }

    /// <summary>
    /// Tests for the GenerateTwoFactorToken method.
    /// </summary>
    public class GenerateTwoFactorToken : TokenServiceTests
    {
        /// <summary>
        /// Verifies that the generated 2FA token contains the correct user ID claim.
        /// </summary>
        [Fact]
        public void ShouldGenerateValidTwoFactorToken()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "John Doe", "john@example.com", "h", "s");

            // Act
            var tokenString = _tokenService.GenerateTwoFactorToken(user);

            // Assert
            tokenString.Should().NotBeNullOrWhiteSpace();

            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(tokenString);

            jwtToken.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == user.Id.ToString());
            jwtToken.Claims.Should().Contain(c => c.Type == "2fa_pending" && c.Value == "true");
            
            // Should expire in approximately 5 minutes
            jwtToken.ValidTo.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(5), TimeSpan.FromSeconds(5));
        }

        /// <summary>
        /// Verifies that the 2FA token does NOT contain a different user's ID as the subject claim.
        /// </summary>
        [Fact]
        public void ShouldNotContainDifferentUserId()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "John Doe", "john@example.com", "h", "s");
            var differentUserId = Guid.NewGuid().ToString();

            // Act
            var tokenString = _tokenService.GenerateTwoFactorToken(user);
            var jwtToken = new JwtSecurityTokenHandler().ReadJwtToken(tokenString);

            // Assert
            jwtToken.Claims.Should().NotContain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == differentUserId);
        }

        /// <summary>
        /// Verifies that two different users receive tokens with different subject claims.
        /// </summary>
        [Fact]
        public void TwoUsers_ShouldReceiveTokensWithDifferentSubClaims()
        {
            // Arrange
            var userA = new User(Guid.NewGuid(), "Alice", "alice@example.com", "h", "s");
            var userB = new User(Guid.NewGuid(), "Bob", "bob@example.com", "h", "s");

            // Act
            var tokenA = new JwtSecurityTokenHandler().ReadJwtToken(_tokenService.GenerateTwoFactorToken(userA));
            var tokenB = new JwtSecurityTokenHandler().ReadJwtToken(_tokenService.GenerateTwoFactorToken(userB));

            var subA = tokenA.Claims.First(c => c.Type == JwtRegisteredClaimNames.Sub).Value;
            var subB = tokenB.Claims.First(c => c.Type == JwtRegisteredClaimNames.Sub).Value;

            // Assert
            subA.Should().NotBe(subB);
        }

        /// <summary>
        /// Verifies that token is rejected when the sub claim does not match the expected user ID.
        /// </summary>
        [Fact]
        public void GeneratedToken_SubClaimShouldNotMatchArbitraryGuid()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "John Doe", "john@example.com", "h", "s");
            var attackerUserId = Guid.NewGuid();

            // Act
            var tokenString = _tokenService.GenerateTwoFactorToken(user);
            var jwtToken = new JwtSecurityTokenHandler().ReadJwtToken(tokenString);
            var subClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;

            // Assert: the token's sub claim should not match an arbitrary unrelated ID
            var isMatchingAttacker = Guid.TryParse(subClaim, out var parsedId) && parsedId == attackerUserId;
            isMatchingAttacker.Should().BeFalse();
        }
    }
}
