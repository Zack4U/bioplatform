using Bio.Application.Features.UserRoles.Commands.UnassignRole;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.UserRoles.Commands;

/// <summary>
/// Unit tests for the UnassignRoleCommandHandler class.
/// </summary>
public class UnassignRoleCommandHandlerTests
{
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly UnassignRoleCommandHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="UnassignRoleCommandHandlerTests"/> class.
    /// </summary>
    public UnassignRoleCommandHandlerTests()
    {
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _handler = new UnassignRoleCommandHandler(_userRoleRepositoryMock.Object, _unitOfWorkMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of UnassignRoleCommandHandler.
    /// </summary>
    public class Handle : UnassignRoleCommandHandlerTests
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
            _unitOfWorkMock.Verify(r => r.SaveChangesAsync(CancellationToken.None), Times.Once);
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when the assignment does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_AssignmentDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();

            _userRoleRepositoryMock.Setup(r => r.GetByIdsAsync(userId, roleId)).ReturnsAsync((UserRole?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(new UnassignRoleCommand(userId, roleId), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage("Role assignment not found for this user.");
            _userRoleRepositoryMock.Verify(r => r.DeleteAsync(It.IsAny<UserRole>()), Times.Never);
            _unitOfWorkMock.Verify(r => r.SaveChangesAsync(CancellationToken.None), Times.Never);
        }
    }
}
