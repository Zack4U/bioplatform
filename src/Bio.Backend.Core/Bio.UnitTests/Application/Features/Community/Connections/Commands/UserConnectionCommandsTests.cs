using Bio.Application.DTOs;
using Bio.Application.Features.Community.Connections.Commands;
using Bio.Domain.Constants;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Community.Connections.Commands;

public class UserConnectionCommandsTests
{
    private readonly Mock<IUserConnectionRepository> _repoMock = new();
    private readonly Mock<IUserRepository> _userRepoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    // ── SEND REQUEST ───────────────────────────────────────────────────────────

    [Fact]
    public async Task SendRequest_WhenValid_ShouldCreate()
    {
        var requesterId = Guid.NewGuid();
        var addresseeId = Guid.NewGuid();
        var user = CreateUser(addresseeId);

        _userRepoMock.Setup(r => r.GetByIdAsync(addresseeId)).ReturnsAsync(user);
        _repoMock.Setup(r => r.GetExistingConnectionAsync(requesterId, addresseeId, default))
            .ReturnsAsync((UserConnection?)null);
        _repoMock.Setup(r => r.GetExistingConnectionAsync(addresseeId, requesterId, default))
            .ReturnsAsync((UserConnection?)null);

        var handler = new SendConnectionRequestCommandHandler(
            _repoMock.Object, _userRepoMock.Object, _uowMock.Object);

        var result = await handler.Handle(
            new SendConnectionRequestCommand(
                new UserConnectionRequestDTO { AddresseeId = addresseeId, Message = "Hi!" },
                requesterId), default);

        result.Should().NotBeNull();
        result.Status.Should().Be("Pending");
        _repoMock.Verify(r => r.AddAsync(It.IsAny<UserConnection>(), default), Times.Once);
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task SendRequest_ToSelf_ShouldThrowValidationException()
    {
        var userId = Guid.NewGuid();
        var handler = new SendConnectionRequestCommandHandler(
            _repoMock.Object, _userRepoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new SendConnectionRequestCommand(
                    new UserConnectionRequestDTO { AddresseeId = userId },
                    userId), default))
            .Should().ThrowAsync<Bio.Domain.Exceptions.ValidationException>();
    }

    [Fact]
    public async Task SendRequest_WhenAlreadyPending_ShouldThrowConflict()
    {
        var requesterId = Guid.NewGuid();
        var addresseeId = Guid.NewGuid();
        var user = CreateUser(addresseeId);
        var existing = new UserConnection(requesterId, addresseeId, "Already pending");

        _userRepoMock.Setup(r => r.GetByIdAsync(addresseeId)).ReturnsAsync(user);
        _repoMock.Setup(r => r.GetExistingConnectionAsync(requesterId, addresseeId, default))
            .ReturnsAsync(existing);

        var handler = new SendConnectionRequestCommandHandler(
            _repoMock.Object, _userRepoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new SendConnectionRequestCommand(
                    new UserConnectionRequestDTO { AddresseeId = addresseeId },
                    requesterId), default))
            .Should().ThrowAsync<ConflictException>();
    }

    // ── RESPOND ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Respond_Accept_ByAddressee_ShouldAccept()
    {
        var addresseeId = Guid.NewGuid();
        var connection = new UserConnection(Guid.NewGuid(), addresseeId);
        _repoMock.Setup(r => r.GetByIdAsync(connection.Id, default)).ReturnsAsync(connection);

        var handler = new RespondConnectionRequestCommandHandler(_repoMock.Object, _uowMock.Object);
        var result = await handler.Handle(
            new RespondConnectionRequestCommand(
                connection.Id, new UserConnectionRespondDTO { Action = "Accept" }, addresseeId), default);

        result.Status.Should().Be("Accepted");
        _uowMock.Verify(u => u.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task Respond_ByRequester_ShouldThrowForbidden()
    {
        var requesterId = Guid.NewGuid();
        var connection = new UserConnection(requesterId, Guid.NewGuid());
        _repoMock.Setup(r => r.GetByIdAsync(connection.Id, default)).ReturnsAsync(connection);

        var handler = new RespondConnectionRequestCommandHandler(_repoMock.Object, _uowMock.Object);

        await FluentActions
            .Awaiting(() => handler.Handle(
                new RespondConnectionRequestCommand(
                    connection.Id, new UserConnectionRespondDTO { Action = "Accept" }, requesterId), default))
            .Should().ThrowAsync<ForbiddenException>();
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task Delete_ByRequester_ShouldDelete()
    {
        var requesterId = Guid.NewGuid();
        var connection = new UserConnection(requesterId, Guid.NewGuid());
        _repoMock.Setup(r => r.GetByIdAsync(connection.Id, default)).ReturnsAsync(connection);

        var handler = new DeleteConnectionCommandHandler(_repoMock.Object, _uowMock.Object);
        await handler.Handle(
            new DeleteConnectionCommand(connection.Id, requesterId, RoleNames.Community), default);

        _repoMock.Verify(r => r.DeleteAsync(connection, default), Times.Once);
    }

    private static User CreateUser(Guid id)
        => new User(id, "Test User", $"user_{id}@bio.com", "hashedpw", "salt");
}
