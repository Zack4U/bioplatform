using Bio.Application.Features.Roles.Commands.DeleteRole;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Roles.Commands;

/// <summary>
/// Unit tests for the DeleteRoleCommandHandler class.
/// </summary>
public class DeleteRoleCommandHandlerTests
{
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly DeleteRoleCommandHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="DeleteRoleCommandHandlerTests"/> class.
    /// </summary>
    public DeleteRoleCommandHandlerTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _handler = new DeleteRoleCommandHandler(_roleRepositoryMock.Object, _unitOfWorkMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of DeleteRoleCommandHandler.
    /// </summary>
    public class Handle : DeleteRoleCommandHandlerTests
    {
        /// <summary>
        /// Verifies that a role is successfully deleted when it exists.
        /// </summary>
        [Fact]
        public async Task Should_DeleteRole_When_Exists()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var role = new Role(roleId, "ROLE_NAME", "Description");

            _roleRepositoryMock.Setup(repo => repo.GetByIdAsync(roleId))
                .ReturnsAsync(role);

            // Act
            await _handler.Handle(new DeleteRoleCommand(roleId), CancellationToken.None);

            // Assert
            _roleRepositoryMock.Verify(repo => repo.DeleteAsync(role), Times.Once);
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Once);
        }

        /// <summary>
        /// Verifies that a KeyNotFoundException is thrown when the role to delete does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowKeyNotFoundException_When_RoleDoesNotExist()
        {
            // Arrange
            var roleId = Guid.NewGuid();

            _roleRepositoryMock.Setup(repo => repo.GetByIdAsync(roleId))
                .ReturnsAsync((Role?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(new DeleteRoleCommand(roleId), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<KeyNotFoundException>()
                .WithMessage($"Role with ID '{roleId}' not found.");

            _roleRepositoryMock.Verify(repo => repo.DeleteAsync(It.IsAny<Role>()), Times.Never);
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Never);
        }
    }
}
