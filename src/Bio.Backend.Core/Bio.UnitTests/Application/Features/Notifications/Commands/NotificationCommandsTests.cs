using Bio.Application.DTOs;
using Bio.Application.Features.Notifications.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Notifications.Commands;

public class NotificationCommandsTests
{
    private readonly Mock<INotificationRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    [Fact]
    public async Task MarkAsRead_Valid_ReturnsDTOAndSaves()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notification = new Notification(userId, "Title", "Message", "System");
        var command = new MarkNotificationAsReadCommand(notification.Id, userId);
        var ct = CancellationToken.None;

        _repoMock.Setup(x => x.GetByIdAsync(notification.Id, ct)).ReturnsAsync(notification);
        var handler = new MarkNotificationAsReadCommandHandler(_repoMock.Object, _uowMock.Object);

        // Act
        var result = await handler.Handle(command, ct);

        // Assert
        Assert.True(result.IsRead);
        _uowMock.Verify(x => x.SaveChangesAsync(ct), Times.Once);
    }

    [Fact]
    public async Task MarkAsRead_OtherUser_ThrowsForbidden()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var notification = new Notification(userId, "Title", "Message", "System");
        var command = new MarkNotificationAsReadCommand(notification.Id, otherUserId);
        var ct = CancellationToken.None;

        _repoMock.Setup(x => x.GetByIdAsync(notification.Id, ct)).ReturnsAsync(notification);
        var handler = new MarkNotificationAsReadCommandHandler(_repoMock.Object, _uowMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ForbiddenException>(() => handler.Handle(command, ct));
    }

    [Fact]
    public async Task DeleteNotification_ValidOwner_DeletesAndSaves()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notification = new Notification(userId, "Title", "Message", "System");
        var command = new DeleteNotificationCommand(notification.Id, userId, "USER");
        var ct = CancellationToken.None;

        _repoMock.Setup(x => x.GetByIdAsync(notification.Id, ct)).ReturnsAsync(notification);
        var handler = new DeleteNotificationCommandHandler(_repoMock.Object, _uowMock.Object);

        // Act
        await handler.Handle(command, ct);

        // Assert
        _repoMock.Verify(x => x.DeleteAsync(notification, ct), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(ct), Times.Once);
    }

    [Fact]
    public async Task DeleteNotification_AdminRole_CanDeleteOtherUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var notification = new Notification(userId, "Title", "Message", "System");
        var command = new DeleteNotificationCommand(notification.Id, otherUserId, "ADMIN");
        var ct = CancellationToken.None;

        _repoMock.Setup(x => x.GetByIdAsync(notification.Id, ct)).ReturnsAsync(notification);
        var handler = new DeleteNotificationCommandHandler(_repoMock.Object, _uowMock.Object);

        // Act
        await handler.Handle(command, ct);

        // Assert
        _repoMock.Verify(x => x.DeleteAsync(notification, ct), Times.Once);
        _uowMock.Verify(x => x.SaveChangesAsync(ct), Times.Once);
    }
}
