using Bio.Application.Features.AiModels.Queries;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace Bio.UnitTests.Application.Features.AiModels.Queries;

public class AiModelQueriesTests
{
    private readonly Mock<IAiModelRepository> _aiRepoMock = new();
    private readonly Mock<ISpeciesImageRepository> _imageRepoMock = new();
    private readonly Mock<IHttpClientFactory> _httpClientFactoryMock = new();

    private class MockHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> _sendAsync;

        public MockHttpMessageHandler(Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> sendAsync)
        {
            _sendAsync = sendAsync;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return _sendAsync(request, cancellationToken);
        }
    }

    private void SetupMockHttpClient(HttpResponseMessage responseMessage)
    {
        var handler = new MockHttpMessageHandler((req, ct) => Task.FromResult(responseMessage));
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost") };
        _httpClientFactoryMock.Setup(f => f.CreateClient("AiService")).Returns(client);
    }

    private void SetupMockHttpClientException(Exception ex)
    {
        var handler = new MockHttpMessageHandler((req, ct) => throw ex);
        var client = new HttpClient(handler) { BaseAddress = new Uri("http://localhost") };
        _httpClientFactoryMock.Setup(f => f.CreateClient("AiService")).Returns(client);
    }

    // ==========================================================================
    // GetAiHardwareStatusQuery Tests
    // ==========================================================================

    [Fact]
    public async Task GetAiHardwareStatus_WhenApiSucceeds_ShouldReturnStatus()
    {
        // Arrange
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = JsonContent.Create(new
            {
                has_gpu = true,
                gpu_name = "NVIDIA RTX 4090",
                vram_total_gb = 24.0,
                vram_free_gb = 20.5,
                can_train_models = true,
                cuda_version = "12.2",
                compute_capability = "8.9",
                multiprocessors = 128
            })
        };
        SetupMockHttpClient(response);

        var handler = new GetAiHardwareStatusQueryHandler(_httpClientFactoryMock.Object);

        // Act
        var result = await handler.Handle(new GetAiHardwareStatusQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.HasGpu.Should().BeTrue();
        result.GpuName.Should().Be("NVIDIA RTX 4090");
        result.VramTotalGb.Should().Be(24.0);
        result.VramFreeGb.Should().Be(20.5);
        result.CanTrainModels.Should().BeTrue();
        result.CudaVersion.Should().Be("12.2");
        result.ComputeCapability.Should().Be("8.9");
        result.Multiprocessors.Should().Be(128);
    }

    [Fact]
    public async Task GetAiHardwareStatus_WhenApiFails_ShouldReturnDefaultStatus()
    {
        // Arrange
        SetupMockHttpClient(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        var handler = new GetAiHardwareStatusQueryHandler(_httpClientFactoryMock.Object);

        // Act
        var result = await handler.Handle(new GetAiHardwareStatusQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.HasGpu.Should().BeFalse();
        result.GpuName.Should().BeNull();
        result.CanTrainModels.Should().BeFalse();
    }

    [Fact]
    public async Task GetAiHardwareStatus_WhenApiThrows_ShouldReturnDefaultStatus()
    {
        // Arrange
        SetupMockHttpClientException(new HttpRequestException("Network failure"));
        var handler = new GetAiHardwareStatusQueryHandler(_httpClientFactoryMock.Object);

        // Act
        var result = await handler.Handle(new GetAiHardwareStatusQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.HasGpu.Should().BeFalse();
        result.CanTrainModels.Should().BeFalse();
    }

    [Fact]
    public async Task GetAiHardwareStatus_WhenApiResponseContentIsNull_ShouldReturnDefaultStatus()
    {
        // Arrange
        var response = new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("") // Empty body
        };
        SetupMockHttpClient(response);
        var handler = new GetAiHardwareStatusQueryHandler(_httpClientFactoryMock.Object);

        // Act
        var result = await handler.Handle(new GetAiHardwareStatusQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.HasGpu.Should().BeFalse();
        result.CanTrainModels.Should().BeFalse();
    }

    // ==========================================================================
    // GetActiveModelMetricsQuery Tests
    // ==========================================================================

    [Fact]
    public async Task GetActiveModelMetrics_WhenNoActiveModel_ShouldReturnInactiveResult()
    {
        // Arrange
        _aiRepoMock.Setup(r => r.GetActiveVersionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((AiModelVersion?)null);

        var handler = new GetActiveModelMetricsQueryHandler(_aiRepoMock.Object);

        // Act
        var result = await handler.Handle(new GetActiveModelMetricsQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.HasActiveModel.Should().BeFalse();
        result.ModelVersionId.Should().BeNull();
        result.ModelName.Should().BeNull();
    }

    [Fact]
    public async Task GetActiveModelMetrics_WhenActiveModelExists_ShouldReturnMetrics()
    {
        // Arrange
        var activeModel = new AiModelVersion("efficientnet_b0", "v1.2", 0.9250m, DateTime.UtcNow.AddDays(-5), true, "Active model", null, null);
        activeModel.SetValidationAccuracy(0.9100m);
        _aiRepoMock.Setup(r => r.GetActiveVersionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeModel);

        var handler = new GetActiveModelMetricsQueryHandler(_aiRepoMock.Object);

        // Act
        var result = await handler.Handle(new GetActiveModelMetricsQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.HasActiveModel.Should().BeTrue();
        result.ModelName.Should().Be("efficientnet_b0");
        result.Version.Should().Be("v1.2");
        result.AccuracyMetric.Should().Be(0.9250m);
        result.ValidationAccuracy.Should().Be(0.9100m);
        result.Notes.Should().Be("Active model");
    }

    // ==========================================================================
    // GetModelVersionsQuery Tests
    // ==========================================================================

    [Fact]
    public async Task GetModelVersions_ShouldReturnMappedDtos()
    {
        // Arrange
        var versions = new List<AiModelVersion>
        {
            new AiModelVersion("ResNet50", "v2.0", 0.95m, DateTime.UtcNow, true, "Active version"),
            new AiModelVersion("ResNet50", "v1.0", 0.90m, DateTime.UtcNow.AddDays(-10), false, "Legacy version")
        };
        _aiRepoMock.Setup(r => r.GetAllVersionsAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(versions);

        var handler = new GetModelVersionsQueryHandler(_aiRepoMock.Object);

        // Act
        var result = await handler.Handle(new GetModelVersionsQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);

        var list = result.ToList();
        list[0].ModelName.Should().Be("ResNet50");
        list[0].Version.Should().Be("v2.0");
        list[0].IsActive.Should().BeTrue();

        list[1].Version.Should().Be("v1.0");
        list[1].IsActive.Should().BeFalse();
    }

    // ==========================================================================
    // GetRecentTrainingJobsQuery Tests
    // ==========================================================================

    [Fact]
    public async Task GetRecentTrainingJobs_ShouldReturnMappedDtos()
    {
        // Arrange
        var job1 = new AiTrainingJob(Guid.NewGuid());
        job1.MarkRunning();

        var job2 = new AiTrainingJob(Guid.NewGuid());
        var activeModel = new AiModelVersion("ResNet50", "v3.0", 0.96m, DateTime.UtcNow);
        job2.MarkCompleted("Job completed successfully", 12);

        // Use reflection or standard assignment to simulate navigation property population
        typeof(AiTrainingJob).GetProperty(nameof(AiTrainingJob.ResultingModelVersion))
            ?.SetValue(job2, activeModel);

        var jobs = new List<AiTrainingJob> { job1, job2 };
        _aiRepoMock.Setup(r => r.GetRecentTrainingJobsAsync(5, It.IsAny<CancellationToken>()))
            .ReturnsAsync(jobs);

        var handler = new GetRecentTrainingJobsQueryHandler(_aiRepoMock.Object);

        // Act
        var result = await handler.Handle(new GetRecentTrainingJobsQuery(5), default);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);

        var list = result.ToList();
        list[0].Status.Should().Be("Running");
        list[0].ResultingVersion.Should().BeNull();

        list[1].Status.Should().Be("Completed");
        list[1].StatusMessage.Should().Be("Job completed successfully");
        list[1].ResultingVersion.Should().Be("v3.0");
    }

    // ==========================================================================
    // GetNewObservationsSummaryQuery Tests
    // ==========================================================================

    [Fact]
    public async Task GetNewObservationsSummary_WhenActiveModelExists_ShouldCountSinceDeployedDate()
    {
        // Arrange
        var deployedAt = DateTime.UtcNow.AddDays(-3);
        var activeModel = new AiModelVersion("ResNet50", "v2.0", 0.95m, deployedAt, true);

        _aiRepoMock.Setup(r => r.GetActiveVersionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeModel);

        _imageRepoMock.Setup(r => r.CountNewObservationsSinceAsync(deployedAt, It.IsAny<CancellationToken>()))
            .ReturnsAsync((15, 3));

        var handler = new GetNewObservationsSummaryQueryHandler(_aiRepoMock.Object, _imageRepoMock.Object);

        // Act
        var result = await handler.Handle(new GetNewObservationsSummaryQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.TotalNewImages.Should().Be(15);
        result.AffectedSpeciesCount.Should().Be(3);
        result.Since.Should().Be(deployedAt);
    }

    [Fact]
    public async Task GetNewObservationsSummary_WhenNoActiveModel_ShouldCountSinceNull()
    {
        // Arrange
        _aiRepoMock.Setup(r => r.GetActiveVersionAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync((AiModelVersion?)null);

        _imageRepoMock.Setup(r => r.CountNewObservationsSinceAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync((100, 24));

        var handler = new GetNewObservationsSummaryQueryHandler(_aiRepoMock.Object, _imageRepoMock.Object);

        // Act
        var result = await handler.Handle(new GetNewObservationsSummaryQuery(), default);

        // Assert
        result.Should().NotBeNull();
        result.TotalNewImages.Should().Be(100);
        result.AffectedSpeciesCount.Should().Be(24);
        result.Since.Should().BeNull();
    }
}
