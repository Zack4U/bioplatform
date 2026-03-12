using Bio.Application.DTOs;
using Bio.Application.Features.Users.Commands.CreateUser;
using FluentValidation.TestHelper;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Commands;

/// <summary>
/// Unit tests for the <see cref="CreateUserCommandValidator"/> class.
/// </summary>
public class CreateUserCommandValidatorTests
{
    private readonly CreateUserCommandValidator _validator;

    public CreateUserCommandValidatorTests()
    {
        _validator = new CreateUserCommandValidator();
    }

    /// <summary>
    /// Tests for the validation rules of CreateUserCommand.
    /// </summary>
    public class ValidationRules : CreateUserCommandValidatorTests
    {
        /// <summary>
        /// Verifies that an error is returned when FullName is empty.
        /// </summary>
        [Fact]
        public void Should_HaveError_When_FullNameIsEmpty()
        {
            var dto = new UserCreateDTO { FullName = "", Email = "test@test.com", Password = "password", PhoneNumber = "123" };
            var command = new CreateUserCommand(dto);
            var result = _validator.TestValidate(command);
            result.ShouldHaveValidationErrorFor(x => x.Dto.FullName);
        }

        /// <summary>
        /// Verifies that an error is returned when Email is invalid.
        /// </summary>
        [Fact]
        public void Should_HaveError_When_EmailIsInvalid()
        {
            var dto = new UserCreateDTO { FullName = "John Doe", Email = "invalid-email", Password = "password", PhoneNumber = "123" };
            var command = new CreateUserCommand(dto);
            var result = _validator.TestValidate(command);
            result.ShouldHaveValidationErrorFor(x => x.Dto.Email);
        }

        /// <summary>
        /// Verifies that an error is returned when Password is too short.
        /// </summary>
        [Fact]
        public void Should_HaveError_When_PasswordIsTooShort()
        {
            var dto = new UserCreateDTO { FullName = "John Doe", Email = "test@test.com", Password = "short", PhoneNumber = "123" };
            var command = new CreateUserCommand(dto);
            var result = _validator.TestValidate(command);
            result.ShouldHaveValidationErrorFor(x => x.Dto.Password);
        }

        /// <summary>
        /// Verifies that no errors are returned when the command is valid.
        /// </summary>
        [Fact]
        public void Should_NotHaveError_When_CommandIsValid()
        {
            var dto = new UserCreateDTO { FullName = "John Doe", Email = "test@test.com", Password = "securepassword", PhoneNumber = "1234567890" };
            var command = new CreateUserCommand(dto);
            var result = _validator.TestValidate(command);
            result.ShouldNotHaveAnyValidationErrors();
        }
    }
}
