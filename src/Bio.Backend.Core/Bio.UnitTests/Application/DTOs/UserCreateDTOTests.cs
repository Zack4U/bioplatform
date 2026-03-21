using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for UserCreateDTO validation logic.
/// </summary>
public class UserCreateDTOTests
{
    /// <summary>
    /// Creates a valid UserCreateDTO instance for testing purposes.
    /// </summary>
    private UserCreateDTO CreateValidDTO() => new(
        "John Doe",
        "john.doe@example.com",
        "+1234567890",
        "SecurePassword123!"
    );

    /// <summary>
    /// Verifies that a valid UserCreateDTO instance does not have any validation errors.
    /// </summary>
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

    /// <summary>
    /// Verifies that a UserCreateDTO with a missing full name has validation errors.
    /// </summary>
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MissingFullName_ShouldHaveValidationError(string? name)
    {
        // Arrange
        var dto = CreateValidDTO() with { FullName = name! };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Full name is required.");
    }

    /// <summary>
    /// Verifies that a UserCreateDTO with a name that exceeds the maximum length has validation errors.
    /// </summary>
    [Fact]
    public void NameTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { FullName = new string('A', 151) };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Name cannot exceed 150 characters.");
    }

    /// <summary>
    /// Verifies that a UserCreateDTO with an invalid email format has validation errors.
    /// </summary>
    [Theory]
    [InlineData("invalid-email")]
    [InlineData("test@")]
    [InlineData("@example.com")]
    public void InvalidEmail_ShouldHaveValidationError(string email)
    {
        // Arrange
        var dto = CreateValidDTO() with { Email = email };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Email format is invalid.");
    }

    /// <summary>
    /// Verifies that a UserCreateDTO with a password that is too short has validation errors.
    /// </summary>
    [Fact]
    public void PasswordTooShort_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { Password = "short" };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Password must be at least 8 characters long.");
    }

    /// <summary>
    /// Verifies that a UserCreateDTO with a missing phone number has validation errors.
    /// </summary>
    [Fact]
    public void MissingPhoneNumber_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { PhoneNumber = string.Empty };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Phone number is required.");
    }

    /// <summary>
    /// Verifies that a UserCreateDTO with an email that exceeds the maximum length has validation errors.
    /// </summary>
    [Fact]
    public void EmailTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { Email = new string('a', 92) + "@test.com" };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Email cannot exceed 100 characters.");
    }

    /// <summary>
    /// Verifies that a UserCreateDTO with a phone number that exceeds the maximum length has validation errors.
    /// </summary>
    [Fact]
    public void PhoneNumberTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { PhoneNumber = new string('1', 21) };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Phone number cannot exceed 20 characters.");
    }

    /// <summary>
    /// Verifies that a UserCreateDTO with a missing password has validation errors.
    /// </summary>
    [Fact]
    public void MissingPassword_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { Password = string.Empty };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Password is required.");
    }

    /// <summary>
    /// Verifies that a UserCreateDTO with all required fields missing has multiple validation errors.
    /// </summary>
    [Fact]
    public void AllRequiredFieldsMissing_ShouldHaveValidationErrors()
    {
        // Arrange
        var dto = new UserCreateDTO(string.Empty, string.Empty, string.Empty, string.Empty);

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().HaveCount(4);
        results.Should().Contain(r => r.ErrorMessage == "Full name is required.");
        results.Should().Contain(r => r.ErrorMessage == "Email is required.");
        results.Should().Contain(r => r.ErrorMessage == "Phone number is required.");
        results.Should().Contain(r => r.ErrorMessage == "Password is required.");
    }
}
