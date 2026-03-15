using FluentValidation;

namespace Bio.Application.Features.Species.Commands.CreateSpecies;

public class CreateSpeciesCommandValidator : AbstractValidator<CreateSpeciesCommand>
{
    public CreateSpeciesCommandValidator()
    {
        RuleFor(x => x.Dto.ScientificName).NotEmpty().WithMessage("Scientific name is required.").MaximumLength(255);
        RuleFor(x => x.Dto.Slug).NotEmpty().WithMessage("Slug is required.").MaximumLength(150);
        RuleFor(x => x.Dto.ThumbnailUrl).MaximumLength(500);
        RuleFor(x => x.Dto.CommonName).MaximumLength(255);
        RuleFor(x => x.Dto.EconomicPotential).MaximumLength(255);
        RuleFor(x => x.Dto.ConservationStatus).MaximumLength(100);
    }
}
