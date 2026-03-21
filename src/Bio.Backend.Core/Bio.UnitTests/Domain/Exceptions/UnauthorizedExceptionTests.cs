using Bio.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Exceptions;

/// <summary>
/// Unit tests for the <see cref="UnauthorizedException"/>.
/// Verifies inheritance, message assignment, and invalid input handling.
/// </summary>
public class UnauthorizedExceptionTests
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
            var exception = new UnauthorizedException("Invalid credentials.");

            // Assert
            exception.Should().BeAssignableTo<Exception>();
        }

        /// <summary>
        /// Positive Test: Verifies that the exception correctly stores the custom message.
        /// </summary>
        [Fact]
        public void ShouldSetMessageCorrectly()
        {
            // Arrange
            var message = "You must be logged in to view this resource.";

            // Act
            var exception = new UnauthorizedException(message);

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
            Action act = () => new UnauthorizedException(invalidMessage!);

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
            var exception = new UnauthorizedException("Test message");

            // Assert
            exception.Should().NotBeAssignableTo<int>();
        }
    }
}
