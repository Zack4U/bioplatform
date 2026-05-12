using Bio.Application.Features.Certifications.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Certifications.Queries;

public class CertificationQueriesTests
{
    private readonly Mock<ICertificationRepository> _repoMock = new();

    [Fact]
    public async Task GetProductCertifications_ShouldReturnList()
    {
        var productId = Guid.NewGuid();
        var certs = new List<Certification> { new(productId, "Name", "Type", "Body", DateTime.UtcNow, null, null, null, null, null) };

        _repoMock.Setup(r => r.GetByProductIdAsync(productId, default)).ReturnsAsync(certs);

        var handler = new GetProductCertificationsQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetProductCertificationsQuery(productId), default);

        result.Should().HaveCount(1);
    }
}
