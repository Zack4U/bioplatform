using Bio.Application.Features.Users.Commands.DeleteUser;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Commands;

/// <summary>
/// Unit tests for the DeleteUserCommandHandler class.
/// </summary>
public class DeleteUserCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly DeleteUserCommandHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="DeleteUserCommandHandlerTests"/> class.
    /// </summary>
    public DeleteUserCommandHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _handler = new DeleteUserCommandHandler(_userRepositoryMock.Object, _unitOfWorkMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of DeleteUserCommandHandler.
    /// </summary>
    public class Handle : DeleteUserCommandHandlerTests
    {
        /// <summary>
        /// Verifies that a user is successfully deleted when the user exists.
        /// </summary>
        [Fact]
        public async Task Should_Delete_When_UserExists()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "John Doe", "john@example.com", "h", "s");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            await _handler.Handle(new DeleteUserCommand(userId), CancellationToken.None);

            // Assert
            _userRepositoryMock.Verify(r => r.DeleteAsync(user), Times.Once);
            _unitOfWorkMock.Verify(r => r.SaveChangesAsync(CancellationToken.None), Times.Once);
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when attempting to delete a non-existent user.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_UserDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act
            var act = async () => await _handler.Handle(new DeleteUserCommand(userId), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
            _userRepositoryMock.Verify(r => r.DeleteAsync(It.IsAny<User>()), Times.Never);
            _unitOfWorkMock.Verify(r => r.SaveChangesAsync(CancellationToken.None), Times.Never);
        }
    }
}
