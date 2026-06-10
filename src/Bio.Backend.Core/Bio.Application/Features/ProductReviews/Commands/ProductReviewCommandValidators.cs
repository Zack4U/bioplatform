using Bio.Application.Features.ProductReviews.Commands;
using FluentValidation;

namespace Bio.Application.Features.ProductReviews.Commands;

public class CreateProductReviewCommandValidator : AbstractValidator<CreateProductReviewCommand>
{
    public CreateProductReviewCommandValidator()
    {
        RuleFor(x => x.ProductId).NotEmpty();
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.Dto.Rating)
            .InclusiveBetween(1, 5).WithMessage("Rating must be between 1 and 5.");
        RuleFor(x => x.Dto.Title)
            .MaximumLength(150).When(x => x.Dto.Title != null);
        RuleFor(x => x.Dto.Comment)
            .MaximumLength(2000).When(x => x.Dto.Comment != null);
    }
}

public class UpdateProductReviewCommandValidator : AbstractValidator<UpdateProductReviewCommand>
{
    public UpdateProductReviewCommandValidator()
    {
        RuleFor(x => x.ReviewId).NotEmpty();
        RuleFor(x => x.Dto.Rating)
            .InclusiveBetween(1, 5).When(x => x.Dto.Rating.HasValue)
            .WithMessage("Rating must be between 1 and 5.");
        RuleFor(x => x.Dto.Title)
            .MaximumLength(150).When(x => x.Dto.Title != null);
        RuleFor(x => x.Dto.Comment)
            .MaximumLength(2000).When(x => x.Dto.Comment != null);
    }
}
