using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="TraceabilityBatch"/> domain entity.
/// </summary>
public class TraceabilityBatchTests
{
    private static readonly Guid ProductId = Guid.NewGuid();
    private const string BatchCode = "BAT-2024-X12";
    private static readonly DateTime HarvestDate = DateTime.UtcNow.AddDays(-5);
    private const string OriginLocation = "San Roque, Antioquia";

    /// <summary>
    /// Tests for the initialization of the TraceabilityBatch entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a TraceabilityBatch is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var batch = new TraceabilityBatch(ProductId, BatchCode, HarvestDate, OriginLocation);

            // Assert
            batch.Id.Should().NotBeEmpty();
            batch.ProductId.Should().Be(ProductId);
            batch.BatchCode.Should().Be(BatchCode);
            batch.HarvestDate.Should().Be(HarvestDate);
            batch.OriginLocation.Should().Be(OriginLocation);
            batch.BlockchainHash.Should().BeNull();
            batch.ProcessingDetails.Should().BeNull();
        }
    }
}
