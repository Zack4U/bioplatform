using Bio.Backend.Core.Bio.Infrastructure.Services;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Services;

/// <summary>
/// Unit tests for the <see cref="PasswordHasher"/> class.
/// These tests ensure that passwords can be hashed and accurately verified.
/// </summary>
public class PasswordHasherTests
{
    protected readonly PasswordHasher _passwordHasher;

    public PasswordHasherTests()
    {
        _passwordHasher = new PasswordHasher();
    }

    /// <summary>
    /// Tests for the HashPassword method.
    /// </summary>
    public class HashPassword : PasswordHasherTests
    {
        /// <summary>
        /// Verifies that HashPassword generates a non-empty hash and salt for a valid password.
        /// </summary>
        [Fact]
        public void ValidPassword_ShouldGenerateHashAndSalt()
        {
            // Arrange
            var password = "SecurePassword123!";

            // Act
            var result = _passwordHasher.HashPassword(password);

            // Assert
            result.Hash.Should().NotBeNullOrEmpty();
            result.Salt.Should().NotBeNullOrEmpty();
        }

        /// <summary>
        /// Verifies that HashPassword generates different hashes and salts for the same password
        /// on subsequent calls, due to random salt generation.
        /// </summary>
        [Fact]
        public void SamePasswordTwice_ShouldGenerateDifferentSaltsAndHashes()
        {
            // Arrange
            var password = "SecurePassword123!";

            // Act
            var result1 = _passwordHasher.HashPassword(password);
            var result2 = _passwordHasher.HashPassword(password);

            // Assert
            result1.Hash.Should().NotBe(result2.Hash);
            result1.Salt.Should().NotBe(result2.Salt);
        }

        /// <summary>
        /// Verifies that HashPassword throws ArgumentException when given a null, empty, or whitespace password.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void InvalidPassword_ShouldThrowException(string? password)
        {
            // Act & Assert
            var action = () => _passwordHasher.HashPassword(password!);
            action.Should().Throw<ArgumentException>().WithMessage("*Password cannot be null or empty*");
        }
    }

    /// <summary>
    /// Tests for the VerifyPassword method.
    /// </summary>
    public class VerifyPassword : PasswordHasherTests
    {
        /// <summary>
        /// Verifies that VerifyPassword returns true when given the correct password, hash, and salt.
        /// </summary>
        [Fact]
        public void CorrectPassword_ShouldReturnTrue()
        {
            // Arrange
            var password = "SecurePassword123!";
            var (hash, salt) = _passwordHasher.HashPassword(password);

            // Act
            var result = _passwordHasher.VerifyPassword(password, hash, salt);

            // Assert
            result.Should().BeTrue();
        }

        /// <summary>
        /// Verifies that VerifyPassword returns false when given an incorrect password.
        /// </summary>
        [Fact]
        public void IncorrectPassword_ShouldReturnFalse()
        {
            // Arrange
            var originalPassword = "SecurePassword123!";
            var incorrectPassword = "WrongPassword123!";
            var (hash, salt) = _passwordHasher.HashPassword(originalPassword);

            // Act
            var result = _passwordHasher.VerifyPassword(incorrectPassword, hash, salt);

            // Assert
            result.Should().BeFalse();
        }

        /// <summary>
        /// Verifies that VerifyPassword returns false when given a correct password but an incorrect hash.
        /// </summary>
        [Fact]
        public void IncorrectHash_ShouldReturnFalse()
        {
            // Arrange
            var password = "SecurePassword123!";
            var (_, salt) = _passwordHasher.HashPassword(password);
            var incorrectHash = Convert.ToBase64String(new byte[32]); // Different from any real hash

            // Act
            var result = _passwordHasher.VerifyPassword(password, incorrectHash, salt);

            // Assert
            result.Should().BeFalse();
        }

        /// <summary>
        /// Verifies that VerifyPassword returns false when given a correct password but an incorrect salt.
        /// </summary>
        [Fact]
        public void IncorrectSalt_ShouldReturnFalse()
        {
            // Arrange
            var password = "SecurePassword123!";
            var (hash, _) = _passwordHasher.HashPassword(password);
            var incorrectSalt = Convert.ToBase64String(new byte[16]); // Different from original salt

            // Act
            var result = _passwordHasher.VerifyPassword(password, hash, incorrectSalt);

            // Assert
            result.Should().BeFalse();
        }

        /// <summary>
        /// Verifies that VerifyPassword returns false when given null, empty, or whitespace parameters.
        /// </summary>
        [Theory]
        [InlineData(null, "hash", "salt")]
        [InlineData("", "hash", "salt")]
        [InlineData("password", null, "salt")]
        [InlineData("password", "", "salt")]
        [InlineData("password", "hash", null)]
        [InlineData("password", "hash", "")]
        public void InvalidParameters_ShouldReturnFalse(string? password, string? hash, string? salt)
        {
            // Act
            var result = _passwordHasher.VerifyPassword(password!, hash!, salt!);

            // Assert
            result.Should().BeFalse();
        }
    }
}
