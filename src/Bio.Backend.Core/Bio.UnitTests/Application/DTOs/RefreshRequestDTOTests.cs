using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for RefreshRequestDTO validation logic.
/// </summary>
public class RefreshRequestDTOTests
{
    private RefreshRequestDTO CreateValidDTO() => new()
    {
        AccessToken = "old-access-token",
        RefreshToken = "valid-refresh-token"
    };

    [Fact]
    public void ValidDTO_ShouldNotHaveValidationErrors()
    {
        var dto = CreateValidDTO();
        var results = ValidationHelper.Validate(dto);
        results.Should().BeEmpty();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingAccessToken_ShouldHaveValidationError(string? token)
    {
        var dto = CreateValidDTO();
        dto.AccessToken = token!;
        var results = ValidationHelper.Validate(dto);
        results.Should().Contain(r => r.ErrorMessage == "AccessToken is required.");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingRefreshToken_ShouldHaveValidationError(string? token)
    {
        var dto = CreateValidDTO();
        dto.RefreshToken = token!;
        var results = ValidationHelper.Validate(dto);
        results.Should().Contain(r => r.ErrorMessage == "RefreshToken is required.");
    }
}
