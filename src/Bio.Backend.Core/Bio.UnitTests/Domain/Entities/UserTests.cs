using System;
using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="User"/> domain entity.
/// These tests ensure that the entity's properties are correctly initialized and can be modified.
/// </summary>
public class UserTests
{
    /// <summary>
    /// Tests for the initialization of the User entity.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a new User instance is initialized with the correct values via constructor.
        /// </summary>
        [Fact]
        public void ShouldInitializeWithCorrectValues()
        {
            // Arrange
            var id = Guid.NewGuid();
            var fullName = "John Doe";
            var email = "john.doe@example.com";
            var passwordHash = "hash";
            var salt = "salt";
            var phone = "+123456789";

            // Act
            var user = new User(id, fullName, email, passwordHash, salt, phone);

            // Assert
            user.Id.Should().Be(id);
            user.FullName.Should().Be(fullName);
            user.Email.Should().Be(email.ToLowerInvariant());
            user.PasswordHash.Should().Be(passwordHash);
            user.Salt.Should().Be(salt);
            user.PhoneNumber.Should().Be(phone);
            user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            user.UpdatedAt.Should().BeNull();
        }

        /// <summary>
        /// Verifies that domain invariants are enforced (e.g., name is required).
        /// </summary>
        [Fact]
        public void ShouldThrowExceptionWhenNameIsEmpty()
        {
            // Act
            Action act = () => new User(Guid.NewGuid(), "", "email@test.com", "h", "s");

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Full name is required.*");
        }
    }

    /// <summary>
    /// Tests for updating properties via domain methods.
    /// </summary>
    public class DomainMethods
    {
        /// <summary>
        /// Verifies that the UpdateProfile method correctly updates the entity and the UpdatedAt timestamp.
        /// </summary>
        [Fact]
        public void UpdateProfile_ShouldChangeValuesAndSetTimestamp()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "Old Name", "old@email.com", "h", "s");
            var newName = "New Name";
            var newEmail = "NEW@EMAIL.COM";
            var newPhone = "+987654321";

            // Act
            user.UpdateProfile(newName, newEmail, newPhone);

            // Assert
            user.FullName.Should().Be(newName);
            user.Email.Should().Be(newEmail.ToLowerInvariant());
            user.PhoneNumber.Should().Be(newPhone);
            user.UpdatedAt.Should().NotBeNull();
            user.UpdatedAt.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }
    }
}
