using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="OrderItem"/> domain entity.
/// </summary>
public class OrderItemTests
{
    private static readonly Guid OrderId = Guid.NewGuid();
    private static readonly Guid ProductId = Guid.NewGuid();
    private const int Quantity = 3;
    private const decimal UnitPrice = 15.00m;

    /// <summary>
    /// Tests for the initialization of the OrderItem entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that an OrderItem is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var item = new OrderItem(OrderId, ProductId, Quantity, UnitPrice);

            // Assert
            item.Id.Should().NotBeEmpty();
            item.OrderId.Should().Be(OrderId);
            item.ProductId.Should().Be(ProductId);
            item.Quantity.Should().Be(Quantity);
            item.UnitPrice.Should().Be(UnitPrice);
            item.TotalPrice.Should().Be(Quantity * UnitPrice);
        }
    }
}
