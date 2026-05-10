using Bio.Application.Features.AbsPermits.Commands;
using FluentValidation;

namespace Bio.Application.Features.AbsPermits.Commands;

public class CreateAbsPermitCommandValidator : AbstractValidator<CreateAbsPermitCommand>
{
    public CreateAbsPermitCommandValidator()
    {
        RuleFor(x => x.Dto.EntrepreneurId).NotEmpty();
        RuleFor(x => x.Dto.SpeciesId).NotEmpty();
        RuleFor(x => x.Dto.ResolutionNumber).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Dto.GrantingAuthority).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Dto.EmissionDate)
            .NotEmpty()
            .LessThanOrEqualTo(DateTime.UtcNow.AddDays(1))
            .WithMessage("Emission date cannot be in the future.");
        RuleFor(x => x.Dto.ExpirationDate)
            .NotEmpty()
            .GreaterThan(x => x.Dto.EmissionDate)
            .WithMessage("Expiration date must be after the emission date.");
        RuleFor(x => x.Dto.LegalFramework).MaximumLength(500).When(x => x.Dto.LegalFramework != null);
    }
}
