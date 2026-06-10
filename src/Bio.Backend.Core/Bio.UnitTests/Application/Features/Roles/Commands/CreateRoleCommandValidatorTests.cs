using Bio.Application.DTOs;
using Bio.Application.Features.Roles.Commands.CreateRole;
using FluentValidation.TestHelper;
using Xunit;

namespace Bio.UnitTests.Application.Features.Roles.Commands;

/// <summary>
/// Unit tests for the <see cref="CreateRoleCommandValidator"/> class.
/// </summary>
public class CreateRoleCommandValidatorTests
{
    private readonly CreateRoleCommandValidator _validator;

    public CreateRoleCommandValidatorTests()
    {
        _validator = new CreateRoleCommandValidator();
    }

    /// <summary>
    /// Tests for the validation rules of CreateRoleCommand.
    /// </summary>
    public class ValidationRules : CreateRoleCommandValidatorTests
    {
        /// <summary>
        /// Verifies that an error is returned when Name is empty.
        /// </summary>
        [Fact]
        public void Should_HaveError_When_NameIsEmpty()
        {
            var dto = new RoleCreateDTO("", "Description");
            var command = new CreateRoleCommand(dto);
            var result = _validator.TestValidate(command);
            result.ShouldHaveValidationErrorFor(x => x.Dto.Name);
        }

        /// <summary>
        /// Verifies that an error is returned when Name exceeds maximum length.
        /// </summary>
        [Fact]
        public void Should_HaveError_When_NameExceedsMaxLength()
        {
            var dto = new RoleCreateDTO(new string('A', 51), "Description");
            var command = new CreateRoleCommand(dto);
            var result = _validator.TestValidate(command);
            result.ShouldHaveValidationErrorFor(x => x.Dto.Name);
        }

        /// <summary>
        /// Verifies that no errors are returned when the command is valid.
        /// </summary>
        [Fact]
        public void Should_NotHaveError_When_CommandIsValid()
        {
            var dto = new RoleCreateDTO("Admin", "Administrator role");
            var command = new CreateRoleCommand(dto);
            var result = _validator.TestValidate(command);
            result.ShouldNotHaveAnyValidationErrors();
        }
    }
}
