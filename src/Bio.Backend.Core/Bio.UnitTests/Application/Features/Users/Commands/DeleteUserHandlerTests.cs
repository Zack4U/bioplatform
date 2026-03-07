using Bio.Application.Features.Users.Commands.DeleteUser;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Commands;

/// <summary>
/// Unit tests for the DeleteUserHandler class.
/// </summary>
public class DeleteUserHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly DeleteUserHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="DeleteUserHandlerTests"/> class.
    /// </summary>
    public DeleteUserHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new DeleteUserHandler(_userRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of DeleteUserHandler.
    /// </summary>
    public class Handle : DeleteUserHandlerTests
    {
        /// <summary>
        /// Verifies that a user is successfully deleted and true is returned when the user exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnTrue_When_UserExistsAndIsDeleted()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "John Doe", "john@example.com", "h", "s");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            var result = await _handler.Handle(new DeleteUserCommand(userId), CancellationToken.None);

            // Assert
            result.Should().BeTrue();
            _userRepositoryMock.Verify(r => r.DeleteAsync(user), Times.Once);
            _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that false is returned when the user to delete does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnFalse_When_UserDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act
            var result = await _handler.Handle(new DeleteUserCommand(userId), CancellationToken.None);

            // Assert
            result.Should().BeFalse();
            _userRepositoryMock.Verify(r => r.DeleteAsync(It.IsAny<User>()), Times.Never);
            _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }
    }
}
