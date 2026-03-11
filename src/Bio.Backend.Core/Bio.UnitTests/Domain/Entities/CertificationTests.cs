using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="Certification"/> domain entity.
/// </summary>
public class CertificationTests
{
    private static readonly Guid ProductId = Guid.NewGuid();
    private const string CertificationType = "Organic";
    private const string CertificationBody = "Ecocert";
    private static readonly DateTime IssueDate = DateTime.UtcNow.AddMonths(-1);

    /// <summary>
    /// Tests for the initialization of the Certification entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a Certification is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var certification = new Certification(ProductId, CertificationType, CertificationBody, IssueDate);

            // Assert
            certification.Id.Should().NotBeEmpty();
            certification.ProductId.Should().Be(ProductId);
            certification.CertificationType.Should().Be(CertificationType);
            certification.CertificationBody.Should().Be(CertificationBody);
            certification.IssueDate.Should().Be(IssueDate);
            certification.Status.Should().Be("Active");
            certification.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        }
    }
}
