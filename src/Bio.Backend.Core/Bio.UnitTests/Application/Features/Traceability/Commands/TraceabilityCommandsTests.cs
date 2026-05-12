using Bio.Application.DTOs;
using Bio.Application.Features.Traceability.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Traceability.Commands;

public class TraceabilityCommandsTests
{
    private readonly Mock<ITraceabilityBatchRepository> _repoMock = new();
    private readonly Mock<IProductRepository> _productRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    private Product CreateProduct(Guid entrepreneurId)
    {
        return new Product(entrepreneurId, Guid.NewGuid(), "P", "p", "D", 10, 10, 10, null, null, null, null);
    }

    [Fact]
    public async Task CreateTraceabilityBatch_WhenValid_ShouldCreate()
    {
        var handler = new CreateTraceabilityBatchCommandHandler(_repoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var pid = Guid.NewGuid();
        var uid = Guid.NewGuid();
        var dto = new TraceabilityBatchCreateDTO("B001", DateTime.UtcNow, "Loc", "Details", "Hash");

        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(CreateProduct(uid));
        _repoMock.Setup(r => r.ExistsByBatchCodeAsync("B001", default)).ReturnsAsync(false);

        var result = await handler.Handle(new CreateTraceabilityBatchCommand(pid, dto, uid, "ENTREPRENEUR"), default);

        result.Should().NotBeNull();
        result.BatchCode.Should().Be("B001");
        _repoMock.Verify(r => r.AddAsync(It.IsAny<TraceabilityBatch>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task CreateTraceabilityBatch_WhenNotOwner_ShouldThrowForbidden()
    {
        var handler = new CreateTraceabilityBatchCommandHandler(_repoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var pid = Guid.NewGuid();

        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(CreateProduct(Guid.NewGuid()));

        await FluentActions.Awaiting(() => handler.Handle(new CreateTraceabilityBatchCommand(pid, new TraceabilityBatchCreateDTO("B", DateTime.UtcNow, "", "", ""), Guid.NewGuid(), "ENTREPRENEUR"), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task UpdateTraceabilityBatch_WhenValid_ShouldUpdate()
    {
        var handler = new UpdateTraceabilityBatchCommandHandler(_repoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var bid = Guid.NewGuid();
        var uid = Guid.NewGuid();
        var pid = Guid.NewGuid();
        var batch = new TraceabilityBatch(pid, "B001", DateTime.UtcNow, "Loc", "D", "H");

        _repoMock.Setup(r => r.GetByIdAsync(bid, default)).ReturnsAsync(batch);
        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(CreateProduct(uid));

        var result = await handler.Handle(new UpdateTraceabilityBatchCommand(bid, new TraceabilityBatchUpdateDTO(DateTime.UtcNow, "NewLoc", "NewD", "NewH"), uid, "ENTREPRENEUR"), default);

        result.OriginLocation.Should().Be("NewLoc");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task DeleteTraceabilityBatch_WhenAdmin_ShouldDelete()
    {
        var handler = new DeleteTraceabilityBatchCommandHandler(_repoMock.Object, _productRepoMock.Object, _uowMock.Object);
        var bid = Guid.NewGuid();
        var pid = Guid.NewGuid();
        var batch = new TraceabilityBatch(pid, "B001", DateTime.UtcNow, "Loc", "D", "H");

        _repoMock.Setup(r => r.GetByIdAsync(bid, default)).ReturnsAsync(batch);
        _productRepoMock.Setup(r => r.GetByIdAsync(pid, default)).ReturnsAsync(CreateProduct(Guid.NewGuid()));

        await handler.Handle(new DeleteTraceabilityBatchCommand(bid, Guid.NewGuid(), "ADMIN"), default);

        _repoMock.Verify(r => r.DeleteAsync(batch, default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }
}
