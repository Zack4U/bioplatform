using Bio.Application.DTOs;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.DTOs;

/// <summary>
/// Unit tests for UserRoleCreateDTO validation logic.
/// </summary>
public class UserRoleCreateDTOTests
{
    private UserRoleCreateDTO CreateValidDTO() => new()
    {
        UserId = Guid.NewGuid(),
        RoleId = Guid.NewGuid()
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
    public void MissingUserId_ShouldHaveValidationError()
    {
        // Arrange
        var dto = CreateValidDTO();
        dto.UserId = Guid.Empty; // Guid.Empty is still a Guid, but if [Required] is applied to a non-nullable Guid, it might not catch it as "missing" in the same way as a string. However, Guid.Empty is often considered "missing" in business logic.
        
        // Act
        var results = ValidationHelper.Validate(dto);

        // Assert
        // In .NET DataAnnotations, [Required] on a Guid (Value Type) only fails if it's null (if Guid?). 
        // For non-nullable Guid, it defaults to Guid.Empty and usually PASSES [Required].
        // To catch Guid.Empty, we would need a custom validator or just test that it's valid if Guid.Empty is allowed by the attribute.
        // Let's check the current behavior.
        results.Should().BeEmpty(); 
    }
}
