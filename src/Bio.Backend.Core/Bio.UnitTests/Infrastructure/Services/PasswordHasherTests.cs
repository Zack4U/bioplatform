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
    private readonly PasswordHasher _passwordHasher;

    public PasswordHasherTests()
    {
        _passwordHasher = new PasswordHasher();
    }

    /// <summary>
    /// Verifies that HashPassword generates a non-empty hash and salt for a valid password.
    /// </summary>
    [Fact]
    public void HashPassword_ValidPassword_ShouldGenerateHashAndSalt()
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
    public void HashPassword_SamePasswordTwice_ShouldGenerateDifferentSaltsAndHashes()
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
    /// Verifies that VerifyPassword returns true when given the correct password, hash, and salt.
    /// </summary>
    [Fact]
    public void VerifyPassword_CorrectPassword_ShouldReturnTrue()
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
    public void VerifyPassword_IncorrectPassword_ShouldReturnFalse()
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
    /// Verifies that VerifyPassword returns false when given a correct password but an incorrect salt.
    /// </summary>
    [Fact]
    public void VerifyPassword_DifferentSalt_ShouldReturnFalse()
    {
        // Arrange
        var password = "SecurePassword123!";
        var (hash, salt1) = _passwordHasher.HashPassword(password);
        var (_, salt2) = _passwordHasher.HashPassword(password); // Get a different salt

        // Act
        var result = _passwordHasher.VerifyPassword(password, hash, salt2);

        // Assert
        result.Should().BeFalse();
    }
}
