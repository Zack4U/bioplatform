using FluentValidation;

namespace Bio.Application.Features.Products.Commands.CreateProduct;

public class CreateProductCommandValidator : AbstractValidator<CreateProductCommand>
{
    public CreateProductCommandValidator()
    {
        RuleFor(x => x.Dto.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.Dto.Slug)
            .NotEmpty().WithMessage("Slug is required.")
            .MaximumLength(150).WithMessage("Slug must not exceed 150 characters.");

        RuleFor(x => x.Dto.Price)
            .GreaterThan(0).WithMessage("Price must be greater than zero.");

        RuleFor(x => x.Dto.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("Stock quantity cannot be negative.");

        RuleFor(x => x.Dto.EntrepreneurId)
            .NotEmpty().WithMessage("Entrepreneur Id is required.");

        RuleFor(x => x.Dto.BaseSpeciesId)
            .NotEmpty().WithMessage("Base Species Id is required.");

        RuleFor(x => x.Dto.Sku)
            .MaximumLength(50).WithMessage("SKU must not exceed 50 characters.");

        RuleFor(x => x.Dto.ThumbnailUrl)
            .MaximumLength(500).WithMessage("Thumbnail URL must not exceed 500 characters.");
    }
}
