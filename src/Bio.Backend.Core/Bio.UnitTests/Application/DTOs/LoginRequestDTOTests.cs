using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for LoginRequestDTO validation logic.
/// </summary>
public class LoginRequestDTOTests
{
    private LoginRequestDTO CreateValidDTO() => new()
    {
        Email = "test@example.com",
        Password = "SecurePassword123!"
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
    public void MissingEmail_ShouldHaveValidationError(string? email)
    {
        var dto = CreateValidDTO();
        dto.Email = email!;
        var results = ValidationHelper.Validate(dto);
        results.Should().Contain(r => r.ErrorMessage == "Email is required.");
    }

    [Theory]
    [InlineData("invalid-email")]
    [InlineData("test@")]
    [InlineData("@example.com")]
    public void InvalidEmail_ShouldHaveValidationError(string email)
    {
        var dto = CreateValidDTO();
        dto.Email = email;
        var results = ValidationHelper.Validate(dto);
        results.Should().Contain(r => r.ErrorMessage == "Email format is invalid.");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingPassword_ShouldHaveValidationError(string? password)
    {
        var dto = CreateValidDTO();
        dto.Password = password!;
        var results = ValidationHelper.Validate(dto);
        results.Should().Contain(r => r.ErrorMessage == "Password is required.");
    }
}
