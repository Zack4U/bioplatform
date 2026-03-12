using Bio.Application.DTOs;
using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for the Two-Factor Authentication DTOs.
/// Verifies validation rules, construction, and correct field mapping.
/// </summary>
public class TwoFactorDTOTests
{
    /// <summary>
    /// Verifies that <see cref="TwoFactorVerifyRequestDTO"/> fails validation when the Code is null.
    /// </summary>
    [Fact]
    public void TwoFactorVerifyRequestDTO_ShouldFailValidation_WhenCodeIsNull()
    {
        // Arrange
        var dto = new TwoFactorVerifyRequestDTO { Code = null! };
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(dto, context, results, true);

        // Assert
        isValid.Should().BeFalse();
        results.Should().Contain(r => r.ErrorMessage == "The 6-digit code is required.");
    }

    /// <summary>
    /// Verifies that <see cref="TwoFactorLoginRequestDTO"/> fails validation when TwoFactorToken is null.
    /// </summary>
    [Fact]
    public void TwoFactorLoginRequestDTO_ShouldFailValidation_WhenTokenIsNull()
    {
        // Arrange
        var dto = new TwoFactorLoginRequestDTO
        {
            TwoFactorToken = null!,
            Code = "123456"
        };
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();

        // Act
        var isValid = Validator.TryValidateObject(dto, context, results, true);

        // Assert
        isValid.Should().BeFalse();
        results.Should().Contain(r => r.ErrorMessage == "Two-factor token is required.");
    }

    /// <summary>
    /// Verifies that <see cref="TwoFactorSetupResponseDTO"/> is correctly constructed with the provided shared key.
    /// </summary>
    [Fact]
    public void TwoFactorSetupResponseDTO_ShouldSetSharedKey()
    {
        // Arrange
        var secret = "ABCDEF";
        var uri = "otpauth://totp/Bio:test@test.com?secret=ABCDEF";

        // Act
        var dto = new TwoFactorSetupResponseDTO(secret, uri);

        // Assert
        dto.SharedKey.Should().Be(secret);
    }

    /// <summary>
    /// Verifies that <see cref="TwoFactorSetupResponseDTO"/> is correctly constructed with the provided OTP URI.
    /// </summary>
    [Fact]
    public void TwoFactorSetupResponseDTO_ShouldSetAuthenticatorUri()
    {
        // Arrange
        var secret = "ABCDEF";
        var uri = "otpauth://totp/Bio:test@test.com?secret=ABCDEF";

        // Act
        var dto = new TwoFactorSetupResponseDTO(secret, uri);

        // Assert
        dto.AuthenticatorUri.Should().Be(uri);
    }

    /// <summary>
    /// Verifies that <see cref="AuthResponseDTO"/> correctly sets TwoFactorRequired and TwoFactorToken when 2FA is required.
    /// </summary>
    [Fact]
    public void AuthResponseDTO_ShouldSet2FAFields_WhenRequired()
    {
        // Act
        var dto = new AuthResponseDTO(
            TwoFactorRequired: true,
            TwoFactorToken: "temp-token"
        );

        // Assert
        dto.TwoFactorRequired.Should().BeTrue();
        dto.TwoFactorToken.Should().Be("temp-token");
    }

    /// <summary>
    /// Verifies that <see cref="AuthResponseDTO"/> leaves AccessToken null when 2FA is required.
    /// </summary>
    [Fact]
    public void AuthResponseDTO_ShouldLeaveAccessTokenNull_WhenTwoFactorRequired()
    {
        // Act
        var dto = new AuthResponseDTO(
            TwoFactorRequired: true,
            TwoFactorToken: "temp-token"
        );

        // Assert
        dto.AccessToken.Should().BeNull();
    }

    /// <summary>
    /// Verifies that <see cref="UserResponseDTO"/> correctly exposes the TwoFactorEnabled field.
    /// </summary>
    [Fact]
    public void UserResponseDTO_ShouldIncludeTwoFactorEnabled()
    {
        // Act
        var dto = new UserResponseDTO(
            Id: Guid.NewGuid(),
            FullName: "John Doe",
            Email: "john@test.com",
            TwoFactorEnabled: true
        );

        // Assert
        dto.TwoFactorEnabled.Should().BeTrue();
    }
}
