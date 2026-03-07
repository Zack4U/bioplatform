using Bio.Application.Features.Roles.Commands.DeleteRole;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Roles.Commands;

/// <summary>
/// Unit tests for the DeleteRoleHandler class.
/// </summary>
public class DeleteRoleHandlerTests
{
    /// <summary>
    /// Initializes a new instance of the <see cref="DeleteRoleHandlerTests"/> class.
    /// </summary>
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly DeleteRoleHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="DeleteRoleHandlerTests"/> class.
    /// </summary>
    public DeleteRoleHandlerTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _handler = new DeleteRoleHandler(_roleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of DeleteRoleHandler.
    /// </summary>
    public class Handle : DeleteRoleHandlerTests
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
            _roleRepositoryMock.Verify(repo => repo.SaveChangesAsync(), Times.Once);
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
            _roleRepositoryMock.Verify(repo => repo.SaveChangesAsync(), Times.Never);
        }
    }
}
