using Bio.Application.Features.Users.Commands.CreateUser;
using FluentValidation;

namespace Bio.Application.Features.Users.Commands.CreateUser;

/// <summary>
/// Validator for the CreateUserCommand.
/// </summary>
public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Dto.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(100).WithMessage("Full name must not exceed 100 characters.");

        RuleFor(x => x.Dto.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email address is required.");

        RuleFor(x => x.Dto.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters long.");

        RuleFor(x => x.Dto.PhoneNumber)
            .MaximumLength(20).WithMessage("Phone number must not exceed 20 characters.");
    }
}
