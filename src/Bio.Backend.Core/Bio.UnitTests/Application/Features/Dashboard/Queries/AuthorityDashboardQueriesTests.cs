using Bio.Application.DTOs;
using Bio.Application.Features.Dashboard.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Dashboard.Queries;

public class AuthorityDashboardQueriesTests
{
    private readonly Mock<IAbsPermitRepository> _absRepoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<ISpeciesRepository> _speciesRepoMock = new();

    [Fact]
    public async Task GetAuthorityDashboard_ShouldReturnMetrics()
    {
        var permit = new AbsPermit(Guid.NewGuid(), Guid.NewGuid(), "RES123", DateTime.UtcNow, DateTime.UtcNow.AddDays(40), "Auth");
        var permits = new List<AbsPermit> { permit };

        var product = new Product(permit.EntrepreneurId, permit.SpeciesId, "Prod", "prod", "Desc", 10, 10, 10);
        var products = new List<Product> { product };

        var species = new Bio.Domain.Entities.Species(permit.SpeciesId, "TaxonId", "Sci", 1, null, "Com", "Desc", null, "Cons", "Endem", true, true);
        var speciesList = new List<Bio.Domain.Entities.Species> { species };
        IEnumerable<Bio.Domain.Entities.Species> speciesEnumerable = speciesList;

        _absRepoMock.Setup(r => r.GetAllPagedAsync(null, null, 1, 10000, default))
            .ReturnsAsync((permits, 1));
        _productRepoMock.Setup(r => r.GetManagedFilteredAsync(null, true, null, null, "createdAt", "desc", 1, 10000, default, null))
            .ReturnsAsync((products, 1));
        _speciesRepoMock.Setup(r => r.GetAllAsync(null, null, default))
            .ReturnsAsync(speciesEnumerable);

        var handler = new GetAuthorityDashboardQueryHandler(_absRepoMock.Object, _productRepoMock.Object, _speciesRepoMock.Object);

        var result = await handler.Handle(new GetAuthorityDashboardQuery(90), default);

        result.Should().NotBeNull();
        result.TotalAbsPermits.Should().Be(1);
        result.TotalCertifications.Should().Be(0);
        result.LegalSpeciesCount.Should().Be(1);
    }
}
