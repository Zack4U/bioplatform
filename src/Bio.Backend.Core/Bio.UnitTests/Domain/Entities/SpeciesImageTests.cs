using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="SpeciesImage"/> domain entity.
/// </summary>
public class SpeciesImageTests
{
    private static readonly Guid SpeciesId = Guid.NewGuid();
    private const string ImageUrl = "http://example.com/image.jpg";

    /// <summary>
    /// Tests for the initialization of the SpeciesImage entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a SpeciesImage is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var image = new SpeciesImage(SpeciesId, ImageUrl);

            // Assert
            image.Id.Should().NotBeEmpty();
            image.SpeciesId.Should().Be(SpeciesId);
            image.ImageUrl.Should().Be(ImageUrl);
            image.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            image.IsPrimary.Should().BeFalse();
            image.IsValidatedByExpert.Should().BeFalse();
            image.LicenseType.Should().Be("CC-BY");
        }
    }
}
