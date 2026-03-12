using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for <see cref="ChangePasswordRequestDTO"/> validation logic.
/// </summary>
public class ChangePasswordRequestDTOTests
{
    private ChangePasswordRequestDTO CreateValidDTO() => new("OldPassword123!", "NewPassword123!", "NewPassword123!");

    /// <summary>
    /// Tests for the validation of the ChangePasswordRequestDTO entity.
    /// Verifies that the DTO is valid when all required fields are present and valid.
    /// </summary>
    public class Validation
    {
        private readonly ChangePasswordRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a valid ChangePasswordRequestDTO instance does not have any validation errors.
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
    /// Tests for the validation of the <see cref="ChangePasswordRequestDTO.CurrentPassword"/> property.
    /// Verifies that the current password is required and valid.
    /// </summary>
    public class CurrentPassword
    {
        private readonly ChangePasswordRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a missing current password results in a validation error.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void MissingCurrentPasswordParameter_ShouldHaveValidationError(string? currentPassword)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { CurrentPassword = currentPassword! };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "Current password is required.");
        }

        /// <summary>
        /// Verifies that the lack of an old password specifically generates a validation error.
        /// </summary>
        [Fact]
        public void MissingOldPassword_ShouldHaveValidationError()
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { CurrentPassword = "" };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "Current password is required.");
        }
    }

    /// <summary>
    /// Tests for the validation of the <see cref="ChangePasswordRequestDTO.NewPassword"/> property.
    /// Verifies that the new password is required and valid.
    /// </summary>
    public class NewPassword
    {
        private readonly ChangePasswordRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a missing new password results in a validation error.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void MissingNewPasswordParameter_ShouldHaveValidationError(string? newPassword)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { NewPassword = newPassword! };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "New password is required.");
        }

        /// <summary>
        /// Verifica que la falta de una nueva contraseña genere un error de validación.
        /// </summary>
        [Fact]
        public void MissingNewPassword_ShouldHaveValidationError()
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { NewPassword = "" };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "New password is required.");
        }

        /// <summary>
        /// Verifies that a new password that is too short results in a validation error.
        /// </summary>
        [Theory]
        [InlineData("short")]
        [InlineData("1234567")]
        public void ShortNewPassword_ShouldHaveValidationError(string newPassword)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { NewPassword = newPassword };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "New password must be at least 8 characters long.");
        }
    }

    /// <summary>
    /// Tests for the validation of the <see cref="ChangePasswordRequestDTO.ConfirmNewPassword"/> property.
    /// Verifies that the password confirmation is required and matches the new password.
    /// </summary>
    public class ConfirmNewPassword
    {
        private readonly ChangePasswordRequestDTOTests _parent = new();

        /// <summary>
        /// Verifies that a missing password confirmation results in a validation error.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void MissingConfirmNewPassword_ShouldHaveValidationError(string? confirmNewPassword)
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { ConfirmNewPassword = confirmNewPassword! };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "Password confirmation is required.");
        }

        /// <summary>
        /// Verifies that mismatched passwords result in a validation error.
        /// </summary>
        [Fact]
        public void MismatchedPasswords_ShouldHaveValidationError()
        {
            // Arrange
            var dto = _parent.CreateValidDTO() with { ConfirmNewPassword = "DifferentPassword123!" };

            // Act
            var results = ValidationHelper.Validate(dto);

            // Assert
            results.Should().Contain(r => r.ErrorMessage == "Passwords do not match.");
        }
    }
}
