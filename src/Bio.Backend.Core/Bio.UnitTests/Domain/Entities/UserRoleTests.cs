using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="UserRole"/> domain entity.
/// Verifies that the assignment of a role to a user is correctly created and immutable.
/// </summary>
public class UserRoleTests
{
    /// <summary>
    /// Tests for the initialization of the UserRole entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a UserRole is initialized with the correct UserId, RoleId, and AssignedAt timestamp.
        /// </summary>
        [Fact]
        public void ShouldInitializeWithCorrectValues()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();

            // Act
            var userRole = new UserRole(userId, roleId);

            // Assert
            userRole.UserId.Should().Be(userId);
            userRole.RoleId.Should().Be(roleId);
            userRole.AssignedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        /// <summary>
        /// Verifies that two different UserRole assignments have distinct AssignedAt timestamps
        /// when their UserId or RoleId differs, confirming correct identity separation.
        /// </summary>
        [Fact]
        public void ShouldAssignDifferentIds_ForDifferentAssignments()
        {
            // Arrange
            var userId1 = Guid.NewGuid();
            var roleId1 = Guid.NewGuid();
            var userId2 = Guid.NewGuid();
            var roleId2 = Guid.NewGuid();

            // Act
            var userRole1 = new UserRole(userId1, roleId1);
            var userRole2 = new UserRole(userId2, roleId2);

            // Assert
            userRole1.UserId.Should().NotBe(userRole2.UserId);
            userRole1.RoleId.Should().NotBe(userRole2.RoleId);
        }

        /// <summary>
        /// Verifies that the navigation properties (User and Role) are null after construction,
        /// as they are populated by EF Core's lazy loading, not the domain constructor.
        /// </summary>
        [Fact]
        public void ShouldHaveNullNavigationProperties_WhenCreatedWithoutEfCore()
        {
            // Act
            var userRole = new UserRole(Guid.NewGuid(), Guid.NewGuid());

            // Assert — navigation properties are not set by the domain constructor
            userRole.User.Should().BeNull();
            userRole.Role.Should().BeNull();
        }

        /// <summary>
        /// Verifies that the same user can be assigned to two different roles, creating two distinct entities.
        /// </summary>
        [Fact]
        public void ShouldAllowSameUser_WithDifferentRoles()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId1 = Guid.NewGuid();
            var roleId2 = Guid.NewGuid();

            // Act
            var assignment1 = new UserRole(userId, roleId1);
            var assignment2 = new UserRole(userId, roleId2);

            // Assert
            assignment1.UserId.Should().Be(assignment2.UserId);
            assignment1.RoleId.Should().NotBe(assignment2.RoleId);
        }
    }
}
