using FluentValidation;

namespace Bio.Application.Features.Products.Commands;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Dto.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Dto.Slug).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Dto.Description).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.Dto.BasePrice).GreaterThan(0);
        RuleFor(x => x.Dto.SellPrice).GreaterThan(0);
        RuleFor(x => x.Dto.StockQuantity).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Dto.BaseSpeciesId).NotEmpty();
        RuleFor(x => x.EntrepreneurId).NotEmpty();
    }
}
