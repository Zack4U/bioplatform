using System.ComponentModel.DataAnnotations;
using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for RoleCreateDTO validation logic.
/// </summary>
public class RoleCreateDTOTests
{
    /// <summary>
    /// Creates a valid RoleCreateDTO instance for testing purposes.
    /// </summary>
    private RoleCreateDTO CreateValidDTO() => new("ADMIN", "System Administrator");

    /// <summary>
    /// Verifies that a valid RoleCreateDTO instance does not have any validation errors.
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
    /// Verifies that a RoleCreateDTO with a missing name has validation errors.
    /// </summary>
    [Fact]
    public void MissingName_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { Name = string.Empty };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Name is required.");
    }

    /// <summary>
    /// Verifies that a RoleCreateDTO with a name that exceeds the maximum length has validation errors.
    /// </summary>
    [Fact]
    public void NameTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { Name = new string('A', 101) };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Name cannot exceed 100 characters.");
    }

    /// <summary>
    /// Verifies that a RoleCreateDTO with a description that exceeds the maximum length has validation errors.
    /// </summary>
    [Fact]
    public void DescriptionTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO() with { Description = new string('A', 2001) };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Description cannot exceed 2000 characters.");
    }

    /// <summary>
    /// Verifies that a RoleCreateDTO with both name and description exceeding maximum lengths has multiple validation errors.
    /// </summary>
    [Fact]
    public void BothNameAndDescriptionTooLong_ShouldHaveValidationErrors()
    {
        // Arrange
        var dto = new RoleCreateDTO(new string('A', 101), new string('B', 2001));

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().HaveCount(2);
        results.Should().Contain(r => r.ErrorMessage == "Name cannot exceed 100 characters.");
        results.Should().Contain(r => r.ErrorMessage == "Description cannot exceed 2000 characters.");
    }
}
