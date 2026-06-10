using Bio.Application.DTOs;
using Bio.Application.Features.Community.Messaging.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Community.Messaging.Commands;

public class DirectThreadCommandsTests
{
    private readonly Mock<IDirectThreadRepository> _repoMock = new();
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    // ── CREATE DIRECT THREAD ───────────────────────────────────────────────────

    [Fact]
    public async Task CreateDirectThread_WhenValid_ShouldCreateAndReturn()
    {
        var actorId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        var user = new User(otherId, "Other", $"other@bio.com", "hash", "salt");

        _repoMock.Setup(r => r.GetDirectThreadBetweenUsersAsync(actorId, otherId, default))
            .ReturnsAsync((DirectThread?)null);
        _userRepoMock.Setup(r => r.GetByIdAsync(otherId)).ReturnsAsync(user);

        var handler = new CreateDirectThreadCommandHandler(
            _repoMock.Object, _userRepoMock.Object, _uowMock.Object);

        var result = await handler.Handle(
            new CreateDirectThreadCommand(
                new CreateDirectThreadDTO { ThreadType = "Direct", ParticipantIds = [otherId] },
                actorId), default);

        result.Should().NotBeNull();
        result.ThreadType.Should().Be("Direct");
        _repoMock.Verify(r => r.AddThreadAsync(It.IsAny<DirectThread>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task CreateDirectThread_WhenExistingThread_ShouldReturnExisting()
    {
        var actorId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        var existing = new DirectThread("Direct", null);

        _repoMock.Setup(r => r.GetDirectThreadBetweenUsersAsync(actorId, otherId, default))
            .ReturnsAsync(existing);

        var handler = new CreateDirectThreadCommandHandler(
            _repoMock.Object, _userRepoMock.Object, _uowMock.Object);

        var result = await handler.Handle(
            new CreateDirectThreadCommand(
                new CreateDirectThreadDTO { ThreadType = "Direct", ParticipantIds = [otherId] },
                actorId), default);

        result.Should().NotBeNull();
        result.Id.Should().Be(existing.Id);
        // Should NOT create a new thread
        _repoMock.Verify(r => r.AddThreadAsync(It.IsAny<DirectThread>(), default), Times.Never);
    }

    [Fact]
    public async Task CreateDirectThread_ToSelf_ShouldThrowValidationException()
    {
        var actorId = Guid.NewGuid();
        var handler = new CreateDirectThreadCommandHandler(
            _repoMock.Object, _userRepoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new CreateDirectThreadCommand(
                    new CreateDirectThreadDTO { ThreadType = "Direct", ParticipantIds = [actorId] },
                    actorId), default))
            .Should().ThrowAsync<Bio.Domain.Exceptions.ValidationException>();
    }

    [Fact]
    public async Task CreateDirectThread_WithTwoParticipants_ShouldThrowValidationException()
    {
        var actorId = Guid.NewGuid();
        var handler = new CreateDirectThreadCommandHandler(
            _repoMock.Object, _userRepoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new CreateDirectThreadCommand(
                    new CreateDirectThreadDTO
                    {
                        ThreadType = "Direct",
                        ParticipantIds = [Guid.NewGuid(), Guid.NewGuid()]
                    },
                    actorId), default))
            .Should().ThrowAsync<Bio.Domain.Exceptions.ValidationException>();
    }

    // ── SEND MESSAGE ───────────────────────────────────────────────────────────

    [Fact]
    public async Task SendMessage_WhenParticipant_ShouldAddMessage()
    {
        var actorId = Guid.NewGuid();
        var threadId = Guid.NewGuid();
        var thread = new DirectThread("Direct", null);

        _repoMock.Setup(r => r.IsParticipantAsync(threadId, actorId, default)).ReturnsAsync(true);
        _repoMock.Setup(r => r.GetByIdWithParticipantsAsync(threadId, default)).ReturnsAsync(thread);

        var handler = new SendDirectMessageCommandHandler(_repoMock.Object, _uowMock.Object);

        var result = await handler.Handle(
            new SendDirectMessageCommand(
                threadId, new SendDirectMessageDTO { Content = "Hello!" }, actorId), default);

        result.Should().NotBeNull();
        result.Content.Should().Be("Hello!");
        _repoMock.Verify(r => r.AddMessageAsync(It.IsAny<DirectMessage>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task SendMessage_WhenNotParticipant_ShouldThrowForbidden()
    {
        var actorId = Guid.NewGuid();
        var threadId = Guid.NewGuid();

        _repoMock.Setup(r => r.IsParticipantAsync(threadId, actorId, default)).ReturnsAsync(false);

        var handler = new SendDirectMessageCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new SendDirectMessageCommand(
                    threadId, new SendDirectMessageDTO { Content = "Hello!" }, actorId), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    // ── MARK AS READ ───────────────────────────────────────────────────────────

    [Fact]
    public async Task MarkAsRead_WhenParticipant_ShouldMarkUnreadMessages()
    {
        var actorId = Guid.NewGuid();
        var senderId = Guid.NewGuid();
        var threadId = Guid.NewGuid();

        var msg1 = new DirectMessage(threadId, senderId, "Msg 1");
        var msg2 = new DirectMessage(threadId, senderId, "Msg 2");
        var unread = new List<DirectMessage> { msg1, msg2 };

        _repoMock.Setup(r => r.IsParticipantAsync(threadId, actorId, default)).ReturnsAsync(true);
        _repoMock.Setup(r => r.GetUnreadMessagesAsync(threadId, actorId, default)).ReturnsAsync(unread);
        _repoMock.Setup(r => r.MessageReadExistsAsync(It.IsAny<Guid>(), actorId, default)).ReturnsAsync(false);

        var handler = new MarkThreadMessagesReadCommandHandler(_repoMock.Object, _uowMock.Object);
        var count = await handler.Handle(
            new MarkThreadMessagesReadCommand(threadId, actorId), default);

        count.Should().Be(2);
        _repoMock.Verify(r => r.AddMessageReadAsync(It.IsAny<DirectMessageRead>(), default), Times.Exactly(2));
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task MarkAsRead_WhenNotParticipant_ShouldThrowForbidden()
    {
        var actorId = Guid.NewGuid();
        var threadId = Guid.NewGuid();

        _repoMock.Setup(r => r.IsParticipantAsync(threadId, actorId, default)).ReturnsAsync(false);

        var handler = new MarkThreadMessagesReadCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new MarkThreadMessagesReadCommand(threadId, actorId), default))
            .Should().ThrowAsync<ForbiddenException>();
    }
}
