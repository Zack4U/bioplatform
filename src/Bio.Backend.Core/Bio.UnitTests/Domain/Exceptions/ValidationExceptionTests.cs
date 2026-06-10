using Bio.Domain.Exceptions;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Exceptions;

/// <summary>
/// Unit tests for the <see cref="ValidationException"/>.
/// Verifies that it inherits from the base Exception class and correctly sets its message.
/// </summary>
public class ValidationExceptionTests
{
    /// <summary>
    /// Tests that the exception inherits from the base Exception class.
    /// </summary>
    [Fact]
    public void ShouldInheritFromException()
    {
        // Arrange
        var exception = new ValidationException("Test message");

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
        var message = "A validation error occurred.";

        // Act
        var exception = new ValidationException(message);

        // Assert
        exception.Message.Should().Be(message);
    }

    /// <summary>
    /// Negative Test: Verifies that the exception's message does not match an incorrect value.
    /// </summary>
    [Fact]
    public void ShouldNotHaveIncorrectMessage()
    {
        // Arrange
        var exception = new ValidationException("Correct Message");

        // Assert
        exception.Message.Should().NotBe("Incorrect Message");
    }

    /// <summary>
    /// Tests that the exception is not assignable to an unrelated type.
    /// </summary>
    [Fact]
    public void ShouldNotBeAssignableToUnrelatedType()
    {
        // Arrange
        var exception = new ValidationException("Test message");

        // Assert
        exception.Should().NotBeAssignableTo<string>();
    }

    /// <summary>
    /// Tests that the exception throws an exception when the message is empty.
    /// </summary>
    [Fact]
    public void ShouldThrowException_When_MessageIsEmpty()
    {
        // Act
        Action act = () => new ValidationException("");

        // Assert
        act.Should().Throw<ArgumentException>().WithMessage("*Exception message cannot be empty.*");
    }
}
