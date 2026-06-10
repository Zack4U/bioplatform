using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="RagDocument"/> domain entity.
/// </summary>
public class RagDocumentTests
{
    private const string Title = "Cacao growing guide";
    private const string Content = "This is a comprehensive guide on how to grow cacao sustainably.";

    /// <summary>
    /// Tests for the initialization of the RagDocument entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a RagDocument is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var document = new RagDocument(Title, Content);

            // Assert
            document.Id.Should().NotBeEmpty();
            document.Title.Should().Be(Title);
            document.Content.Should().Be(Content);
            document.ChunkIndex.Should().Be(0);
            document.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }
    }
}
