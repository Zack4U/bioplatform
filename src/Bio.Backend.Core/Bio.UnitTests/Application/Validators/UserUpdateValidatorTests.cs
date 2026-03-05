using Bio.Application.DTOs;
using Bio.Application.Validators;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.Validators;

/// <summary>
/// Unit tests for the <see cref="UserUpdateValidator"/> class.
/// These tests verify that the validation rules are correctly applied to the <see cref="UserUpdateDTO"/>.
/// Note: Swagger is not used in the test project, but XML comments are maintained for project consistency.
/// </summary>
public class UserUpdateValidatorTests
{
    private readonly UserUpdateValidator _validator;

    public UserUpdateValidatorTests()
    {
        _validator = new UserUpdateValidator();
    }

    /// <summary>
    /// Verifies that a fully valid model passes validation.
    /// </summary>
    [Fact]
    public void Validate_ValidModel_ShouldNotHaveAnyErrors()
    {
        // Arrange
        var model = new UserUpdateDTO
        {
            FullName = "Jane Doe",
            Email = "jane.doe@example.com",
            PhoneNumber = "+1987654321"
        };

        // Act
        var result = _validator.Validate(model);

        // Assert
        result.IsValid.Should().BeTrue();
        result.Errors.Should().BeEmpty();
    }

    /// <summary>
    /// Verifies that validation fails when the FullName is empty or exceeds the maximum length.
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("ThisNameIsWayTooLongAndExceedsOneHundredAndFiftyCharactersLimitWhichShouldTriggerAValidationErrorBecauseItIsDesignedToFailTheLengthRuleInTheValidatorClassPleaseFail")]
    public void Validate_InvalidFullName_ShouldHaveValidationError(string invalidName)
    {
        // Arrange
        var model = new UserUpdateDTO
        {
            FullName = invalidName,
            Email = "jane@example.com",
            PhoneNumber = "123456"
        };

        // Act
        var result = _validator.Validate(model);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "FullName");
    }

    /// <summary>
    /// Verifies that validation fails for invalid email formats.
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    [InlineData("missing.domain.com")]
    public void Validate_InvalidEmail_ShouldHaveValidationError(string invalidEmail)
    {
        // Arrange
        var model = new UserUpdateDTO
        {
            FullName = "Jane Doe",
            Email = invalidEmail,
            PhoneNumber = "123456"
        };

        // Act
        var result = _validator.Validate(model);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "Email");
    }

    /// <summary>
    /// Verifies that validation fails when the PhoneNumber is empty or too long.
    /// </summary>
    [Theory]
    [InlineData("")]
    [InlineData("123456789012345678901")] // 21 characters
    public void Validate_InvalidPhoneNumber_ShouldHaveValidationError(string invalidPhone)
    {
        // Arrange
        var model = new UserUpdateDTO
        {
            FullName = "Jane Doe",
            Email = "jane@example.com",
            PhoneNumber = invalidPhone
        };

        // Act
        var result = _validator.Validate(model);

        // Assert
        result.IsValid.Should().BeFalse();
        result.Errors.Should().Contain(e => e.PropertyName == "PhoneNumber");
    }
}
