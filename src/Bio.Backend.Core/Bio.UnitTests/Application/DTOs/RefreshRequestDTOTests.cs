using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for <see cref="RefreshRequestDTO"/> validation logic.
/// </summary>
public class RefreshRequestDTOTests
{
    /// <summary>
    /// Creates a valid RefreshRequestDTO instance for testing purposes.
    /// </summary>
    private RefreshRequestDTO CreateValidDTO() => new("old-access-token", "valid-refresh-token");

    /// <summary>
    /// Tests for positive validation scenarios.
    /// </summary>
    public class Validation
    {
        private readonly RefreshRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a valid RefreshRequestDTO instance does not have any validation errors.
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
    /// Tests for the AccessToken property validation.
    /// </summary>
    public class AccessToken
    {
        private readonly RefreshRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a missing or empty access token has validation errors.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void MissingAccessToken_ShouldHaveValidationError(string? token)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { AccessToken = token! };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "AccessToken is required.");
        }
    }

    /// <summary>
    /// Tests for the RefreshToken property validation.
    /// </summary>
    public class RefreshToken
    {
        private readonly RefreshRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a missing or empty refresh token has validation errors.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void MissingRefreshToken_ShouldHaveValidationError(string? token)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { RefreshToken = token! };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "RefreshToken is required.");
        }
    }
}
