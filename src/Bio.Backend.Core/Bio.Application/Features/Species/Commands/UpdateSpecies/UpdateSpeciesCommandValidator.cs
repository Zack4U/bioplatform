using FluentValidation;

namespace Bio.Application.Features.Species.Commands.UpdateSpecies;

public class UpdateSpeciesCommandValidator : AbstractValidator<UpdateSpeciesCommand>
{
    public UpdateSpeciesCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Dto.Slug).MaximumLength(150).When(x => x.Dto.Slug != null);
        RuleFor(x => x.Dto.ThumbnailUrl).MaximumLength(500).When(x => x.Dto.ThumbnailUrl != null);
        RuleFor(x => x.Dto.CommonName).MaximumLength(255).When(x => x.Dto.CommonName != null);
        RuleFor(x => x.Dto.EconomicPotential).MaximumLength(255).When(x => x.Dto.EconomicPotential != null);
        RuleFor(x => x.Dto.ConservationStatus).MaximumLength(100).When(x => x.Dto.ConservationStatus != null);
    }
}
