using Bio.Application.DTOs;
using Bio.Application.Features.Traceability.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Traceability.Queries;

public class TraceabilityQueriesTests
{
    private readonly Mock<ITraceabilityBatchRepository> _repoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();

    [Fact]
    public async Task GetBatchesByProduct_ShouldReturnList()
    {
        var handler = new GetBatchesByProductQueryHandler(_repoMock.Object, _productRepoMock.Object);
        var pid = Guid.NewGuid();
        var batches = new List<TraceabilityBatch> { new(pid, "B001", DateTime.UtcNow, "L", "D", "H") };

        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(new Product(Guid.NewGuid(), Guid.NewGuid(), "P", "p", "D", 10, 10, 10, null, null, null, null));
        _repoMock.Setup(r => r.GetByProductIdAsync(pid, default)).ReturnsAsync(batches);

        var result = await handler.Handle(new GetBatchesByProductQuery(pid), default);

        result.Should().HaveCount(1);
        result[0].BatchCode.Should().Be("B001");
    }

    [Fact]
    public async Task GetBatchById_ShouldReturnBatch()
    {
        var handler = new GetBatchByIdQueryHandler(_repoMock.Object);
        var bid = Guid.NewGuid();
        var batch = new TraceabilityBatch(Guid.NewGuid(), "B001", DateTime.UtcNow, "L", "D", "H");

        _repoMock.Setup(r => r.GetByIdAsync(bid, default)).ReturnsAsync(batch);

        var result = await handler.Handle(new GetBatchByIdQuery(bid), default);

        result.Should().NotBeNull();
        result.BatchCode.Should().Be("B001");
    }
}
