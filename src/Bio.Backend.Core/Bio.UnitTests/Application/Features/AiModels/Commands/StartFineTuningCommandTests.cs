using Bio.Application.Features.AiModels.Commands.StartFineTuning;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using System.Net;
using Xunit;

namespace Bio.UnitTests.Application.Features.AiModels.Commands;

public class StartFineTuningCommandTests
{
    private readonly Mock<IAiModelRepository> _repoMock = new();
    private readonly Mock<IScientificUnitOfWork> _uowMock = new();
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

    [Fact]
    public async Task Handle_WhenServiceAcceptsRequest_ShouldReturnRunningResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        SetupMockHttpClient(new HttpResponseMessage(HttpStatusCode.OK));

        var handler = new StartFineTuningCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);
        var cmd = new StartFineTuningCommand(userId, 5, 0.001, 0.2);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Status.Should().Be("Running");
        result.Message.Should().Contain("Fine-tuning started");
        result.JobId.Should().NotBeEmpty();

        _repoMock.Verify(r => r.AddTrainingJobAsync(
            It.Is<AiTrainingJob>(j => j.TriggeredByUserId == userId && j.Status == "Running"),
            It.IsAny<CancellationToken>()), Times.Once);

        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenServiceRejectsRequest_ShouldMarkJobFailedAndReturnFailedResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        SetupMockHttpClient(new HttpResponseMessage(HttpStatusCode.BadRequest)
        {
            Content = new StringContent("Invalid parameters")
        });

        var handler = new StartFineTuningCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);
        var cmd = new StartFineTuningCommand(userId, 5, 0.001, 0.2);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Status.Should().Be("Failed");
        result.Message.Should().Contain("rejected request: BadRequest");
        result.JobId.Should().NotBeEmpty();

        _repoMock.Verify(r => r.AddTrainingJobAsync(
            It.Is<AiTrainingJob>(j => j.TriggeredByUserId == userId),
            It.IsAny<CancellationToken>()), Times.Once);

        // Saved once for adding job, then once for marking failed
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }

    [Fact]
    public async Task Handle_WhenExceptionOccurs_ShouldMarkJobFailedAndReturnFailedResult()
    {
        // Arrange
        var userId = Guid.NewGuid();
        SetupMockHttpClientException(new HttpRequestException("Connection timed out"));

        var handler = new StartFineTuningCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);
        var cmd = new StartFineTuningCommand(userId, 5, 0.001, 0.2);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Status.Should().Be("Failed");
        result.Message.Should().Contain("Cannot reach AI microservice");
        result.JobId.Should().NotBeEmpty();

        _repoMock.Verify(r => r.AddTrainingJobAsync(
            It.Is<AiTrainingJob>(j => j.TriggeredByUserId == userId),
            It.IsAny<CancellationToken>()), Times.Once);

        // Saved once for adding job, then once for marking failed
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Exactly(2));
    }
}
