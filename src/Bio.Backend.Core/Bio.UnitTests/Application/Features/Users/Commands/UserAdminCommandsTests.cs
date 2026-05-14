using Bio.Application.DTOs;
using Bio.Application.Features.Users.Commands;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Commands;

public class UserAdminCommandsTests
{
    private readonly Mock<IUserRepository> _repoMock = new();
    private readonly Mock<IUnitOfWork> _uowMock = new();

    [Fact]
    public async Task ActivateUser_InactiveUser_ActivatesAndSaves()
    {
        // Arrange
        var user = new User(Guid.NewGuid(), "Name", "email@test.com", "hash", "salt");
        user.Deactivate(); // Starts inactive
        var command = new ActivateUserCommand(user.Id);
        var ct = CancellationToken.None;

        _repoMock.Setup(x => x.GetByIdAsync(user.Id)).ReturnsAsync(user);
        var handler = new ActivateUserCommandHandler(_repoMock.Object, _uowMock.Object);

        // Act
        await handler.Handle(command, ct);

        // Assert
        Assert.True(user.IsActive);
        _uowMock.Verify(x => x.SaveChangesAsync(ct), Times.Once);
    }

    [Fact]
    public async Task ActivateUser_AlreadyActive_ThrowsConflict()
    {
        // Arrange
        var user = new User(Guid.NewGuid(), "Name", "email@test.com", "hash", "salt");
        var command = new ActivateUserCommand(user.Id);
        var ct = CancellationToken.None;

        _repoMock.Setup(x => x.GetByIdAsync(user.Id)).ReturnsAsync(user);
        var handler = new ActivateUserCommandHandler(_repoMock.Object, _uowMock.Object);

        // Act & Assert
        await Assert.ThrowsAsync<ConflictException>(() => handler.Handle(command, ct));
    }

    [Fact]
    public async Task DeactivateUser_ActiveUser_DeactivatesAndSaves()
    {
        // Arrange
        var user = new User(Guid.NewGuid(), "Name", "email@test.com", "hash", "salt");
        var command = new DeactivateUserCommand(user.Id);
        var ct = CancellationToken.None;

        _repoMock.Setup(x => x.GetByIdAsync(user.Id)).ReturnsAsync(user);
        var handler = new DeactivateUserCommandHandler(_repoMock.Object, _uowMock.Object);

        // Act
        await handler.Handle(command, ct);

        // Assert
        Assert.False(user.IsActive);
        _uowMock.Verify(x => x.SaveChangesAsync(ct), Times.Once);
    }
}
