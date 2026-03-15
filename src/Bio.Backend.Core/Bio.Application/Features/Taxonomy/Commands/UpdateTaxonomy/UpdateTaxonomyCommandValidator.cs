using FluentValidation;

namespace Bio.Application.Features.Taxonomy.Commands.UpdateTaxonomy;

public class UpdateTaxonomyCommandValidator : AbstractValidator<UpdateTaxonomyCommand>
{
    public UpdateTaxonomyCommandValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
        RuleFor(x => x.Dto.Kingdom).MaximumLength(50).When(x => x.Dto.Kingdom != null);
        RuleFor(x => x.Dto.Phylum).MaximumLength(50).When(x => x.Dto.Phylum != null);
        RuleFor(x => x.Dto.ClassName).MaximumLength(50).When(x => x.Dto.ClassName != null);
        RuleFor(x => x.Dto.OrderName).MaximumLength(50).When(x => x.Dto.OrderName != null);
        RuleFor(x => x.Dto.Family).MaximumLength(50).When(x => x.Dto.Family != null);
        RuleFor(x => x.Dto.Genus).MaximumLength(50).When(x => x.Dto.Genus != null);
    }
}
