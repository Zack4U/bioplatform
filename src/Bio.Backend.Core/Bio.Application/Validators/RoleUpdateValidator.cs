using FluentValidation;
using Bio.Application.DTOs;

namespace Bio.Application.Validators;

/// <summary>
/// Validator for the RoleUpdateDTO.
/// </summary>
public class RoleUpdateValidator : AbstractValidator<RoleUpdateDTO>
{
    public RoleUpdateValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Role name is required.")
            .MaximumLength(100).WithMessage("Role name cannot exceed 100 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters.");
    }
}
