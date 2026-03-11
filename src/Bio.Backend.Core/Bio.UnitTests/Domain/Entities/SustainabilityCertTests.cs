using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="SustainabilityCert"/> domain entity.
/// </summary>
public class SustainabilityCertTests
{
    private const string Name = "Organic Label";
    private const string Issuer = "Ecocert";

    /// <summary>
    /// Tests for the initialization of the SustainabilityCert entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a SustainabilityCert is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var cert = new SustainabilityCert(Name, Issuer);

            // Assert
            cert.Id.Should().NotBeEmpty();
            cert.Name.Should().Be(Name);
            cert.Issuer.Should().Be(Issuer);
            cert.LogoUrl.Should().BeNull();
        }
    }
}
