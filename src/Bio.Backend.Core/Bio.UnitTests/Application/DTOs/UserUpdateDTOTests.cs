using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for UserUpdateDTO validation logic.
/// </summary>
public class UserUpdateDTOTests
{
    private UserUpdateDTO CreateValidDTO() => new()
    {
        FullName = "Jane Doe",
        Email = "jane.doe@example.com",
        PhoneNumber = "+9876543210"
    };

    [Fact]
    public void ValidDTO_ShouldNotHaveValidationErrors()
    {
        // Arrange
        var dto = CreateValidDTO();

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void MissingFullName_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.FullName = string.Empty;

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Full name is required.");
    }

    [Fact]
    public void InvalidEmail_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.Email = "not-an-email";

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Email format is invalid.");
    }

    [Fact]
    public void MissingPhoneNumber_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.PhoneNumber = string.Empty;

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Phone number is required.");
    }
}
