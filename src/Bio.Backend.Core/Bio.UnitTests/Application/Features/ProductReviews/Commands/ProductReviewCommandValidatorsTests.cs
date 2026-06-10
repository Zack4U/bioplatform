using Bio.Application.DTOs;
using Bio.Application.Features.ProductReviews.Commands;
using FluentValidation.TestHelper;
using Xunit;

namespace Bio.UnitTests.Application.Features.ProductReviews.Commands;

public class ProductReviewCommandValidatorsTests
{
    private readonly CreateProductReviewCommandValidator _createValidator = new();
    private readonly UpdateProductReviewCommandValidator _updateValidator = new();

    [Fact]
    public void CreateProductReview_ShouldHaveError_WhenRatingIsInvalid()
    {
        var cmd = new CreateProductReviewCommand(Guid.NewGuid(), new ProductReviewCreateDTO(6, "", ""), Guid.NewGuid());
        var result = _createValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Dto.Rating);
    }

    [Fact]
    public void UpdateProductReview_ShouldHaveError_WhenRatingIsInvalid()
    {
        var cmd = new UpdateProductReviewCommand(Guid.NewGuid(), new ProductReviewUpdateDTO(0, "", ""), Guid.NewGuid());
        var result = _updateValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Dto.Rating);
    }
}
