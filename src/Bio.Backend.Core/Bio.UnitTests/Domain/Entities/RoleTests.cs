using Bio.Domain.Entities;
using Bio.Domain.Constants;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="Role"/> domain entity.
/// Verifies constructor invariants, name normalization, and domain method behavior.
/// </summary>
public class RoleTests
{
    /// <summary>
    /// Tests for the initialization of the Role entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a Role is initialized with the correctly assigned Id.
        /// </summary>
        [Fact]
        public void ShouldSetId_WhenCreated()
        {
            // Arrange
            var id = Guid.NewGuid();

            // Act
            var role = new Role(id, "admin");

            // Assert
            role.Id.Should().Be(id);
        }

        /// <summary>
        /// Verifies that a Role is initialized with the correctly assigned and normalized Name.
        /// </summary>
        [Fact]
        public void ShouldSetName_WhenCreated()
        {
            // Arrange
            var name = "admin";

            // Act
            var role = new Role(Guid.NewGuid(), name);

            // Assert
            role.Name.Should().Be(RoleNames.Admin);
        }

        /// <summary>
        /// Verifies that a Role is initialized with the correctly assigned Description.
        /// </summary>
        [Fact]
        public void ShouldSetDescription_WhenCreated()
        {
            // Arrange
            var description = "System administrator";

            // Act
            var role = new Role(Guid.NewGuid(), "admin", description);

            // Assert
            role.Description.Should().Be(description);
        }

        /// <summary>
        /// Verifies that CreatedAt is automatically set to the current UTC time upon creation.
        /// </summary>
        [Fact]
        public void ShouldSetCreatedAt_WhenCreated()
        {
            // Act
            var role = new Role(Guid.NewGuid(), "USER");

            // Assert
            role.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        /// <summary>
        /// Verifies that UpdatedAt is null immediately after construction (role has never been updated).
        /// </summary>
        [Fact]
        public void ShouldSetUpdatedAtAsNull_Initially()
        {
            // Act
            var role = new Role(Guid.NewGuid(), "USER");

            // Assert
            role.UpdatedAt.Should().BeNull();
        }

        /// <summary>
        /// Verifies that the role name is always stored in uppercase, regardless of input casing.
        /// </summary>
        [Fact]
        public void ShouldNormalizeNameToUppercase_WhenCreated()
        {
            // Act
            var role = new Role(Guid.NewGuid(), "admin");

            // Assert
            role.Name.Should().Be(RoleNames.Admin);
        }

        /// <summary>
        /// Verifies that leading/trailing whitespace is trimmed from the name.
        /// </summary>
        [Fact]
        public void ShouldTrimWhitespaceFromName_WhenCreated()
        {
            // Act
            var role = new Role(Guid.NewGuid(), "  admin  ");

            // Assert
            role.Name.Should().Be(RoleNames.Admin);
        }

        /// <summary>
        /// Verifies that leading/trailing whitespace is trimmed from the description.
        /// </summary>
        [Fact]
        public void ShouldTrimWhitespaceFromDescription_WhenCreated()
        {
            // Act
            var role = new Role(Guid.NewGuid(), "admin", "  Some description  ");

            // Assert
            role.Description.Should().Be("Some description");
        }

        /// <summary>
        /// Verifies that a Role can be created without a description (optional field).
        /// </summary>
        [Fact]
        public void ShouldAllowNullDescription_WhenCreated()
        {
            // Act
            var role = new Role(Guid.NewGuid(), "USER");

            // Assert
            role.Description.Should().BeNull();
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the role name is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_NameIsEmpty()
        {
            // Act
            Action act = () => new Role(Guid.NewGuid(), "");

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Role name is required.*");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the role ID is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_IdIsEmpty()
        {
            // Act
            Action act = () => new Role(Guid.Empty, RoleNames.Admin);

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Role ID cannot be empty.*");
        }
    }

    /// <summary>
    /// Tests for the Update domain method.
    /// </summary>
    public class DomainMethods
    {
        /// <summary>
        /// Verifies that Update correctly changes the name.
        /// </summary>
        [Fact]
        public void Update_ShouldChangeName()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), "user", "Old description");

            // Act
            role.Update("moderator", "Old description");

            // Assert
            role.Name.ToLower().Should().Be("moderator");
        }

        /// <summary>
        /// Verifies that Update correctly changes the description.
        /// </summary>
        [Fact]
        public void Update_ShouldChangeDescription()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), "user", "Old description");

            // Act
            role.Update("user", "New description");

            // Assert
            role.Description.Should().Be("New description");
        }

        /// <summary>
        /// Verifies that Update correctly sets the UpdatedAt timestamp to the current UTC time.
        /// </summary>
        [Fact]
        public void Update_ShouldSetUpdatedAtTimestamp()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), "user", "Old description");

            // Act
            role.Update("moderator", "New description");

            // Assert
            role.UpdatedAt.Should().NotBeNull();
            role.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        /// <summary>
        /// Verifies that Update normalizes the new name to uppercase.
        /// </summary>
        [Fact]
        public void Update_ShouldNormalizeNameToUppercase()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), "USER");

            // Act
            role.Update("superadmin", null);

            // Assert
            role.Name.Should().Be("SUPERADMIN");
        }

        /// <summary>
        /// Verifies that Update allows setting a null description (clearing the description).
        /// </summary>
        [Fact]
        public void Update_ShouldAllowClearingDescription()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), RoleNames.Admin, "Some description");

            // Act
            role.Update(RoleNames.Admin, null);

            // Assert
            role.Description.Should().BeNull();
        }

        /// <summary>
        /// Verifies that Update throws an ArgumentException when the new name is empty.
        /// </summary>
        [Fact]
        public void Update_ShouldThrowException_When_NameIsEmpty()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), RoleNames.Admin);

            // Act
            Action act = () => role.Update("", null);

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Role name cannot be empty.*");
        }

        /// <summary>
        /// Verifies that Update throws an ArgumentException when the new name is only whitespace.
        /// </summary>
        [Fact]
        public void Update_ShouldThrowException_When_NameIsWhitespace()
        {
            // Arrange
            var role = new Role(Guid.NewGuid(), RoleNames.Admin);

            // Act
            Action act = () => role.Update("   ", null);

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Role name cannot be empty.*");
        }
    }
}
