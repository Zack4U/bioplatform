using Bio.Application.Features.AiModels.Commands.DeactivateModelVersion;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using System.Net;
using Xunit;

namespace Bio.UnitTests.Application.Features.AiModels.Commands;

public class DeactivateModelVersionCommandTests
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
    public async Task Handle_WhenVersionNotFound_ShouldReturnFailure()
    {
        // Arrange
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AiModelVersion?)null);

        var handler = new DeactivateModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);
        var cmd = new DeactivateModelVersionCommand(1);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Model version not found.");
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenSuccessful_ShouldDeactivateAndHotReload()
    {
        // Arrange
        var version = new AiModelVersion("ResNet50", "v1", 0.90m, DateTime.UtcNow, true);
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        SetupMockHttpClient(new HttpResponseMessage(HttpStatusCode.OK));

        var handler = new DeactivateModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);
        var cmd = new DeactivateModelVersionCommand(1);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("deactivated and hot-reloaded");
        version.IsActive.Should().BeFalse();

        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenApiFails_ShouldStillReturnTrueWithWarning()
    {
        // Arrange
        var version = new AiModelVersion("ResNet50", "v1", 0.90m, DateTime.UtcNow, true);
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        SetupMockHttpClient(new HttpResponseMessage(HttpStatusCode.InternalServerError));

        var handler = new DeactivateModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);
        var cmd = new DeactivateModelVersionCommand(1);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("deactivated in DB but AI reload failed");
        version.IsActive.Should().BeFalse();

        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenExceptionThrown_ShouldStillReturnTrueWithWarning()
    {
        // Arrange
        var version = new AiModelVersion("ResNet50", "v1", 0.90m, DateTime.UtcNow, true);
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        SetupMockHttpClientException(new HttpRequestException("Connection refused"));

        var handler = new DeactivateModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);
        var cmd = new DeactivateModelVersionCommand(1);

        // Act
        var result = await handler.Handle(cmd, default);

        // Assert
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("deactivated in DB but AI reload failed");
        version.IsActive.Should().BeFalse();

        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
