using Bio.Application.DTOs;
using Bio.Application.Features.Products.Commands.CreateProduct;
using Bio.Application.Features.Products.Commands.UpdateProduct;
using FluentValidation.TestHelper;

namespace Bio.UnitTests.Application.Features.Products;

public class ProductCommandValidatorsTests
{
    private readonly CreateProductCommandValidator _createValidator;
    private readonly UpdateProductCommandValidator _updateValidator;

    public ProductCommandValidatorsTests()
    {
        _createValidator = new CreateProductCommandValidator();
        _updateValidator = new UpdateProductCommandValidator();
    }

    [Fact]
    public void CreateProductValidator_ShouldHaveError_WhenNameIsEmpty()
    {
        var dto = new ProductCreateDTO { Name = "" };
        var command = new CreateProductCommand(dto);
        var result = _createValidator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Dto.Name);
    }

    [Fact]
    public void CreateProductValidator_ShouldHaveError_WhenPriceIsZero()
    {
        var dto = new ProductCreateDTO { Name = "Valid", Price = 0 };
        var command = new CreateProductCommand(dto);
        var result = _createValidator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Dto.Price);
    }

    [Fact]
    public void UpdateProductValidator_ShouldHaveError_WhenIdIsEmpty()
    {
        var dto = new ProductUpdateDTO { Name = "Valid", Price = 10 };
        var command = new UpdateProductCommand(Guid.Empty, dto);
        var result = _updateValidator.TestValidate(command);
        result.ShouldHaveValidationErrorFor(x => x.Id);
    }
}
