using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="BusinessPlan"/> domain entity.
/// </summary>
public class BusinessPlanTests
{
    private static readonly Guid EntrepreneurId = Guid.NewGuid();
    private const string ProjectTitle = "Sustainable Cacao Production";
    private const string GeneratedContent = "A detailed business plan for cacao sustainable production in Antioquia.";

    /// <summary>
    /// Tests for the initialization of the BusinessPlan entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a BusinessPlan is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var plan = new BusinessPlan(EntrepreneurId, ProjectTitle, GeneratedContent);

            // Assert
            plan.Id.Should().NotBeEmpty();
            plan.EntrepreneurId.Should().Be(EntrepreneurId);
            plan.ProjectTitle.Should().Be(ProjectTitle);
            plan.GeneratedContent.Should().Be(GeneratedContent);
            plan.Status.Should().Be("draft");
            plan.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            plan.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
            plan.SpeciesIds.Should().BeEmpty();
        }
    }
}
