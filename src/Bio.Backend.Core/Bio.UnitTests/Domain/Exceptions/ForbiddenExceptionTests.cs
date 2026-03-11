using Bio.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Exceptions;

/// <summary>
/// Unit tests for the <see cref="ForbiddenException"/>.
/// Verifies inheritance, message assignment, and empty input handling.
/// </summary>
public class ForbiddenExceptionTests
{
    /// <summary>
    /// Tests for the constructor of the exception.
    /// </summary>
    public class Constructor
    {
        /// <summary>
        /// Verifies that the exception inherits from the base Exception class.
        /// </summary>
        [Fact]
        public void ShouldInheritFromException()
        {
            // Arrange
            var exception = new ForbiddenException("Access denied.");

            // Assert
            exception.Should().BeAssignableTo<Exception>();
        }

        /// <summary>
        /// Positive Test: Verifies that the exception correctly stores the custom message provided.
        /// </summary>
        [Fact]
        public void ShouldSetMessageCorrectly()
        {
            // Arrange
            var message = "You do not have permission to delete this user.";

            // Act
            var exception = new ForbiddenException(message);

            // Assert
            exception.Message.Should().Be(message);
        }

        /// <summary>
        /// Tests that the exception throws an ArgumentException when the message is invalid.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ShouldThrowException_When_MessageIsInvalid(string? invalidMessage)
        {
            // Act
            Action act = () => new ForbiddenException(invalidMessage!);

            // Assert
            act.Should().Throw<ArgumentException>()
               .WithMessage("*Exception message cannot be empty.*");
        }

        /// <summary>
        /// Tests that the exception is not assignable to an unrelated type.
        /// </summary>
        [Fact]
        public void ShouldNotBeAssignableToUnrelatedType()
        {
            // Arrange
            var exception = new ForbiddenException("Test message");

            // Assert
            exception.Should().NotBeAssignableTo<int>();
        }
    }
}
