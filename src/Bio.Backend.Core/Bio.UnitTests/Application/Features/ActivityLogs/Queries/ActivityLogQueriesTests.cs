using Bio.Application.DTOs;
using Bio.Application.Features.ActivityLogs.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.ActivityLogs.Queries;

public class ActivityLogQueriesTests
{
    private readonly Mock<IActivityLogRepository> _repoMock = new();

    private ActivityLog CreateSampleLog()
    {
        return new ActivityLog("User", "Create", "High", "Product", "Created product", Guid.NewGuid(), Guid.NewGuid());
    }

    [Fact]
    public async Task GetActivityLogs_ShouldReturnPaginatedList()
    {
        var q = new GetActivityLogsQuery(new ActivityLogFilterParams { Page = 1, PageSize = 10 });
        var logs = new List<ActivityLog> { CreateSampleLog() };

        _repoMock.Setup(r => r.GetPagedAsync(It.IsAny<Guid?>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<int>(), It.IsAny<int>(), default))
            .ReturnsAsync((logs, 1));

        var handler = new GetActivityLogsQueryHandler(_repoMock.Object);

        var result = await handler.Handle(q, default);

        result.Should().NotBeNull();
        result.TotalCount.Should().Be(1);
        result.Items.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetActivityLogById_WhenFound_ShouldReturnDto()
    {
        var log = CreateSampleLog();

        _repoMock.Setup(r => r.GetByIdAsync(log.Id, default)).ReturnsAsync(log);

        var handler = new GetActivityLogByIdQueryHandler(_repoMock.Object);

        var result = await handler.Handle(new GetActivityLogByIdQuery(log.Id), default);

        result.Should().NotBeNull();
        result.Id.Should().Be(log.Id);
    }

    [Fact]
    public async Task GetActivityLogById_WhenNotFound_ShouldThrowNotFoundException()
    {
        var id = Guid.NewGuid();
        _repoMock.Setup(r => r.GetByIdAsync(id, default)).ReturnsAsync((ActivityLog?)null);

        var handler = new GetActivityLogByIdQueryHandler(_repoMock.Object);

        await FluentActions.Awaiting(() => handler.Handle(new GetActivityLogByIdQuery(id), default))
            .Should().ThrowAsync<NotFoundException>();
    }
}
