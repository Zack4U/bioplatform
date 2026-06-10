using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="PredictionLog"/> domain entity.
/// </summary>
public class PredictionLogTests
{
    private const string ImageInputUrl = "http://example.com/input.jpg";
    private const string RawPredictionResult = "{\"label\": \"Species A\", \"confidence\": 0.95}";
    private const decimal ConfidenceScore = 0.95m;

    /// <summary>
    /// Tests for the initialization of the PredictionLog entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a PredictionLog is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var log = new PredictionLog(ImageInputUrl, RawPredictionResult, ConfidenceScore);

            // Assert
            log.Id.Should().NotBeEmpty();
            log.ImageInputUrl.Should().Be(ImageInputUrl);
            log.RawPredictionResult.Should().Be(RawPredictionResult);
            log.ConfidenceScore.Should().Be(ConfidenceScore);
            log.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }
    }
}
