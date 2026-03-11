using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for RoleUpdateDTO validation logic.
/// </summary>
public class RoleUpdateDTOTests
{
    /// <summary>
    /// Creates a valid RoleUpdateDTO instance for testing purposes.
    /// </summary>
    private RoleUpdateDTO CreateValidDTO() => new("EDITOR", "Content Editor");

    /// <summary>
    /// Verifies that a valid RoleUpdateDTO instance does not have any validation errors.
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
    /// Verifies that a RoleUpdateDTO with a missing name has validation errors.
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
    /// Verifies that a RoleUpdateDTO with a name that exceeds the maximum length has validation errors.
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
    /// Verifies that a RoleUpdateDTO with a description that exceeds the maximum length has validation errors.
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
    /// Verifies that a RoleUpdateDTO with both name and description exceeding maximum lengths has multiple validation errors.
    /// </summary>
    [Fact]
    public void BothNameAndDescriptionTooLong_ShouldHaveValidationErrors()
    {
        // Arrange
        var dto = new RoleUpdateDTO(new string('A', 101), new string('B', 2001));

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().HaveCount(2);
        results.Should().Contain(r => r.ErrorMessage == "Name cannot exceed 100 characters.");
        results.Should().Contain(r => r.ErrorMessage == "Description cannot exceed 2000 characters.");
    }

    /// <summary>
    /// Verifies that a RoleUpdateDTO with a missing name and a description that exceeds the maximum length has multiple validation errors.
    /// </summary>
    [Fact]
    public void MissingNameAndDescriptionTooLong_ShouldHaveValidationErrors()
    {
        // Arrange
        var dto = new RoleUpdateDTO(string.Empty, new string('B', 2001));

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().HaveCount(2);
        results.Should().Contain(r => r.ErrorMessage == "Name is required.");
        results.Should().Contain(r => r.ErrorMessage == "Description cannot exceed 2000 characters.");
    }
}
