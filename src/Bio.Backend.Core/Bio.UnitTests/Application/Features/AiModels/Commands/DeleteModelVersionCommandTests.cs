using Bio.Application.Features.AiModels.Commands.DeleteModelVersion;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using System.Net;
using Xunit;

namespace Bio.UnitTests.Application.Features.AiModels.Commands;

public class DeleteModelVersionCommandTests
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
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AiModelVersion?)null);

        var handler = new DeleteModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);

        var result = await handler.Handle(new DeleteModelVersionCommand(1), default);

        result.Success.Should().BeFalse();
        result.Message.Should().Be("Model version not found.");
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenAlreadyDeleted_ShouldReturnTrueWithoutSaving()
    {
        var version = new AiModelVersion("ResNet50", "v1", 0.90m, DateTime.UtcNow, isActive: false);
        version.SoftDelete();
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        var handler = new DeleteModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);

        var result = await handler.Handle(new DeleteModelVersionCommand(1), default);

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("already deleted");
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenInactiveVersion_ShouldSoftDeleteWithoutSuspendingAi()
    {
        var version = new AiModelVersion("ResNet50", "v1", 0.90m, DateTime.UtcNow, isActive: false);
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        var handler = new DeleteModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);

        var result = await handler.Handle(new DeleteModelVersionCommand(1), default);

        result.Success.Should().BeTrue();
        version.IsDeleted.Should().BeTrue();
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        // No AI client should be requested for an inactive deletion.
        _httpClientFactoryMock.Verify(f => f.CreateClient(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task Handle_WhenActiveVersion_ShouldSoftDeleteAndSuspendAi()
    {
        var version = new AiModelVersion("ResNet50", "v1", 0.90m, DateTime.UtcNow, isActive: true);
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        SetupMockHttpClient(new HttpResponseMessage(HttpStatusCode.OK));

        var handler = new DeleteModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);

        var result = await handler.Handle(new DeleteModelVersionCommand(1), default);

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("suspended");
        version.IsDeleted.Should().BeTrue();
        version.IsActive.Should().BeFalse();
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenActiveAndApiFails_ShouldStillReturnTrueWithWarning()
    {
        var version = new AiModelVersion("ResNet50", "v1", 0.90m, DateTime.UtcNow, isActive: true);
        _repoMock.Setup(r => r.GetVersionByIdAsync(1, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        SetupMockHttpClientException(new HttpRequestException("Connection refused"));

        var handler = new DeleteModelVersionCommandHandler(_repoMock.Object, _uowMock.Object, _httpClientFactoryMock.Object);

        var result = await handler.Handle(new DeleteModelVersionCommand(1), default);

        result.Success.Should().BeTrue();
        result.Message.Should().Contain("AI suspend failed");
        version.IsDeleted.Should().BeTrue();
        _uowMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
