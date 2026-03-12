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
            var id = Guid.NewGuid();
            var user = new User(id, "John Doe", "john.doe@example.com", "hash", "salt", "+123456789");
            user.Id.Should().Be(id);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned Full Name.
        /// </summary>
        [Fact]
        public void ShouldSetFullName_WhenCreated()
        {
            var fullName = "John Doe";
            var user = new User(Guid.NewGuid(), fullName, "john.doe@example.com", "hash", "salt", "+123456789");
            user.FullName.Should().Be(fullName);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned Email.
        /// </summary>
        [Fact]
        public void ShouldSetEmail_WhenCreated()
        {
            var email = "john.doe@example.com";
            var user = new User(Guid.NewGuid(), "John Doe", email, "hash", "salt", "+123456789");
            user.Email.Should().Be(email);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned PasswordHash.
        /// </summary>
        [Fact]
        public void ShouldSetPasswordHash_WhenCreated()
        {
            var passwordHash = "hash";
            var user = new User(Guid.NewGuid(), "John Doe", "john.doe@example.com", passwordHash, "salt", "+123456789");
            user.PasswordHash.Should().Be(passwordHash);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned Salt.
        /// </summary>
        [Fact]
        public void ShouldSetSalt_WhenCreated()
        {
            var salt = "salt";
            var user = new User(Guid.NewGuid(), "John Doe", "john.doe@example.com", "hash", salt, "+123456789");
            user.Salt.Should().Be(salt);
        }

        /// <summary>
        /// Verifies that a new User instance is initialized with the correctly assigned PhoneNumber.
        /// </summary>
        [Fact]
        public void ShouldSetPhoneNumber_WhenCreated()
        {
            var phone = "+123456789";
            var user = new User(Guid.NewGuid(), "John Doe", "john.doe@example.com", "hash", "salt", phone);
            user.PhoneNumber.Should().Be(phone);
        }

        /// <summary>
        /// Verifies that created User instance is initialized with the correctly assigned CreatedAt.
        /// </summary>
        [Fact]
        public void ShouldSetCreatedAt_WhenCreated()
        {
            var user = new User(Guid.NewGuid(), "John Doe", "john.doe@example.com", "hash", "salt", "+123456789");
            user.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        /// <summary>
        /// Verifies that UpdatedAt is null immediately after construction.
        /// </summary>
        [Fact]
        public void ShouldSetUpdatedAtAsNull_Initially()
        {
            var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");
            user.UpdatedAt.Should().BeNull();
        }

        /// <summary>
        /// Verifies that the email is always stored in lowercase, regardless of the input casing.
        /// </summary>
        [Fact]
        public void ShouldNormalizeEmailToLowercase_WhenCreated()
        {
            var user = new User(Guid.NewGuid(), "John Doe", "JOHN.DOE@EXAMPLE.COM", "h", "s");
            user.Email.Should().Be("john.doe@example.com");
        }

        /// <summary>
        /// Verifies that leading/trailing whitespace is trimmed from the full name.
        /// </summary>
        [Fact]
        public void ShouldTrimWhitespaceFromFullName_WhenCreated()
        {
            var user = new User(Guid.NewGuid(), "  John Doe  ", "john@test.com", "h", "s");
            user.FullName.Should().Be("John Doe");
        }

        /// <summary>
        /// Verifies that leading/trailing whitespace is trimmed from the email.
        /// </summary>
        [Fact]
        public void ShouldTrimWhitespaceFromEmail_WhenCreated()
        {
            var user = new User(Guid.NewGuid(), "John Doe", "  john@test.com  ", "h", "s");
            user.Email.Should().Be("john@test.com");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the user ID is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_IdIsEmpty()
        {
            Action act = () => new User(Guid.Empty, "John Doe", "email@test.com", "h", "s");
            act.Should().Throw<ArgumentException>().WithMessage("*User ID cannot be empty.*");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the full name is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_NameIsEmpty()
        {
            Action act = () => new User(Guid.NewGuid(), "", "email@test.com", "h", "s");
            act.Should().Throw<ArgumentException>().WithMessage("*Full name is required.*");
        }

        /// <summary>
        /// Verifies that an ArgumentException is thrown when the email is empty.
        /// </summary>
        [Fact]
        public void ShouldThrowException_When_EmailIsEmpty()
        {
            Action act = () => new User(Guid.NewGuid(), "John Doe", "", "h", "s");
            act.Should().Throw<ArgumentException>().WithMessage("*Email is required.*");
        }

        /// <summary>
        /// Verifies that a user can be created without a phone number.
        /// </summary>
        [Fact]
        public void ShouldAllowNullPhoneNumber_WhenCreated()
        {
            var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");
            user.PhoneNumber.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for domain methods of the User entity.
    /// </summary>
    public class DomainMethods
    {
        /// <summary>
        /// Verifies that UpdateProfile correctly updates all fields and sets the UpdatedAt timestamp.
        /// </summary>
        [Fact]
        public void UpdateProfile_ShouldChangeValuesAndSetTimestamp()
        {
            var user = new User(Guid.NewGuid(), "Old Name", "old@email.com", "h", "s");
            var newName = "New Name";
            var newEmail = "updated@email.com";
            var newPhone = "+987654321";

            user.UpdateProfile(newName, newEmail, newPhone);

            user.FullName.Should().Be(newName);
            user.Email.Should().Be(newEmail);
            user.PhoneNumber.Should().Be(newPhone);
            user.UpdatedAt.Should().NotBeNull();
            user.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }

        /// <summary>
        /// Verifies that UpdateProfile throws an ArgumentException when the new name is empty.
        /// </summary>
        [Fact]
        public void UpdateProfile_ShouldThrowException_When_NameIsEmpty()
        {
            var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");
            Action act = () => user.UpdateProfile("", "john@test.com", null);
            act.Should().Throw<ArgumentException>().WithMessage("*Full name cannot be empty.*");
        }

        /// <summary>
        /// Tests for the ChangePassword method of the User entity.
        /// </summary>
        public class ChangePassword
        {
            /// <summary>
            /// Verifies that ChangePassword correctly updates the password hash and salt.
            /// </summary>
            [Fact]
            public void ShouldUpdateHashAndSalt_WhenChanged()
            {
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "oldH", "oldS");
                var newH = "newH";
                var newS = "newS";

                user.ChangePassword(newH, newS);

                user.PasswordHash.Should().Be(newH);
                user.Salt.Should().Be(newS);
                user.UpdatedAt.Should().NotBeNull();
            }

            /// <summary>
            /// Verifies that ChangePassword throws an ArgumentException when hash or salt are empty.
            /// </summary>
            [Fact]
            public void ShouldThrowException_When_HashOrSaltIsEmpty()
            {
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");

                Action actHash = () => user.ChangePassword("", "s");
                actHash.Should().Throw<ArgumentException>();

                Action actSalt = () => user.ChangePassword("h", "");
                actSalt.Should().Throw<ArgumentException>();
            }
        }

        /// <summary>
        /// Tests for Two-Factor Authentication domain methods.
        /// </summary>
        public class TwoFactorAuthentication
        {
            /// <summary>
            /// Verifies that SetTwoFactorSecret sets the secret correctly.
            /// </summary>
            [Fact]
            public void SetTwoFactorSecret_ShouldSetSecret()
            {
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");
                var secret = "ABCDEF123456";

                user.SetTwoFactorSecret(secret);

                user.TwoFactorSecret.Should().Be(secret);
            }

            /// <summary>
            /// Verifies that SetTwoFactorSecret updates the timestamp.
            /// </summary>
            [Fact]
            public void SetTwoFactorSecret_ShouldUpdateTimestamp()
            {
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");

                user.SetTwoFactorSecret("ABCDEF123456");

                user.UpdatedAt.Should().NotBeNull();
                user.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            }

            /// <summary>
            /// Verifies that EnableTwoFactor enables 2FA.
            /// </summary>
            [Fact]
            public void EnableTwoFactor_ShouldEnable()
            {
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");
                user.SetTwoFactorSecret("SECRET");

                user.EnableTwoFactor();

                user.TwoFactorEnabled.Should().BeTrue();
            }

            /// <summary>
            /// Verifies that EnableTwoFactor updates the timestamp.
            /// </summary>
            [Fact]
            public void EnableTwoFactor_ShouldUpdateTimestamp()
            {
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");
                user.SetTwoFactorSecret("SECRET");

                user.EnableTwoFactor();

                user.UpdatedAt.Should().NotBeNull();
                user.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            }

            /// <summary>
            /// Verifies that DisableTwoFactor disables 2FA and clears the secret.
            /// </summary>
            [Fact]
            public void DisableTwoFactor_ShouldDisableAndClearSecret()
            {
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");
                user.SetTwoFactorSecret("SECRET");
                user.EnableTwoFactor();

                user.DisableTwoFactor();

                user.TwoFactorEnabled.Should().BeFalse();
                user.TwoFactorSecret.Should().BeNull();
            }

            /// <summary>
            /// Verifies that DisableTwoFactor updates the timestamp.
            /// </summary>
            [Fact]
            public void DisableTwoFactor_ShouldUpdateTimestamp()
            {
                var user = new User(Guid.NewGuid(), "John Doe", "john@test.com", "h", "s");
                user.SetTwoFactorSecret("SECRET");
                user.EnableTwoFactor();

                user.DisableTwoFactor();

                user.UpdatedAt.Should().NotBeNull();
                user.UpdatedAt!.Value.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            }
        }
    }
}
