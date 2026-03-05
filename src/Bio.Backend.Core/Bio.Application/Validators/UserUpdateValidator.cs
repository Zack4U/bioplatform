using Bio.Application.DTOs;
using FluentValidation;

namespace Bio.Application.Validators;

/// <summary>
/// Validator for the <see cref="UserUpdateDTO"/> object.
/// Enforces the same rules as creation, except for the password.
/// </summary>
public class UserUpdateValidator : AbstractValidator<UserUpdateDTO>
{
    /// <summary>
    /// Initializes a new instance of <see cref="UserUpdateValidator"/> with specific validation rules.
    /// </summary>
    public UserUpdateValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(150).WithMessage("Full name cannot exceed 150 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email format is invalid.")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters.");

        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Phone number is required.")
            .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters.");
    }
}
