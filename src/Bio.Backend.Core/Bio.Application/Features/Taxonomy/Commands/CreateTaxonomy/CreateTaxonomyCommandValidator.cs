using FluentValidation;

namespace Bio.Application.Features.Taxonomy.Commands.CreateTaxonomy;

public class CreateTaxonomyCommandValidator : AbstractValidator<CreateTaxonomyCommand>
{
    public CreateTaxonomyCommandValidator()
    {
        RuleFor(x => x.Dto.Kingdom).MaximumLength(50);
        RuleFor(x => x.Dto.Phylum).MaximumLength(50);
        RuleFor(x => x.Dto.ClassName).MaximumLength(50);
        RuleFor(x => x.Dto.OrderName).MaximumLength(50);
        RuleFor(x => x.Dto.Family).MaximumLength(50);
        RuleFor(x => x.Dto.Genus).MaximumLength(50);
    }
}
