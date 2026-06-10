using Bio.Application.Features.AiModels.Commands.ReceiveTrainingWebhook;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.AiModels.Commands;

public class ReceiveTrainingWebhookCommandTests
{
    private readonly Mock<IAiModelRepository> _repoMock = new();
    private readonly Mock<IScientificUnitOfWork> _uowMock = new();

    [Fact]
    public async Task Handle_WhenJobIdIsInvalidGuid_ShouldReturnFailure()
    {
        // Arrange
        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand("invalid-guid", "Completed", "Done", "v1.0", 0.95m, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeFalse();
        result.Message.Should().Be("Invalid job ID format.");
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenJobNotFound_ShouldReturnFailure()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AiTrainingJob?)null);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(jobId.ToString(), "Completed", "Done", "v1.0", 0.95m, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeFalse();
        result.Message.Should().Contain("not found");
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Theory]
    [InlineData("Completed")]
    [InlineData("Failed")]
    [InlineData("Interrupted")]
    public async Task Handle_WhenJobInTerminalState_ShouldReturnSuccessWithoutChangingState(string terminalStatus)
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var job = new AiTrainingJob(Guid.NewGuid());
        if (terminalStatus == "Completed") job.MarkCompleted("done", 1);
        else if (terminalStatus == "Failed") job.MarkFailed("error");
        else if (terminalStatus == "Interrupted") job.MarkInterrupted("halted");

        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(jobId.ToString(), "Running", "Some progress update", null, null, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        result.Message.Should().Contain("Webhook already processed");
        job.Status.Should().Be(terminalStatus); // Unchanged
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenStatusIsRunning_ShouldUpdateStatusMessage()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var job = new AiTrainingJob(Guid.NewGuid());
        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(jobId.ToString(), "Running", "Epoch 2/10", null, null, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        job.Status.Should().Be("Running");
        job.StatusMessage.Should().Be("Epoch 2/10");
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenStatusIsFailed_ShouldMarkJobFailed()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var job = new AiTrainingJob(Guid.NewGuid());
        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(jobId.ToString(), "Failed", "OOM error", null, null, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        job.Status.Should().Be("Failed");
        job.StatusMessage.Should().Be("OOM error");
        job.CompletedAt.Should().NotBeNull();
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenStatusIsInterrupted_ShouldMarkJobInterrupted()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var job = new AiTrainingJob(Guid.NewGuid());
        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(jobId.ToString(), "Interrupted", "Halted by system", null, null, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        job.Status.Should().Be("Interrupted");
        job.StatusMessage.Should().Be("Halted by system");
        job.CompletedAt.Should().NotBeNull();
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenStatusIsUnknown_ShouldReturnFailure()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var job = new AiTrainingJob(Guid.NewGuid());
        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(jobId.ToString(), "UnknownStatus", "Message", null, null, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeFalse();
        result.Message.Should().Contain("Unknown status");
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenStatusIsCompletedWithNoVersion_ShouldMarkJobCompletedWithNullModelVersion()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var job = new AiTrainingJob(Guid.NewGuid());
        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(jobId.ToString(), "Completed", "Finished training successfully", null, 0.91m, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        job.Status.Should().Be("Completed");
        job.StatusMessage.Should().Be("Finished training successfully");
        job.ResultingModelVersionId.Should().BeNull();
        _repoMock.Verify(r => r.AddVersionAsync(It.IsAny<AiModelVersion>(), It.IsAny<CancellationToken>()), Times.Never);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenStatusIsCompletedWithVersion_ShouldCreateAiModelVersionAndCompleteJob()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var job = new AiTrainingJob(Guid.NewGuid());
        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var configJson = "{\"model_name\":\"custom_resnet\"}";
        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(
            jobId.ToString(),
            "Completed",
            "Finished",
            "v2.1",
            0.94m,
            configJson,
            "{\"val_loss\":0.05}");

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        job.Status.Should().Be("Completed");
        job.StatusMessage.Should().Be("Finished");

        _repoMock.Verify(r => r.AddVersionAsync(
            It.Is<AiModelVersion>(v => v.Version == "v2.1" && v.ModelName == "custom_resnet" && v.AccuracyMetric == 0.94m && v.MetricsJson == "{\"val_loss\":0.05}"),
            It.IsAny<CancellationToken>()), Times.Once);

        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Handle_WhenStatusIsCompletedWithVersionButInvalidConfigJson_ShouldUseDefaultModelNameAndSucceed()
    {
        // Arrange
        var jobId = Guid.NewGuid();
        var job = new AiTrainingJob(Guid.NewGuid());
        _repoMock.Setup(r => r.GetTrainingJobAsync(jobId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(job);

        var configJson = "{invalid json}";
        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand(
            jobId.ToString(),
            "Completed",
            "Finished",
            "v2.2",
            null, // should default accuracy to 0
            configJson,
            null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        job.Status.Should().Be("Completed");

        _repoMock.Verify(r => r.AddVersionAsync(
            It.Is<AiModelVersion>(v => v.Version == "v2.2" && v.ModelName == "efficientnet_b0" && v.AccuracyMetric == 0m),
            It.IsAny<CancellationToken>()), Times.Once);

        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Handle_WhenEmptyJobIdManualUpload_ShouldRegisterInactiveVersion()
    {
        // Arrange — manual upload notifies with an empty jobId (no training job).
        _repoMock.Setup(r => r.GetVersionByTagAsync("v3.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync((AiModelVersion?)null);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand("", "Completed", "Manual upload", "v3.0", 0.85m, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        _repoMock.Verify(r => r.AddVersionAsync(
            It.Is<AiModelVersion>(v => v.Version == "v3.0" && !v.IsActive && v.AccuracyMetric == 0.85m),
            It.IsAny<CancellationToken>()), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenEmptyJobIdAlreadyRegistered_ShouldBeIdempotent()
    {
        // Arrange
        var existing = new AiModelVersion("efficientnet_b0", "v3.0", 0.85m, DateTime.UtcNow);
        _repoMock.Setup(r => r.GetVersionByTagAsync("v3.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand("", "Completed", "Manual upload", "v3.0", 0.85m, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeTrue();
        result.Message.Should().Contain("already registered");
        _repoMock.Verify(r => r.AddVersionAsync(It.IsAny<AiModelVersion>(), It.IsAny<CancellationToken>()), Times.Never);
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenEmptyJobIdWithoutVersion_ShouldReturnFailure()
    {
        // Arrange
        var handler = new ReceiveTrainingWebhookCommandHandler(_repoMock.Object, _uowMock.Object);
        var cmd = new ReceiveTrainingWebhookCommand("", "Completed", "Manual upload", null, null, null, null);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Accepted.Should().BeFalse();
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }
}
