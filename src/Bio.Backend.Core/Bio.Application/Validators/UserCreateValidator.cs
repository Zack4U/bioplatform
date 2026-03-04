using Bio.Application.DTOs;
using FluentValidation;

namespace Bio.Application.Validators;

/// <summary>
/// Validator for the <see cref="UserCreateDTO"/> object.
/// Uses FluentValidation to enforce business rules and data integrity.
/// </summary>
public class UserCreateValidator : AbstractValidator<UserCreateDTO>
{
    /// <summary>
    /// Initializes a new instance of <see cref="UserCreateValidator"/> with specific validation rules.
    /// </summary>
    public UserCreateValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(150).WithMessage("Full name cannot exceed 150 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email format is invalid.")
            .MaximumLength(100).WithMessage("Email cannot exceed 100 characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long.");
        
        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20).WithMessage("Phone number cannot exceed 20 characters.");
    }
}
