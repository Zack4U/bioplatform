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
        /// Verifies that a new User instance is initialized with the correctly assigned Id.
        /// </summary>
        [Fact]
        public void ShouldSetId_WhenCreated()
        {
            // Arrange
            var id = Guid.NewGuid();

            // Act
            var user = new User(id, "John Doe", "john.doe@example.com", "hash", "salt", "+123456789");

            // Assert
            user.Id.Should().Be(id);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned Full Name.
        /// </summary>
        [Fact]
        public void ShouldSetFullName_WhenCreated()
        {
            // Arrange
            var fullName = "John Doe";

            // Act
            var user = new User(Guid.NewGuid(), fullName, "john.doe@example.com", "hash", "salt", "+123456789");

            // Assert
            user.FullName.Should().Be(fullName);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned Email.
        /// </summary>
        [Fact]
        public void ShouldSetEmail_WhenCreated()
        {
            // Arrange
            var email = "john.doe@example.com";

            // Act
            var user = new User(Guid.NewGuid(), "John Doe", email, "hash", "salt", "+123456789");

            // Assert
            user.Email.Should().Be(email);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned PasswordHash.
        /// </summary>
        [Fact]
        public void ShouldSetPasswordHash_WhenCreated()
        {
            // Arrange
            var passwordHash = "hash";

            // Act
            var user = new User(Guid.NewGuid(), "John Doe", "john.doe@example.com", passwordHash, "salt", "+123456789");

            // Assert
            user.PasswordHash.Should().Be(passwordHash);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned Salt.
        /// </summary>
        [Fact]
        public void ShouldSetSalt_WhenCreated()
        {
            // Arrange
            var salt = "salt";

            // Act
            var user = new User(Guid.NewGuid(), "John Doe", "john.doe@example.com", "hash", salt, "+123456789");

            // Assert
            user.Salt.Should().Be(salt);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned PhoneNumber.
        /// </summary>
        [Fact]
        public void ShouldSetPhoneNumber_WhenCreated()
        {
            // Arrange
            var phone = "+123456789";

            // Act
            var user = new User(Guid.NewGuid(), "John Doe", "john.doe@example.com", "hash", "salt", phone);

            // Assert
            user.PhoneNumber.Should().Be(phone);
        }

        /// <summary>
        /// Verifies that created User instance is initialized with the correctly assigned CreatedAt.
        /// </summary>
        [Fact]
        public void ShouldSetCreatedAt_WhenCreated()
        {
            // Act
            var user = new User(Guid.NewGuid(), "John Doe", "john.doe@example.com", "hash", "salt", "+123456789");

            // Assert
            user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
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
        /// Verifies that leading/trailing whitespace is trimmed from the full name.
        /// </summary>
        [Fact]
        public void ShouldTrimWhitespaceFromFullName_WhenCreated()
        {
            // Act
            var user = new User(Guid.NewGuid(), "  John Doe  ", "john@test.com", "h", "s");

            // Assert
            user.FullName.Should().Be("John Doe");
        }

        /// <summary>
        /// Verifies that leading/trailing whitespace is trimmed from the email.
        /// </summary>
        [Fact]
        public void ShouldTrimWhitespaceFromEmail_WhenCreated()
        {
            // Act
            var user = new User(Guid.NewGuid(), "John Doe", "  john@test.com  ", "h", "s");

            // Assert
            user.Email.Should().Be("john@test.com");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the user ID is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_IdIsEmpty()
        {
            // Act
            Action act = () => new User(Guid.Empty, "John Doe", "email@test.com", "h", "s");

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*User ID cannot be empty.*");
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
        /// Verifies that an ArgumentException is thrown when the full name is only whitespace.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_NameIsWhitespace()
        {
            // Act
            Action act = () => new User(Guid.NewGuid(), "   ", "email@test.com", "h", "s");

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
        /// Verifies that an ArgumentException is thrown when the email is only whitespace.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_EmailIsWhitespace()
        {
            // Act
            Action act = () => new User(Guid.NewGuid(), "John Doe", "   ", "h", "s");

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

        /// <summary>
        /// Tests for the ChangePassword domain method.
        /// </summary>
        public class ChangePassword
        {
            /// <summary>
            /// Verifies that ChangePassword correctly updates the password hash.
            /// </summary>
            [Fact]
            public void ShouldUpdateHash_WhenChanged()
            {
                // Arrange
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "oldHash", "oldSalt");
                var newHash = "newHash";
                var newSalt = "newSalt";

                // Act
                user.ChangePassword(newHash, newSalt);

                // Assert
                user.PasswordHash.Should().Be(newHash);
            }

            /// <summary>
            /// Verifies that ChangePassword correctly updates the salt.
            /// </summary>
            [Fact]
            public void ShouldUpdateSalt_WhenChanged()
            {
                // Arrange
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "oldHash", "oldSalt");
                var newHash = "newHash";
                var newSalt = "newSalt";

                // Act
                user.ChangePassword(newHash, newSalt);

                // Assert
                user.Salt.Should().Be(newSalt);
            }

            /// <summary>
            /// Verifies that ChangePassword correctly sets the UpdatedAt timestamp.
            /// </summary>
            [Fact]
            public void ShouldSetUpdatedAt_WhenChanged()
            {
                // Arrange
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "oldHash", "oldSalt");
                var newHash = "newHash";
                var newSalt = "newSalt";

                // Act
                user.ChangePassword(newHash, newSalt);

                // Assert
                user.UpdatedAt.Should().NotBeNull();
                user.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            }

            /// <summary>
            /// Verifies that ChangePassword throws an ArgumentException when the new hash is empty.
            /// </summary>
            [Fact]
            public void ShouldThrowException_When_HashIsEmpty()
            {
                // Arrange
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");

                // Act
                Action act = () => user.ChangePassword("", "newSalt");

                // Assert
                act.Should().Throw<ArgumentException>().WithMessage("*Password hash cannot be empty.*");
            }

            /// <summary>
            /// Verifies that ChangePassword throws an ArgumentException when the new salt is empty.
            /// </summary>
            [Fact]
            public void ShouldThrowException_When_SaltIsEmpty()
            {
                // Arrange
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");

                // Act
                Action act = () => user.ChangePassword("newHash", "");

                // Assert
                act.Should().Throw<ArgumentException>().WithMessage("*Salt cannot be empty.*");
            }
        }
    }
}
