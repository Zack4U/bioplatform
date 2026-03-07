using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="User"/> domain entity.
/// Verifies constructor invariants, normalization, and domain method behavior.
/// </summary>
public class UserTests
{
    /// <summary>
    /// Tests for the initialization of the User entity via its constructor.
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
        /// Verifies that UpdatedAt is null immediately after construction (user has never been updated).
        /// </summary>
        [Fact]
        public void ShouldSetUpdatedAtAsNull_Initially()
        {
            // Act
            var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");

            // Assert
            user.UpdatedAt.Should().BeNull();
        }

        /// <summary>
        /// Verifies that the email is always stored in lowercase, regardless of the input casing.
        /// </summary>
        [Fact]
        public void ShouldNormalizeEmailToLowercase_WhenCreated()
        {
            // Act
            var user = new User(Guid.NewGuid(), "John Doe", "JOHN.DOE@EXAMPLE.COM", "h", "s");

            // Assert
            user.Email.Should().Be("john.doe@example.com");
        }

        /// <summary>
        /// Verifies that leading/trailing whitespace is trimmed from the full name and email.
        /// </summary>
        [Fact]
        public void ShouldTrimWhitespace_WhenCreated()
        {
            // Act
            var user = new User(Guid.NewGuid(), "  John Doe  ", "  john@test.com  ", "h", "s");

            // Assert
            user.FullName.Should().Be("John Doe");
            user.Email.Should().Be("john@test.com");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the full name is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_NameIsEmpty()
        {
            // Act
            Action act = () => new User(Guid.NewGuid(), "", "email@test.com", "h", "s");

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Full name is required.*");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the email is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_EmailIsEmpty()
        {
            // Act
            Action act = () => new User(Guid.NewGuid(), "John Doe", "", "h", "s");

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Email is required.*");
        }

        /// <summary>
        /// Verifies that a user can be created without a phone number (optional field).
        /// </summary>
        [Fact]
        public void ShouldAllowNullPhoneNumber_WhenCreated()
        {
            // Act
            var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");

            // Assert
            user.PhoneNumber.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the UpdateProfile domain method.
    /// </summary>
    public class DomainMethods
    {
        /// <summary>
        /// Verifies that UpdateProfile correctly updates all fields and sets the UpdatedAt timestamp.
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
            user.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        /// <summary>
        /// Verifies that UpdateProfile normalizes the email to lowercase.
        /// </summary>
        [Fact]
        public void UpdateProfile_ShouldNormalizeEmailToLowercase()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "John Doe", "old@test.com", "h", "s");

            // Act
            user.UpdateProfile("John Doe", "UPDATED@TEST.COM", null);

            // Assert
            user.Email.Should().Be("updated@test.com");
        }

        /// <summary>
        /// Verifies that UpdateProfile throws an ArgumentException when the new name is empty.
        /// </summary>
        [Fact]
        public void UpdateProfile_ShouldThrowException_When_NameIsEmpty()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");

            // Act
            Action act = () => user.UpdateProfile("", "john@test.com", null);

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Full name cannot be empty.*");
        }

        /// <summary>
        /// Verifies that UpdateProfile throws an ArgumentException when the new email is empty.
        /// </summary>
        [Fact]
        public void UpdateProfile_ShouldThrowException_When_EmailIsEmpty()
        {
            // Arrange
            var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");

            // Act
            Action act = () => user.UpdateProfile("John Doe", "", null);

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Email cannot be empty.*");
        }
    }
}
