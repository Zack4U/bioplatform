using Bio.Application.Features.Certifications.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
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

    [Fact]
    public async Task GetCertificationById_WhenFound_ShouldReturnDto()
    {
        var cert = new Certification(Guid.NewGuid(), "Name", "Type", "Body", DateTime.UtcNow, null, null, null, null, null);
        _repoMock.Setup(r => r.GetByIdAsync(cert.Id, default)).ReturnsAsync(cert);

        var handler = new GetCertificationByIdQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetCertificationByIdQuery(cert.Id), default);

        result.Should().NotBeNull();
        result.Name.Should().Be("Name");
    }

    [Fact]
    public async Task GetCertificationById_WhenNotFound_ShouldThrowNotFound()
    {
        var certId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetByIdAsync(certId, default)).ReturnsAsync((Certification?)null);

        var handler = new GetCertificationByIdQueryHandler(_repoMock.Object);

        await FluentActions.Awaiting(() => handler.Handle(new GetCertificationByIdQuery(certId), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetManagedCertifications_ShouldReturnPaginatedList()
    {
        var certs = new List<Certification> { new(Guid.NewGuid(), "Name", "Type", "Body", DateTime.UtcNow, null, null, null, null, null) };

        _repoMock.Setup(r => r.GetManagedAsync(null, null, 1, 12, default))
            .ReturnsAsync((certs, 1));

        var handler = new GetManagedCertificationsQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetManagedCertificationsQuery(), default);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
    }
}
