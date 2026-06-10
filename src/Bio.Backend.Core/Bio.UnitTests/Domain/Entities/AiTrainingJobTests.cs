using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Domain.Entities;

/// <summary>
/// Unit tests for the <see cref="AiTrainingJob"/> domain entity.
/// </summary>
public class AiTrainingJobTests
{
    private static readonly Guid UserId = Guid.NewGuid();

    [Fact]
    public void Constructor_ShouldInitializeWithCorrectProperties()
    {
        var job = new AiTrainingJob(UserId);

        job.Id.Should().NotBeEmpty();
        job.TriggeredByUserId.Should().Be(UserId);
        job.Status.Should().Be("Pending");
        job.StatusMessage.Should().BeNull();
        job.CompletedAt.Should().BeNull();
        job.ResultingModelVersionId.Should().BeNull();
    }

    [Fact]
    public void MarkRunning_ShouldSetStatusToRunning()
    {
        var job = new AiTrainingJob(UserId);
        job.MarkRunning();

        job.Status.Should().Be("Running");
    }

    [Fact]
    public void UpdateStatusMessage_ShouldSetStatusToRunningAndMessage()
    {
        var job = new AiTrainingJob(UserId);
        job.UpdateStatusMessage("Loading data");

        job.Status.Should().Be("Running");
        job.StatusMessage.Should().Be("Loading data");
    }

    [Fact]
    public void MarkCompleted_ShouldSetStatusCompletedAndProperties()
    {
        var job = new AiTrainingJob(UserId);
        var beforeTime = DateTime.UtcNow.AddSeconds(-1);

        job.MarkCompleted("Done training", 5);

        job.Status.Should().Be("Completed");
        job.StatusMessage.Should().Be("Done training");
        job.ResultingModelVersionId.Should().Be(5);
        job.CompletedAt.Should().BeAfter(beforeTime);
    }

    [Fact]
    public void MarkFailed_ShouldSetStatusFailedAndProperties()
    {
        var job = new AiTrainingJob(UserId);
        var beforeTime = DateTime.UtcNow.AddSeconds(-1);

        job.MarkFailed("Out of memory");

        job.Status.Should().Be("Failed");
        job.StatusMessage.Should().Be("Out of memory");
        job.CompletedAt.Should().BeAfter(beforeTime);
        job.ResultingModelVersionId.Should().BeNull();
    }

    [Fact]
    public void MarkInterrupted_ShouldSetStatusInterruptedAndProperties()
    {
        var job = new AiTrainingJob(UserId);
        var beforeTime = DateTime.UtcNow.AddSeconds(-1);

        job.MarkInterrupted("Cancelled by user");

        job.Status.Should().Be("Interrupted");
        job.StatusMessage.Should().Be("Cancelled by user");
        job.CompletedAt.Should().BeAfter(beforeTime);
        job.ResultingModelVersionId.Should().BeNull();
    }
}
