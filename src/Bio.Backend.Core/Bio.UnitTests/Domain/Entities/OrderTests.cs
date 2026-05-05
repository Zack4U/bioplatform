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
    private const decimal SubtotalAmount = 100.00m;
    private const decimal TotalAmount = 119.00m;
    private const string PaymentMethod = "Stripe";

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
            var order = new Order(BuyerId, OrderNumber, SubtotalAmount, TotalAmount, PaymentMethod, taxAmount: 19.00m);

            // Assert
            order.Id.Should().NotBeEmpty();
            order.BuyerId.Should().Be(BuyerId);
            order.OrderNumber.Should().Be(OrderNumber);
            order.SubtotalAmount.Should().Be(SubtotalAmount);
            order.TotalAmount.Should().Be(TotalAmount);
            order.TaxAmount.Should().Be(19.00m);
            order.PaymentMethod.Should().Be(PaymentMethod);
            order.Status.Should().Be("Pending");
            order.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            order.OrderItems.Should().BeEmpty();
        }
    }

    /// <summary>
    /// Tests for Order entity behavior methods.
    /// </summary>
    public class Behavior
    {
        private static Order CreateTestOrder() =>
            new(BuyerId, OrderNumber, SubtotalAmount, TotalAmount, PaymentMethod);

        [Fact]
        public void UpdateStatus_ShouldChangeStatus()
        {
            var order = CreateTestOrder();
            order.UpdateStatus("Paid");

            order.Status.Should().Be("Paid");
            order.UpdatedAt.Should().NotBeNull();
        }

        [Fact]
        public void UpdateStatus_ShouldThrow_WhenEmpty()
        {
            var order = CreateTestOrder();
            var act = () => order.UpdateStatus("");

            act.Should().Throw<ArgumentException>().WithMessage("*Status*");
        }

        [Fact]
        public void SetPaymentInfo_ShouldUpdateFields()
        {
            var order = CreateTestOrder();
            order.SetPaymentInfo("pi_12345", "PSE");

            order.TransactionRef.Should().Be("pi_12345");
            order.PaymentMethod.Should().Be("PSE");
        }

        [Fact]
        public void SetAddresses_ShouldUpdateAddressIds()
        {
            var order = CreateTestOrder();
            var shippingId = Guid.NewGuid();
            var billingId = Guid.NewGuid();

            order.SetAddresses(shippingId, billingId);

            order.ShippingAddressId.Should().Be(shippingId);
            order.BillingAddressId.Should().Be(billingId);
        }
    }
}
