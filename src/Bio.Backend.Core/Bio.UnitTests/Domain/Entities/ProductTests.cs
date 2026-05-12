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
    private const string Slug = "organic-fertilizer";
    private const string Description = "High quality organic fertilizer.";
    private const decimal BasePrice = 20.00m;
    private const decimal SellPrice = 25.50m;
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
            var product = new Product(EntrepreneurId, BaseSpeciesId, Name, Slug, Description, BasePrice, SellPrice, StockQuantity);

            // Assert
            product.Id.Should().NotBeEmpty();
            product.EntrepreneurId.Should().Be(EntrepreneurId);
            product.BaseSpeciesId.Should().Be(BaseSpeciesId);
            product.Name.Should().Be(Name);
            product.Slug.Should().Be(Slug);
            product.Description.Should().Be(Description);
            product.BasePrice.Should().Be(BasePrice);
            product.SellPrice.Should().Be(SellPrice);
            product.StockQuantity.Should().Be(StockQuantity);
            product.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            product.IsActive.Should().BeFalse("Products start inactive until approved by authority");
            product.Reviews.Should().BeEmpty();
            product.Certifications.Should().BeEmpty();
            product.Images.Should().BeEmpty();
        }

        /// <summary>
        /// Verifies that a Product can be created with optional fields.
        /// </summary>
        [Fact]
        public void ShouldSetOptionalProperties_WhenProvided()
        {
            // Act
            var product = new Product(
                EntrepreneurId, BaseSpeciesId, Name, Slug, Description,
                BasePrice, SellPrice, StockQuantity,
                categoryId: 1, sku: "ORG-FERT-001",
                composition: "{\"ingredients\":[{\"name\":\"Compost\",\"pct\":100}]}",
                thumbnailUrl: "https://cdn.example.com/thumb.webp");

            // Assert
            product.CategoryId.Should().Be(1);
            product.Sku.Should().Be("ORG-FERT-001");
            product.Composition.Should().NotBeNullOrEmpty();
            product.ThumbnailUrl.Should().NotBeNullOrEmpty();
        }
    }

    /// <summary>
    /// Tests for Product entity behavior methods.
    /// </summary>
    public class Behavior
    {
        private static Product CreateTestProduct() =>
            new(EntrepreneurId, BaseSpeciesId, Name, Slug, Description, BasePrice, SellPrice, StockQuantity);

        [Fact]
        public void Activate_ShouldSetIsActiveTrue()
        {
            var product = CreateTestProduct();
            product.IsActive.Should().BeFalse();

            product.Activate();

            product.IsActive.Should().BeTrue();
            product.UpdatedAt.Should().NotBeNull();
        }

        [Fact]
        public void Deactivate_ShouldSetIsActiveFalse()
        {
            var product = CreateTestProduct();
            product.Activate();
            product.Deactivate();

            product.IsActive.Should().BeFalse();
        }

        [Fact]
        public void Update_ShouldModifyOnlyProvidedFields()
        {
            var product = CreateTestProduct();

            product.Update(
                name: "Updated Name",
                slug: null,
                description: null,
                basePrice: 30.00m,
                sellPrice: null,
                stockQuantity: null,
                categoryId: null,
                sku: null,
                composition: null,
                thumbnailUrl: null);

            product.Name.Should().Be("Updated Name");
            product.BasePrice.Should().Be(30.00m);
            product.SellPrice.Should().Be(SellPrice, "SellPrice was not updated");
            product.Slug.Should().Be(Slug, "Slug was not updated");
        }

        [Fact]
        public void DecrementStock_ShouldReduceQuantity()
        {
            var product = CreateTestProduct();
            product.DecrementStock(10);

            product.StockQuantity.Should().Be(StockQuantity - 10);
        }

        [Fact]
        public void DecrementStock_ShouldThrow_WhenInsufficientStock()
        {
            var product = CreateTestProduct();
            var act = () => product.DecrementStock(StockQuantity + 1);

            act.Should().Throw<InvalidOperationException>().WithMessage("*Insufficient stock*");
        }

        [Fact]
        public void IncrementStock_ShouldIncreaseQuantity()
        {
            var product = CreateTestProduct();
            product.IncrementStock(50);

            product.StockQuantity.Should().Be(StockQuantity + 50);
        }
    }
}
