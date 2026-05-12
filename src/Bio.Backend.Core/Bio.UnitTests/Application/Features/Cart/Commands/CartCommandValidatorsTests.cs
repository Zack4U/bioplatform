using Bio.Application.DTOs;
using Bio.Application.Features.Cart.Commands;
using FluentValidation.TestHelper;
using Xunit;

namespace Bio.UnitTests.Application.Features.Cart.Commands;

public class CartCommandValidatorsTests
{
    private readonly AddCartItemCommandValidator _addValidator = new();
    private readonly UpdateCartItemCommandValidator _updateValidator = new();

    [Fact]
    public void AddCartItem_ShouldHaveError_WhenQuantityIsZero()
    {
        var cmd = new AddCartItemCommand(Guid.NewGuid(), new CartItemAddDTO(Guid.NewGuid(), 0));
        var result = _addValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Dto.Quantity);
    }

    [Fact]
    public void UpdateCartItem_ShouldHaveError_WhenQuantityIsZero()
    {
        var cmd = new UpdateCartItemCommand(Guid.NewGuid(), Guid.NewGuid(), new CartItemUpdateDTO(0));
        var result = _updateValidator.TestValidate(cmd);
        result.ShouldHaveValidationErrorFor(x => x.Dto.Quantity);
    }
}
