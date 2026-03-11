using Bio.Application.DTOs;
using Bio.Application.Features.UserRoles.Commands.AssignRole;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.UserRoles.Commands;

/// <summary>
/// Unit tests for the AssignRoleCommandHandler class.
/// </summary>
public class AssignRoleCommandHandlerTests
{
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly AssignRoleCommandHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="AssignRoleCommandHandlerTests"/> class.
    /// </summary>
    public AssignRoleCommandHandlerTests()
    {
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _handler = new AssignRoleCommandHandler(
            _userRoleRepositoryMock.Object,
            _userRepositoryMock.Object,
            _roleRepositoryMock.Object,
            _unitOfWorkMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of AssignRoleCommandHandler.
    /// </summary>
    public class Handle : AssignRoleCommandHandlerTests
    {
        /// <summary>
        /// Verifies that a role is successfully assigned when user and role exist and no duplicate assignment.
        /// </summary>
        [Fact]
        public async Task Should_AssignRole_When_UserAndRoleExistAndNotDuplicate()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            var user = new User(userId, "Alice", "alice@example.com", "h", "s");
            var role = new Role(roleId, "ADMIN", "Admin Role");
            var dto = new UserRoleCreateDTO(userId, roleId);
            var command = new AssignRoleCommand(dto);

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync(role);
            _userRoleRepositoryMock.Setup(r => r.ExistsAsync(userId, roleId)).ReturnsAsync(false);

            // Act
            await _handler.Handle(command, CancellationToken.None);

            // Assert
            _userRoleRepositoryMock.Verify(r => r.AddAsync(It.IsAny<UserRole>()), Times.Once);
            _unitOfWorkMock.Verify(r => r.SaveChangesAsync(CancellationToken.None), Times.Once);
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when the user does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_UserDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            var dto = new UserRoleCreateDTO(userId, roleId);
            var command = new AssignRoleCommand(dto);

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"*User*{userId}*not found*");
            _userRoleRepositoryMock.Verify(r => r.AddAsync(It.IsAny<UserRole>()), Times.Never);
            _unitOfWorkMock.Verify(r => r.SaveChangesAsync(CancellationToken.None), Times.Never);
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when the role does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_RoleDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            var user = new User(userId, "Alice", "alice@example.com", "h", "s");
            var dto = new UserRoleCreateDTO(userId, roleId);
            var command = new AssignRoleCommand(dto);

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync((Role?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"*Role*{roleId}*not found*");
            _userRoleRepositoryMock.Verify(r => r.AddAsync(It.IsAny<UserRole>()), Times.Never);
            _unitOfWorkMock.Verify(r => r.SaveChangesAsync(CancellationToken.None), Times.Never);
        }

        /// <summary>
        /// Verifies that a ConflictException is thrown when the role is already assigned to the user.
        /// </summary>
        [Fact]
        public async Task Should_ThrowConflictException_When_AssignmentAlreadyExists()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            var user = new User(userId, "Alice", "alice@example.com", "h", "s");
            var role = new Role(roleId, "ADMIN", "Admin Role");
            var dto = new UserRoleCreateDTO(userId, roleId);
            var command = new AssignRoleCommand(dto);

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync(role);
            _userRoleRepositoryMock.Setup(r => r.ExistsAsync(userId, roleId)).ReturnsAsync(true);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<Bio.Domain.Exceptions.ConflictException>()
                .WithMessage($"*{role.Name}*");
            _userRoleRepositoryMock.Verify(r => r.AddAsync(It.IsAny<UserRole>()), Times.Never);
            _unitOfWorkMock.Verify(r => r.SaveChangesAsync(CancellationToken.None), Times.Never);
        }
    }
}
