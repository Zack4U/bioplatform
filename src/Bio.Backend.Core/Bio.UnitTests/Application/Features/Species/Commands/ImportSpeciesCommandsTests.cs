using Bio.Application.Common.Interfaces;
using Bio.Application.Features.Species.Commands;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Species.Commands;

public class ImportSpeciesCommandsTests
{
    private readonly Mock<IJobEnqueuer> _jobEnqueuerMock = new();

    [Fact]
    public async Task ImportSpeciesCsvCommand_ShouldEnqueueJob()
    {
        var jobId = "job-123";
        _jobEnqueuerMock.Setup(x => x.EnqueueSpeciesBulkImportJob("path.csv", It.IsAny<Guid>())).Returns(jobId);

        var handler = new ImportSpeciesCsvCommandHandler(_jobEnqueuerMock.Object);

        var result = await handler.Handle(new ImportSpeciesCsvCommand { FilePath = "path.csv", UserId = Guid.NewGuid() }, default);

        result.Should().Be(jobId);
    }

    [Fact]
    public async Task ImportSpeciesEconomicPotentialCommand_ShouldEnqueueJob()
    {
        var jobId = "job-456";
        _jobEnqueuerMock.Setup(x => x.EnqueueEconomicPotentialImportJob("path.json", It.IsAny<Guid>())).Returns(jobId);

        var handler = new ImportSpeciesEconomicPotentialCommandHandler(_jobEnqueuerMock.Object);

        var result = await handler.Handle(new ImportSpeciesEconomicPotentialCommand { FilePath = "path.json", UserId = Guid.NewGuid() }, default);

        result.Should().Be(jobId);
    }

    [Fact]
    public async Task ImportSpeciesTraditionalUsesCommand_ShouldEnqueueJob()
    {
        var jobId = "job-789";
        _jobEnqueuerMock.Setup(x => x.EnqueueTraditionalUsesImportJob("path.json", It.IsAny<Guid>())).Returns(jobId);

        var handler = new ImportSpeciesTraditionalUsesCommandHandler(_jobEnqueuerMock.Object);

        var result = await handler.Handle(new ImportSpeciesTraditionalUsesCommand { FilePath = "path.json", UserId = Guid.NewGuid() }, default);

        result.Should().Be(jobId);
    }
}
