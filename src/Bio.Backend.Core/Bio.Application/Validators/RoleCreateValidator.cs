using Bio.Application.DTOs;
using FluentValidation;

namespace Bio.Application.Validators;

/// <summary>
/// Validator for the <see cref="RoleCreateDTO"/> object.
/// </summary>
public class RoleCreateValidator : AbstractValidator<RoleCreateDTO>
{
    public RoleCreateValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Role name is required.")
            .MaximumLength(100).WithMessage("Role name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.");
    }
}
