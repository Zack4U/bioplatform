using Bio.Application.Behaviors;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Behaviors;

/// <summary>
/// Unit tests for the <see cref="ValidationBehavior{TRequest, TResponse}"/> class.
/// </summary>
public class ValidationBehaviorTests
{
    private readonly Mock<IValidator<TestRequest>> _validatorMock;
    private readonly List<IValidator<TestRequest>> _validators;

    public ValidationBehaviorTests()
    {
        _validatorMock = new Mock<IValidator<TestRequest>>();
        _validators = new List<IValidator<TestRequest>> { _validatorMock.Object };
    }

    /// <summary>
    /// Test request class for validation.
    /// </summary>
    public class TestRequest : IRequest<TestResponse> { }

    /// <summary>
    /// Test response class for validation.
    /// </summary>
    public class TestResponse { }

    /// <summary>
    /// Helper to match RequestHandlerDelegate signature.
    /// Trying with CancellationToken as it might be required in newer versions or specific delegates.
    /// </summary>
    private Task<TestResponse> Next(CancellationToken ct) => Task.FromResult(new TestResponse());

    /// <summary>
    /// Tests for the Handle method of ValidationBehavior.
    /// </summary>
    public class Handle : ValidationBehaviorTests
    {
        /// <summary>
        /// Verifies that the behavior proceeds to the next step when there are no validators.
        /// </summary>
        [Fact]
        public async Task Should_ProceedToNext_When_NoValidatorsExist()
        {
            // Arrange
            var behavior = new ValidationBehavior<TestRequest, TestResponse>(new List<IValidator<TestRequest>>());
            var request = new TestRequest();

            // Act
            var result = await behavior.Handle(request, Next, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
        }

        /// <summary>
        /// Verifies that the behavior proceeds to the next step when all validations pass.
        /// </summary>
        [Fact]
        public async Task Should_ProceedToNext_When_ValidationPasses()
        {
            // Arrange
            var behavior = new ValidationBehavior<TestRequest, TestResponse>(_validators);
            var request = new TestRequest();

            _validatorMock.Setup(v => v.ValidateAsync(
                It.IsAny<ValidationContext<TestRequest>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            // Act
            var result = await behavior.Handle(request, Next, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
        }

        /// <summary>
        /// Verifies that the behavior throws a ValidationException when validations fail.
        /// </summary>
        [Fact]
        public async Task Should_ThrowValidationException_When_ValidationFails()
        {
            // Arrange
            var behavior = new ValidationBehavior<TestRequest, TestResponse>(_validators);
            var request = new TestRequest();

            var failures = new List<ValidationFailure> { new("Property", "Error message") };
            _validatorMock.Setup(v => v.ValidateAsync(
                It.IsAny<ValidationContext<TestRequest>>(),
                It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult(failures));

            // Act
            Func<Task> act = async () => await behavior.Handle(request, Next, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<ValidationException>();
        }
    }
}
