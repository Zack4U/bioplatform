using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="Order"/> domain entity.
/// </summary>
public class OrderTests
{
    private static readonly Guid BuyerId = Guid.NewGuid();
    private const string OrderNumber = "ORD-2024-001";
    private const decimal TotalAmount = 119.00m;
    private const decimal SubtotalAmount = 100.00m;

    /// <summary>
    /// Tests for the initialization of the Order entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that an Order is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var order = new Order(BuyerId, OrderNumber, TotalAmount, SubtotalAmount);

            // Assert
            order.Id.Should().NotBeEmpty();
            order.BuyerId.Should().Be(BuyerId);
            order.OrderNumber.Should().Be(OrderNumber);
            order.TotalAmount.Should().Be(TotalAmount);
            order.SubtotalAmount.Should().Be(SubtotalAmount);
            order.Status.Should().Be("Pending");
            order.TaxAmount.Should().Be(0);
            order.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            order.OrderItems.Should().BeEmpty();
        }
    }
}
