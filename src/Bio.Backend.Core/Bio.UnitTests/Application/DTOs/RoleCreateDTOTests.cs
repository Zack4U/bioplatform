using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for RoleCreateDTO validation logic.
/// </summary>
public class RoleCreateDTOTests
{
    private RoleCreateDTO CreateValidDTO() => new()
    {
        Name = "ADMIN",
        Description = "System Administrator"
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
    public void MissingName_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.Name = string.Empty;

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Name is required.");
    }

    [Fact]
    public void NameTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.Name = new string('A', 101);

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Name cannot exceed 100 characters.");
    }

    [Fact]
    public void DescriptionTooLong_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.Description = new string('A', 2001);

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Description cannot exceed 2000 characters.");
    }
}
