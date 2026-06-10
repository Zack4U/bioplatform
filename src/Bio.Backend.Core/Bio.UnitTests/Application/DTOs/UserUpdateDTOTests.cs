using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for UserUpdateDTO validation logic.
/// </summary>
public class UserUpdateDTOTests
{
    /// <summary>
    /// Creates a valid UserUpdateDTO instance for testing purposes.
    /// </summary>
    private UserUpdateDTO CreateValidDTO() => new("Jane Doe", "jane.doe@example.com", "+9876543210");

    /// <summary>
    /// Verifies that a valid UserUpdateDTO instance does not have any validation errors.
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
    /// Verifies that a UserUpdateDTO with a missing full name has validation errors.
    /// </summary>
    [Fact]
    public void MissingFullName_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { FullName = string.Empty };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Full name is required.");
    }

    /// <summary>
    /// Verifies that a UserUpdateDTO with an invalid email format has validation errors.
    /// </summary>
    [Fact]
    public void InvalidEmail_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { Email = "not-an-email" };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Email format is invalid.");
    }

    /// <summary>
    /// Verifies that a UserUpdateDTO with a missing phone number has validation errors.
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
    /// Verifies that a UserUpdateDTO with a missing email has validation errors.
    /// </summary>
    [Fact]
    public void MissingEmail_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { Email = string.Empty };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Email is required.");
    }

    /// <summary>
    /// Verifies that a UserUpdateDTO with all required fields missing has multiple validation errors.
    /// </summary>
    [Fact]
    public void AllRequiredFieldsMissing_ShouldHaveValidationErrors()
    {
        // Arrange
        var dto = new UserUpdateDTO(string.Empty, string.Empty, string.Empty);

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().HaveCount(3);
        results.Should().Contain(r => r.ErrorMessage == "Full name is required.");
        results.Should().Contain(r => r.ErrorMessage == "Email is required.");
        results.Should().Contain(r => r.ErrorMessage == "Phone number is required.");
    }

    /// <summary>
    /// Verifies that a UserUpdateDTO with a name that exceeds the maximum length has validation errors.
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
    /// Verifies that a UserUpdateDTO with an email that exceeds the maximum length has validation errors.
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
    /// Verifies that a UserUpdateDTO with a phone number that exceeds the maximum length has validation errors.
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
    /// Verifies that a UserUpdateDTO with all fields exceeding their maximum lengths has multiple validation errors.
    /// </summary>
    [Fact]
    public void AllFieldsTooLong_ShouldHaveValidationErrors()
    {
        // Arrange
        var dto = new UserUpdateDTO(
            new string('A', 151),
            new string('a', 92) + "@test.com",
            new string('1', 21)
        );

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().HaveCount(3);
        results.Should().Contain(r => r.ErrorMessage == "Name cannot exceed 150 characters.");
        results.Should().Contain(r => r.ErrorMessage == "Email cannot exceed 100 characters.");
        results.Should().Contain(r => r.ErrorMessage == "Phone number cannot exceed 20 characters.");
    }
}
