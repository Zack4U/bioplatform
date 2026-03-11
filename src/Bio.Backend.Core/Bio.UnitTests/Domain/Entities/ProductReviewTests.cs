using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="ProductReview"/> domain entity.
/// </summary>
public class ProductReviewTests
{
    private static readonly Guid ProductId = Guid.NewGuid();
    private static readonly Guid UserId = Guid.NewGuid();
    private const int Rating = 5;
    private const string Title = "Great product!";
    private const string Comment = "I really liked it.";

    /// <summary>
    /// Tests for the initialization of the ProductReview entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a ProductReview is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var review = new ProductReview(ProductId, UserId, Rating, Title, Comment);

            // Assert
            review.Id.Should().NotBeEmpty();
            review.ProductId.Should().Be(ProductId);
            review.UserId.Should().Be(UserId);
            review.Rating.Should().Be(Rating);
            review.Title.Should().Be(Title);
            review.Comment.Should().Be(Comment);
            review.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }
    }
}
