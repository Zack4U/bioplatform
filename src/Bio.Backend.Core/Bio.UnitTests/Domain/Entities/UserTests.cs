using System;
using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="User"/> domain entity.
/// These tests ensure that the entity's properties are correctly initialized and can be modified.
/// Note: Swagger is not used in the test project, but XML comments are maintained for project consistency.
/// </summary>
public class UserTests
{
    /// <summary>
    /// Verifies that a new User instance is initialized with the correct default values.
    /// </summary>
    [Fact]
    public void User_Initialization_ShouldSetDefaultValues()
    {
        // Act
        var user = new User();

        // Assert
        user.Id.Should().BeEmpty();
        user.FullName.Should().BeEmpty();
        user.Email.Should().BeEmpty();
        user.PasswordHash.Should().BeEmpty();
        user.PhoneNumber.Should().BeNull();
        user.Salt.Should().BeEmpty();
        user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        user.UpdatedAt.Should().BeNull();
    }

    /// <summary>
    /// Verifies that the properties of the User entity can be updated correctly.
    /// </summary>
    [Fact]
    public void User_SetProperties_ShouldUpdateValues()
    {
        // Arrange
        var user = new User();
        var id = Guid.NewGuid();
        var updatedAt = DateTime.UtcNow;

        // Act
        user.Id = id;
        user.FullName = "John Doe";
        user.Email = "john.doe@example.com";
        user.PasswordHash = "hashed_password";
        user.PhoneNumber = "+1234567890";
        user.Salt = "random_salt";
        user.CreatedAt = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        user.UpdatedAt = updatedAt;

        // Assert
        user.Id.Should().Be(id);
        user.FullName.Should().Be("John Doe");
        user.Email.Should().Be("john.doe@example.com");
        user.PasswordHash.Should().Be("hashed_password");
        user.PhoneNumber.Should().Be("+1234567890");
        user.Salt.Should().Be("random_salt");
        user.CreatedAt.Should().Be(new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        user.UpdatedAt.Should().Be(updatedAt);
    }
}
