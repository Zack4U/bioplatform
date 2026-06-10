using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for <see cref="LoginRequestDTO"/> validation logic.
/// </summary>
public class LoginRequestDTOTests
{
    /// <summary>
    /// Creates a valid LoginRequestDTO instance for testing purposes.
    /// </summary>
    private LoginRequestDTO CreateValidDTO() => new("test@example.com", "SecurePassword123!");

    /// <summary>
    /// Tests for positive validation scenarios.
    /// </summary>
    public class Validation
    {
        private readonly LoginRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a valid LoginRequestDTO instance does not have any validation errors.
        /// </summary>
        [Fact]
        public void ValidDTO_ShouldNotHaveValidationErrors()
        {
            // Arrange
            var dto = _parent.CreateValidDTO();

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().BeEmpty();
        }
    }

    /// <summary>
    /// Tests for the Email property validation.
    /// </summary>
    public class Email
    {
        private readonly LoginRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a missing or empty email has validation errors.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void MissingEmail_ShouldHaveValidationError(string? email)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { Email = email! };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "Email is required.");
        }

        /// <summary>
        /// Verifies that an email with an invalid format has validation errors.
        /// </summary>
        [Theory]
        [InlineData("invalid-email")]
        [InlineData("test@")]
        [InlineData("@example.com")]
        public void InvalidEmail_ShouldHaveValidationError(string email)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { Email = email };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "Email format is invalid.");
        }
    }

    /// <summary>
    /// Tests for the Password property validation.
    /// </summary>
    public class Password
    {
        private readonly LoginRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a missing or empty password has validation errors.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void MissingPassword_ShouldHaveValidationError(string? password)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { Password = password! };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "Password is required.");
        }
    }
}
