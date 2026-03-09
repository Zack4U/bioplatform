using Bio.Application.Features.UserRoles.Commands.UnassignRole;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.UserRoles.Commands;

/// <summary>
/// Unit tests for the UnassignRoleHandler class.
/// </summary>
public class UnassignRoleHandlerTests
{
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly UnassignRoleHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="UnassignRoleHandlerTests"/> class.
    /// </summary>
    public UnassignRoleHandlerTests()
    {
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _handler = new UnassignRoleHandler(_userRoleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of UnassignRoleHandler.
    /// </summary>
    public class Handle : UnassignRoleHandlerTests
    {
        /// <summary>
        /// Verifies that a role assignment is successfully removed when it exists.
        /// </summary>
        [Fact]
        public async Task Should_UnassignRole_When_AssignmentExists()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            var userRole = new UserRole(userId, roleId);

            _userRoleRepositoryMock.Setup(r => r.GetByIdsAsync(userId, roleId)).ReturnsAsync(userRole);

            // Act
            await _handler.Handle(new UnassignRoleCommand(userId, roleId), CancellationToken.None);

            // Assert
            _userRoleRepositoryMock.Verify(r => r.DeleteAsync(userRole), Times.Once);
            _userRoleRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that a KeyNotFoundException is thrown when the assignment does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowKeyNotFoundException_When_AssignmentDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();

            _userRoleRepositoryMock.Setup(r => r.GetByIdsAsync(userId, roleId)).ReturnsAsync((UserRole?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(new UnassignRoleCommand(userId, roleId), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<KeyNotFoundException>()
                .WithMessage($"*{userId}*{roleId}*");
            _userRoleRepositoryMock.Verify(r => r.DeleteAsync(It.IsAny<UserRole>()), Times.Never);
        }
    }
}
