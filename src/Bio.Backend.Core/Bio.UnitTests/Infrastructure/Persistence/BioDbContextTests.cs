using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace Bio.UnitTests.Infrastructure.Persistence;

/// <summary>
/// Unit tests for the <see cref="BioDbContext"/> configuration.
/// Verifies that the Fluent API configurations (keys, constraints, indexes) are correctly applied.
/// </summary>
public class BioDbContextTests
{
    /// <summary>
    /// The database context.
    /// </summary>
    private readonly BioDbContext _context;

    /// <summary>
    /// Initializes a new instance of the <see cref="BioDbContextTests"/> class.
    /// </summary>
    public BioDbContextTests()
    {
        var options = new DbContextOptionsBuilder<BioDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new BioDbContext(options);
    }

    /// <summary>
    /// Tests for the User entity configuration in the database model.
    /// </summary>
    public class UserConfiguration : BioDbContextTests
    {
        /// <summary>
        /// Tests that the User entity has a primary key.
        /// </summary>
        [Fact]
        public void ShouldHavePrimaryKey()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(User));
            var primaryKey = entity?.FindPrimaryKey();

            // Assert
            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        /// <summary>
        /// Tests that the FullName property has the correct constraints.
        /// </summary>
        [Fact]
        public void FullName_ShouldHaveCorrectConstraints()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(User));
            var property = entity?.FindProperty(nameof(User.FullName));

            // Assert
            property!.IsNullable.Should().BeFalse();
            property.GetMaxLength().Should().Be(150);
        }

        /// <summary>
        /// Tests that the Email property has the correct constraints.
        /// </summary>
        [Fact]
        public void Email_ShouldHaveCorrectConstraints()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(User));
            var property = entity?.FindProperty(nameof(User.Email));

            // Assert
            property!.IsNullable.Should().BeFalse();
            property.GetMaxLength().Should().Be(100);
        }

        /// <summary>
        /// Tests that the PhoneNumber property has the correct constraints.
        /// </summary>
        [Fact]
        public void PhoneNumber_ShouldHaveCorrectConstraints()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(User));
            var property = entity?.FindProperty(nameof(User.PhoneNumber));

            // Assert
            property!.GetMaxLength().Should().Be(20);
        }

        /// <summary>
        /// Tests that the PasswordHash property has the correct constraints.
        /// </summary>
        [Fact]
        public void PasswordHash_ShouldHaveCorrectConstraints()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(User));
            var property = entity?.FindProperty(nameof(User.PasswordHash));

            // Assert
            property!.IsNullable.Should().BeFalse();
            property.GetMaxLength().Should().Be(500);
        }

        /// <summary>
        /// Tests that the Salt property has the correct constraints.
        /// </summary>
        [Fact]
        public void Salt_ShouldHaveCorrectConstraints()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(User));
            var property = entity?.FindProperty(nameof(User.Salt));

            // Assert
            property!.IsNullable.Should().BeFalse();
            property.GetMaxLength().Should().Be(100);
        }

        /// <summary>
        /// Tests that the User entity has a unique index on email.
        /// </summary>
        [Fact]
        public void ShouldHaveUniqueIndexOnEmail()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(User));
            var index = entity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(User.Email)));

            // Assert
            index.Should().NotBeNull();
            index!.IsUnique.Should().BeTrue();
        }

        /// <summary>
        /// Tests that the User entity has a filtered unique index on phone number.
        /// </summary>
        [Fact]
        public void ShouldHaveFilteredUniqueIndexOnPhoneNumber()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(User));
            var index = entity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(User.PhoneNumber)));

            // Assert
            index.Should().NotBeNull();
            index!.IsUnique.Should().BeTrue();
            index!.GetFilter().Should().Be("[PhoneNumber] IS NOT NULL AND [PhoneNumber] <> ''");
        }
    }

    /// <summary>
    /// Tests for the Role entity configuration in the database model.
    /// </summary>
    public class RoleConfiguration : BioDbContextTests
    {
        /// <summary>
        /// Tests that the Role entity has a primary key.
        /// </summary>
        [Fact]
        public void ShouldHavePrimaryKey()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(Role));
            var primaryKey = entity?.FindPrimaryKey();

            // Assert
            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().ContainSingle(p => p.Name == "Id");
        }

        /// <summary>
        /// Tests that the Name property has the correct constraints.
        /// </summary>
        [Fact]
        public void Name_ShouldHaveCorrectConstraints()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(Role));
            var property = entity?.FindProperty(nameof(Role.Name));

            // Assert
            property!.IsNullable.Should().BeFalse();
            property.GetMaxLength().Should().Be(100);
        }

        /// <summary>
        /// Tests that the Description property has the correct constraints.
        /// </summary>
        [Fact]
        public void Description_ShouldHaveCorrectConstraints()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(Role));
            var property = entity?.FindProperty(nameof(Role.Description));

            // Assert
            property!.GetMaxLength().Should().Be(2000);
        }

        /// <summary>
        /// Tests that the Role entity has a unique index on name.
        /// </summary>
        [Fact]
        public void ShouldHaveUniqueIndexOnName()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(Role));
            var index = entity?.GetIndexes().FirstOrDefault(i => i.Properties.Any(p => p.Name == nameof(Role.Name)));

            // Assert
            index.Should().NotBeNull();
            index!.IsUnique.Should().BeTrue();
        }
    }

    /// <summary>
    /// Tests for the UserRole entity configuration in the database model.
    /// </summary>
    public class UserRoleConfiguration : BioDbContextTests
    {
        /// <summary>
        /// Tests that the UserRole entity has a composite primary key.
        /// </summary>
        [Fact]
        public void ShouldHaveCompositePrimaryKey()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(UserRole));
            var primaryKey = entity?.FindPrimaryKey();

            // Assert
            primaryKey.Should().NotBeNull();
            primaryKey!.Properties.Should().HaveCount(2);
            primaryKey.Properties.Should().Contain(p => p.Name == "UserId");
            primaryKey.Properties.Should().Contain(p => p.Name == "RoleId");
        }

        /// <summary>
        /// Tests that the UserRole entity has foreign keys with cascade delete.
        /// </summary>
        [Fact]
        public void ShouldHaveForeignKeysWithCascadeDelete()
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(typeof(UserRole));
            var userFk = entity?.GetForeignKeys().FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(User));
            var roleFk = entity?.GetForeignKeys().FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(Role));

            // Assert
            userFk.Should().NotBeNull();
            userFk!.DeleteBehavior.Should().Be(DeleteBehavior.Cascade);

            roleFk.Should().NotBeNull();
            roleFk!.DeleteBehavior.Should().Be(DeleteBehavior.Cascade);
        }
    }

    /// <summary>
    /// Architecture and safety tests to ensure the overall database model follows best practices.
    /// </summary>
    public class ArchitectureRules : BioDbContextTests
    {
        /// <summary>
        /// Helper method to assert that a string property has an explicit MaxLength.
        /// </summary>
        private void AssertStringPropertyHasMaxLength(Type entityType, string propertyName)
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(entityType);
            var property = entity?.FindProperty(propertyName);
            var maxLength = property?.GetMaxLength();

            // Assert
            maxLength.Should().NotBeNull(
                $"Property '{propertyName}' in Entity '{entityType.Name}' " +
                "must have an explicit MaxLength defined to avoid nvarchar(max) performance issues.");
        }

        /// <summary>
        /// Tests that User.FullName must have an explicit MaxLength.
        /// </summary>
        [Fact]
        public void User_FullName_MustHaveExplicitMaxLength() =>
            AssertStringPropertyHasMaxLength(typeof(User), nameof(User.FullName));

        /// <summary>
        /// Tests that User.Email must have an explicit MaxLength.
        /// </summary>
        [Fact]
        public void User_Email_MustHaveExplicitMaxLength() =>
            AssertStringPropertyHasMaxLength(typeof(User), nameof(User.Email));

        /// <summary>
        /// Tests that User.PasswordHash must have an explicit MaxLength.
        /// </summary>
        [Fact]
        public void User_PasswordHash_MustHaveExplicitMaxLength() =>
            AssertStringPropertyHasMaxLength(typeof(User), nameof(User.PasswordHash));

        /// <summary>
        /// Tests that User.Salt must have an explicit MaxLength.
        /// </summary>
        [Fact]
        public void User_Salt_MustHaveExplicitMaxLength() =>
            AssertStringPropertyHasMaxLength(typeof(User), nameof(User.Salt));

        /// <summary>
        /// Tests that User.PhoneNumber must have an explicit MaxLength.
        /// </summary>
        [Fact]
        public void User_PhoneNumber_MustHaveExplicitMaxLength() =>
            AssertStringPropertyHasMaxLength(typeof(User), nameof(User.PhoneNumber));

        /// <summary>
        /// Tests that Role.Name must have an explicit MaxLength.
        /// </summary>
        [Fact]
        public void Role_Name_MustHaveExplicitMaxLength() =>
            AssertStringPropertyHasMaxLength(typeof(Role), nameof(Role.Name));

        /// <summary>
        /// Tests that Role.Description must have an explicit MaxLength.
        /// </summary>
        [Fact]
        public void Role_Description_MustHaveExplicitMaxLength() =>
            AssertStringPropertyHasMaxLength(typeof(Role), nameof(Role.Description));

        private void AssertPrimaryKeyPropertyIsNotNullable(Type entityType, string propertyName)
        {
            // Arrange & Act
            var entity = _context.Model.FindEntityType(entityType);
            var property = entity?.FindProperty(propertyName);

            // Assert
            property.Should().NotBeNull($"Property '{propertyName}' must exist in Entity '{entityType.Name}'.");
            property!.IsPrimaryKey().Should().BeTrue($"Property '{propertyName}' must be part of the primary key in Entity '{entityType.Name}'.");
            property.IsNullable.Should().BeFalse($"Primary key property '{propertyName}' in Entity '{entityType.Name}' cannot be nullable.");
        }

        /// <summary>
        /// Tests that User.Id (Primary Key) is not nullable.
        /// </summary>
        [Fact]
        public void User_Id_PK_ShouldNotBeNullable() =>
            AssertPrimaryKeyPropertyIsNotNullable(typeof(User), nameof(User.Id));

        /// <summary>
        /// Tests that Role.Id (Primary Key) is not nullable.
        /// </summary>
        [Fact]
        public void Role_Id_PK_ShouldNotBeNullable() =>
            AssertPrimaryKeyPropertyIsNotNullable(typeof(Role), nameof(Role.Id));

        /// <summary>
        /// Tests that UserRole.UserId (Composite PK) is not nullable.
        /// </summary>
        [Fact]
        public void UserRole_UserId_PK_ShouldNotBeNullable() =>
            AssertPrimaryKeyPropertyIsNotNullable(typeof(UserRole), nameof(UserRole.UserId));

        /// <summary>
        /// Tests that UserRole.RoleId (Composite PK) is not nullable.
        /// </summary>
        [Fact]
        public void UserRole_RoleId_PK_ShouldNotBeNullable() =>
            AssertPrimaryKeyPropertyIsNotNullable(typeof(UserRole), nameof(UserRole.RoleId));
    }
}
