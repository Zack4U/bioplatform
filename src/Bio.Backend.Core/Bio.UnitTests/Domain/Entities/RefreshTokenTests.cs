using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="RefreshToken"/> domain entity.
/// Verifies constructor invariants and domain method behavior.
/// </summary>
public class RefreshTokenTests
{
    /// <summary>
    /// Tests for the initialization of the RefreshToken entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a RefreshToken is initialized with correctly assigned properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var token = "some_random_token_string";
            var expiresAt = DateTime.UtcNow.AddDays(7);

            // Act
            var refreshToken = new RefreshToken(userId, token, expiresAt);

            // Assert
            refreshToken.Id.Should().NotBeEmpty();
            refreshToken.UserId.Should().Be(userId);
            refreshToken.Token.Should().Be(token);
            refreshToken.ExpiresAt.Should().Be(expiresAt);
            refreshToken.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            refreshToken.RevokedAt.Should().BeNull();
            refreshToken.ReplacedByToken.Should().BeNull();
            refreshToken.IsExpired.Should().BeFalse();
            refreshToken.IsRevoked.Should().BeFalse();
            refreshToken.IsActive.Should().BeTrue();
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the user ID is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_UserIdIsEmpty()
        {
            // Arrange
            var userId = Guid.Empty;
            var token = "valid_token";
            var expiresAt = DateTime.UtcNow.AddDays(7);

            // Act
            Action act = () => new RefreshToken(userId, token, expiresAt);

            // Assert
            act.Should().Throw<ArgumentException>()
                .WithMessage("*User ID cannot be empty.*")
                .WithParameterName("userId");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the token string is null, empty, or whitespace.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ShouldThrowException_When_TokenIsInvalid(string? invalidToken)
        {
            // Arrange
            var userId = Guid.NewGuid();
            var expiresAt = DateTime.UtcNow.AddDays(7);

            // Act
            Action act = () => new RefreshToken(userId, invalidToken!, expiresAt);

            // Assert
            act.Should().Throw<ArgumentException>()
                .WithMessage("*Token cannot be null or empty.*")
                .WithParameterName("token");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the expiration date is in the past.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_ExpiresAtIsInThePast()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var token = "valid_token";
            var expiresAt = DateTime.UtcNow.AddDays(-1);

            // Act
            Action act = () => new RefreshToken(userId, token, expiresAt);

            // Assert
            act.Should().Throw<ArgumentException>()
                .WithMessage("*Expiration date must be in the future.*")
                .WithParameterName("expiresAt");
        }
    }

    /// <summary>
    /// Tests for the Revoke domain method.
    /// </summary>
    public class RevokeMethod
    {
        /// <summary>
        /// Verifies that revoking a token sets the RevokedAt timestamp and updates state flags.
        /// </summary>
        [Fact]
        public void ShouldSetRevokedAt_WhenRevoked()
        {
            // Arrange
            var refreshToken = new RefreshToken(Guid.NewGuid(), "token", DateTime.UtcNow.AddDays(1));

            // Act
            refreshToken.Revoke();

            // Assert
            refreshToken.RevokedAt.Should().NotBeNull();
            refreshToken.RevokedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            refreshToken.ReplacedByToken.Should().BeNull();
            refreshToken.IsRevoked.Should().BeTrue();
            refreshToken.IsActive.Should().BeFalse();
        }

        /// <summary>
        /// Verifies that revoking a token sets the ReplacedByToken property if provided.
        /// </summary>
        [Fact]
        public void ShouldSetReplacedByToken_WhenProvided()
        {
            // Arrange
            var refreshToken = new RefreshToken(Guid.NewGuid(), "old_token", DateTime.UtcNow.AddDays(1));
            var newReplacementToken = "new_fresh_token";

            // Act
            refreshToken.Revoke(newReplacementToken);

            // Assert
            refreshToken.RevokedAt.Should().NotBeNull();
            refreshToken.ReplacedByToken.Should().Be(newReplacementToken);
            refreshToken.IsRevoked.Should().BeTrue();
            refreshToken.IsActive.Should().BeFalse();
        }

        /// <summary>
        /// Verifies that calling Revoke multiple times does not change the original RevokedAt timestamp.
        /// </summary>
        [Fact]
        public void ShouldNotUpdateRevokedAt_WhenAlreadyRevoked()
        {
            // Arrange
            var refreshToken = new RefreshToken(Guid.NewGuid(), "token", DateTime.UtcNow.AddDays(1));
            refreshToken.Revoke("token_1");
            var firstRevokedTimestamp = refreshToken.RevokedAt;

            // wait a little bit just to ensure Time changes
            System.Threading.Thread.Sleep(50);

            // Act
            refreshToken.Revoke("token_2");

            // Assert
            refreshToken.RevokedAt.Should().Be(firstRevokedTimestamp);
            refreshToken.ReplacedByToken.Should().Be("token_1"); // should not update replaced token either
        }
    }

    /// <summary>
    /// Tests for computed properties.
    /// </summary>
    public class ComputedProperties
    {
        /// <summary>
        /// Verifies that IsExpired is true when the ExpiresAt date passes.
        /// </summary>
        [Fact]
        public void IsExpired_ShouldBeTrue_WhenDatePasses()
        {
            // Arrange
            // We can't set it in the past via constructor, so we set it 50ms in future
            var expiresAt = DateTime.UtcNow.AddMilliseconds(50);
            var refreshToken = new RefreshToken(Guid.NewGuid(), "token", expiresAt);

            // Act
            // Wait for expiration to pass
            System.Threading.Thread.Sleep(100);

            // Assert
            refreshToken.IsExpired.Should().BeTrue();
            refreshToken.IsActive.Should().BeFalse();
        }
    }
}
