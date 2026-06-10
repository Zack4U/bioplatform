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
    private const string Name = "Negocios Verdes";
    private const string CertificationType = "Sustainability";
    private const string IssuingBody = "MinAmbiente";
    private static readonly DateTime IssuedAt = new(2025, 1, 15, 0, 0, 0, DateTimeKind.Utc);

    /// <summary>
    /// Tests for the initialization of the Certification entity via its constructor.
    /// </summary>
    public class Constructor : CertificationTests
    {
        [Fact]
        public void ShouldInitializeWithCorrectProperties()
        {
            var certification = new Certification(
                ProductId, Name, CertificationType, IssuingBody, IssuedAt,
                certificateNumber: "NV-2025-001",
                documentUrl: "https://cdn.example.com/certs/nv.pdf",
                logoUrl: "https://cdn.example.com/certs/nv-logo.png",
                verificationCode: "NV-2025-00421");

            certification.Id.Should().NotBeEmpty();
            certification.ProductId.Should().Be(ProductId);
            certification.Name.Should().Be(Name);
            certification.CertificationType.Should().Be(CertificationType);
            certification.IssuingBody.Should().Be(IssuingBody);
            certification.IssuedAt.Should().Be(IssuedAt);
            certification.CertificateNumber.Should().Be("NV-2025-001");
            certification.Status.Should().Be("Pending");
            certification.DocumentUrl.Should().Be("https://cdn.example.com/certs/nv.pdf");
            certification.LogoUrl.Should().Be("https://cdn.example.com/certs/nv-logo.png");
            certification.VerificationCode.Should().Be("NV-2025-00421");
        }
    }
}
