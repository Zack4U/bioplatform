using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="AbsPermit"/> domain entity.
/// </summary>
public class AbsPermitTests
{
    private static readonly Guid EntrepreneurId = Guid.NewGuid();
    private static readonly Guid SpeciesId = Guid.NewGuid();
    private const string ResolutionNumber = "RES-2024-001";
    private static readonly DateTime EmissionDate = DateTime.UtcNow.AddDays(-10);
    private static readonly DateTime ExpirationDate = DateTime.UtcNow.AddDays(355);
    private const string GrantingAuthority = "ANLA";

    /// <summary>
    /// Tests for the initialization of the AbsPermit entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that an AbsPermit is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var permit = new AbsPermit(EntrepreneurId, SpeciesId, ResolutionNumber, EmissionDate, ExpirationDate, GrantingAuthority);

            // Assert
            permit.Id.Should().NotBeEmpty();
            permit.EntrepreneurId.Should().Be(EntrepreneurId);
            permit.SpeciesId.Should().Be(SpeciesId);
            permit.ResolutionNumber.Should().Be(ResolutionNumber);
            permit.EmissionDate.Should().Be(EmissionDate);
            permit.ExpirationDate.Should().Be(ExpirationDate);
            permit.GrantingAuthority.Should().Be(GrantingAuthority);
            permit.Status.Should().Be("Active");
        }
    }
}
