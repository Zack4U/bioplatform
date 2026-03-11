using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="ProductCategory"/> domain entity.
/// </summary>
public class ProductCategoryTests
{
    private const string Name = "Fertilizers";

    /// <summary>
    /// Tests for the initialization of the ProductCategory entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a ProductCategory is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var category = new ProductCategory(Name);

            // Assert
            category.Name.Should().Be(Name);
            category.Products.Should().BeEmpty();
        }
    }
}
