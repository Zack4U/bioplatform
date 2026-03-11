using Bio.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Exceptions;

/// <summary>
/// Unit tests for the <see cref="NotFoundException"/>.
/// Verifies that it inherits from Exception, sets messages correctly for both constructors, and handles invalid inputs.
/// </summary>
public class NotFoundExceptionTests
{
    /// <summary>
    /// Tests for the default string message constructor.
    /// </summary>
    public class MessageConstructor
    {
        /// <summary>
        /// Verifies that the exception inherits from the base Exception class.
        /// </summary>
        [Fact]
        public void ShouldInheritFromException()
        {
            // Arrange
            var exception = new NotFoundException("User not found.");

            // Assert
            exception.Should().BeAssignableTo<Exception>();
        }

        /// <summary>
        /// Positive Test: Verifies that the exception correctly stores the message provided in the constructor.
        /// </summary>
        [Fact]
        public void ShouldSetMessageCorrectly()
        {
            // Arrange
            var message = "Role not found in the system.";

            // Act
            var exception = new NotFoundException(message);

            // Assert
            exception.Message.Should().Be(message);
        }

        /// <summary>
        /// Tests that the exception throws an ArgumentException when the message is null or entirely whitespace.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ShouldThrowException_When_MessageIsInvalid(string? invalidMessage)
        {
            // Act
            Action act = () => new NotFoundException(invalidMessage!);

            // Assert
            act.Should().Throw<ArgumentException>().WithMessage("*Exception message cannot be empty.*");
        }

        /// <summary>
        /// Tests that the exception is not assignable to an unrelated type.
        /// </summary>
        [Fact]
        public void ShouldNotBeAssignableToUnrelatedType()
        {
            // Arrange
            var exception = new NotFoundException("Test message");

            // Assert
            exception.Should().NotBeAssignableTo<int>();
        }
    }

    /// <summary>
    /// Tests for the structured constructor that takes an entity name and a key.
    /// </summary>
    public class EntityKeyConstructor
    {
        /// <summary>
        /// Positive Test: Verifies that the exception generates the correct formatted message.
        /// </summary>
        [Fact]
        public void ShouldSetFormattedMessageCorrectly()
        {
            // Arrange
            var entityName = "User";
            var key = Guid.NewGuid();
            var expectedMessage = $"Entity \"{entityName}\" ({key}) was not found.";

            // Act
            var exception = new NotFoundException(entityName, key);

            // Assert
            exception.Message.Should().Be(expectedMessage);
        }

        /// <summary>
        /// Tests that the exception throws an ArgumentException when the entity name is null or whitespace.
        /// </summary>
        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        public void ShouldThrowException_When_EntityNameIsInvalid(string? invalidEntityName)
        {
            // Arrange
            var key = Guid.NewGuid();

            // Act
            Action act = () => new NotFoundException(invalidEntityName!, key);

            // Assert
            act.Should().Throw<ArgumentException>()
               .WithMessage("*Entity name cannot be empty.*");
        }
        
        /// <summary>
        /// Tests that the exception handles a null key gracefully by using its ToString representation.
        /// </summary>
        [Fact]
        public void ShouldFormatMessageGracefully_When_KeyIsNull()
        {
            // Arrange
            var entityName = "Config";
            object? nullKey = null;
            var expectedMessage = $"Entity \"{entityName}\" () was not found."; 

            // Act
            var exception = new NotFoundException(entityName, nullKey!);

            // Assert
            exception.Message.Should().Be(expectedMessage);
        }
    }
}
