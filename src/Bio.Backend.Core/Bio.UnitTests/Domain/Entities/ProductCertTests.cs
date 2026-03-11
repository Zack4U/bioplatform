using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="ProductCert"/> domain entity.
/// </summary>
public class ProductCertTests
{
    private static readonly Guid ProductId = Guid.NewGuid();
    private static readonly Guid CertId = Guid.NewGuid();

    /// <summary>
    /// Tests for the initialization of the ProductCert entity via its constructor.
    /// </summary>
    public class Initialization
    {
        /// <summary>
        /// Verifies that a ProductCert is initialized with the correct properties.
        /// </summary>
        [Fact]
        public void ShouldSetProperties_WhenCreated()
        {
            // Act
            var productCert = new ProductCert(ProductId, CertId);

            // Assert
            productCert.ProductId.Should().Be(ProductId);
            productCert.CertId.Should().Be(CertId);
            productCert.ValidUntil.Should().BeNull();
            productCert.VerificationCode.Should().BeNull();
        }
    }
}
