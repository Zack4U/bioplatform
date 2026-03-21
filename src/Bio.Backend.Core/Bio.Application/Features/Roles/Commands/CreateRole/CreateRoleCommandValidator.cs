using Bio.Application.Features.Roles.Commands.CreateRole;
using FluentValidation;

namespace Bio.Application.Features.Roles.Commands.CreateRole;

/// <summary>
/// Validator for the CreateRoleCommand.
/// </summary>
public class CreateRoleCommandValidator : AbstractValidator<CreateRoleCommand>
{
    public CreateRoleCommandValidator()
    {
        RuleFor(x => x.Dto.Name)
            .NotEmpty().WithMessage("Role name is required.")
            .MaximumLength(50).WithMessage("Role name must not exceed 50 characters.");

        RuleFor(x => x.Dto.Description)
            .MaximumLength(250).WithMessage("Description must not exceed 250 characters.");
    }
}
