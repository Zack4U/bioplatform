using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for UserCreateDTO validation logic.
/// </summary>
public class UserCreateDTOTests
{
    private UserCreateDTO CreateValidDTO() => new()
    {
        FullName = "John Doe",
        Email = "john.doe@example.com",
        PhoneNumber = "+1234567890",
        Password = "SecurePassword123!"
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

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingFullName_ShouldHaveValidationError(string? name)
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.FullName = name!;

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Full name is required.");
    }

    [Fact]
    public void NameTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.FullName = new string('A', 151);

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Name cannot exceed 150 characters.");
    }

    [Theory]
    [InlineData("invalid-email")]
    [InlineData("test@")]
    [InlineData("@example.com")]
    public void InvalidEmail_ShouldHaveValidationError(string email)
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.Email = email;

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Email format is invalid.");
    }

    [Fact]
    public void PasswordTooShort_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.Password = "short";

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Password must be at least 8 characters long.");
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
