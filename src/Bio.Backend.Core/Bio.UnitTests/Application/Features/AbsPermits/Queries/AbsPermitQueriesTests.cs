using Bio.Application.Features.AbsPermits.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.AbsPermits.Queries;

public class AbsPermitQueriesTests
{
    private readonly Mock<IAbsPermitRepository> _repoMock = new();

    [Fact]
    public async Task GetAbsPermitsByEntrepreneur_ShouldReturnList()
    {
        var entrepreneurId = Guid.NewGuid();
        var permits = new List<AbsPermit> { new(entrepreneurId, Guid.NewGuid(), "RES", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), "Auth") };

        _repoMock.Setup(r => r.GetByEntrepreneurIdAsync(entrepreneurId, default)).ReturnsAsync(permits);

        var handler = new GetAbsPermitsByEntrepreneurQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetAbsPermitsByEntrepreneurQuery(entrepreneurId), default);

        result.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetAbsPermitById_WhenFound_ShouldReturnDto()
    {
        var id = Guid.NewGuid();
        var permit = new AbsPermit(Guid.NewGuid(), Guid.NewGuid(), "RES", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), "Auth");

        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync(permit);

        var handler = new GetAbsPermitByIdQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetAbsPermitByIdQuery(id), default);

        result.Should().NotBeNull();
        result.ResolutionNumber.Should().Be("RES");
    }

    [Fact]
    public async Task GetAbsPermitById_WhenNotFound_ShouldThrowNotFoundException()
    {
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync((AbsPermit?)null);

        var handler = new GetAbsPermitByIdQueryHandler(_repoMock.Object);
        await FluentActions.Awaiting(() => handler.Handle(new GetAbsPermitByIdQuery(id), default))
            .Should().ThrowAsync<NotFoundException>();
    }

    [Fact]
    public async Task GetAllAbsPermits_ShouldReturnPaginatedList()
    {
        var permits = new List<AbsPermit> { new(Guid.NewGuid(), Guid.NewGuid(), "RES", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), "Auth") };

        _repoMock.Setup(r => r.GetAllPagedAsync(null, null, 1, 10, default))
            .ReturnsAsync((permits, 1));

        var handler = new GetAllAbsPermitsQueryHandler(_repoMock.Object);
        var result = await handler.Handle(new GetAllAbsPermitsQuery(null, null, 1, 10), default);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
    }
}
