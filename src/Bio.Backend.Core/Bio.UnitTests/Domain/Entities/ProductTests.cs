using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="Product"/> domain entity.
/// </summary>
public class ProductTests
{
    private static readonly Guid EntrepreneurId = Guid.NewGuid();
    private static readonly Guid BaseSpeciesId = Guid.NewGuid();
    private const string Name = "Organic Fertilizer";
    private const string Description = "High quality organic fertilizer.";
    private const decimal Price = 25.50m;
    private const int StockQuantity = 100;

    /// <summary>
    /// Tests for the initialization of the Product entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a Product is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var product = new Product(EntrepreneurId, BaseSpeciesId, Name, Description, Price, StockQuantity);

            // Assert
            product.Id.Should().NotBeEmpty();
            product.EntrepreneurId.Should().Be(EntrepreneurId);
            product.BaseSpeciesId.Should().Be(BaseSpeciesId);
            product.Name.Should().Be(Name);
            product.Description.Should().Be(Description);
            product.Price.Should().Be(Price);
            product.StockQuantity.Should().Be(StockQuantity);
            product.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            product.IsActive.Should().BeTrue();
            product.Reviews.Should().BeEmpty();
            product.Certifications.Should().BeEmpty();
        }
    }
}
