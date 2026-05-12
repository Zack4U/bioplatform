using Bio.Application.DTOs;
using Bio.Application.Features.Cart.Queries;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Cart.Queries;

public class CartQueriesTests
{
    private readonly Mock<ICartRepository> _cartRepoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();

    [Fact]
    public async Task GetCart_ShouldReturnCart()
    {
        var handler = new GetCartQueryHandler(_cartRepoMock.Object);
        var uid = Guid.NewGuid();
        var cart = new Bio.Domain.Entities.Cart(uid);

        _cartRepoMock.Setup(r => r.GetByUserIdAsync(uid, default)).ReturnsAsync(cart);

        var result = await handler.Handle(new GetCartQuery(uid), default);

        result.Should().NotBeNull();
        result!.UserId.Should().Be(uid);
    }

    [Fact]
    public async Task ValidateCartPrices_ShouldReturnValidationItems()
    {
        var handler = new ValidateCartPricesQueryHandler(_productRepoMock.Object);
        var pid = Guid.NewGuid();
        var dto = new CartValidatePricesRequestDTO { Items = new List<CartValidatePricesRequestItemDTO> { new(pid, 1) } };
        var product = new Bio.Domain.Entities.Product(Guid.NewGuid(), Guid.NewGuid(), "P", "p", "D", 10, 10, 5, null, null, null, null);
        product.Activate();

        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(product);

        var result = await handler.Handle(new ValidateCartPricesQuery(dto), default);

        result.Items.Should().HaveCount(1);
        result.Items[0].ProductName.Should().Be("P");
        result.Items[0].CurrentPrice.Should().Be(10);
    }
}
