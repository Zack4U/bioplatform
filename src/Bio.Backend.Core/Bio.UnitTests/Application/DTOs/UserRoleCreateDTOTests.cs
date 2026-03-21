using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for UserRoleCreateDTO validation logic.
/// </summary>
public class UserRoleCreateDTOTests
{
    /// <summary>
    /// Creates a valid UserRoleCreateDTO instance for testing purposes.
    /// </summary>
    private UserRoleCreateDTO CreateValidDTO() => new(Guid.NewGuid(), Guid.NewGuid());

    /// <summary>
    /// Verifies that a valid UserRoleCreateDTO instance does not have any validation errors.
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
    /// Verifies that a UserRoleCreateDTO with a missing user ID has validation errors.
    /// </summary>
    [Fact]
    public void MissingUserId_ShouldHaveValidationError()
    {
        // Arrange
        var dto = new UserRoleCreateDTO(default, Guid.NewGuid()) with { UserId = null! };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "User ID is required.");
    }

    /// <summary>
    /// Verifies that a UserRoleCreateDTO with a missing role ID has validation errors.
    /// </summary>
    [Fact]
    public void MissingRoleId_ShouldHaveValidationError()
    {
        // Arrange
        var dto = new UserRoleCreateDTO(Guid.NewGuid(), default) with { RoleId = null! };

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().Contain(r => r.ErrorMessage == "Role ID is required.");
    }

    /// <summary>
    /// Verifies that a UserRoleCreateDTO with both user and role IDs missing has multiple validation errors.
    /// </summary>
    [Fact]
    public void BothIdsMissing_ShouldHaveValidationErrors()
    {
        // Arrange
        var dto = new UserRoleCreateDTO(null!, null!);

        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        results.Should().HaveCount(2);
        results.Should().Contain(r => r.ErrorMessage == "User ID is required.");
        results.Should().Contain(r => r.ErrorMessage == "Role ID is required.");
    }
}
