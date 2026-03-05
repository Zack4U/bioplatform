using Bio.Application.DTOs;
using Bio.Application.Services;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Services;

/// <summary>
/// Unit tests for the <see cref="UserRoleService"/> class.
/// </summary>
public class UserRoleServiceTests
{
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly UserRoleService _userRoleService;

    public UserRoleServiceTests()
    {
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _roleRepositoryMock = new Mock<IRoleRepository>();

        _userRoleService = new UserRoleService(
            _userRoleRepositoryMock.Object,
            _userRepositoryMock.Object,
            _roleRepositoryMock.Object);
    }

    /// <summary>
    /// Verifies that a valid role assignment is successfully processed and saved.
    /// </summary>
    [Fact]
    public async Task AssignRoleAsync_ValidData_ShouldAssignRole()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var dto = new UserRoleCreateDTO { UserId = userId, RoleId = roleId };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(new User { Id = userId, FullName = "Test User" });
        _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync(new Role { Id = roleId, Name = "ADMIN" });
        _userRoleRepositoryMock.Setup(r => r.ExistsAsync(userId, roleId)).ReturnsAsync(false);
        _userRoleRepositoryMock.Setup(r => r.AddAsync(It.IsAny<UserRole>())).Returns(Task.CompletedTask);
        _userRoleRepositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        await _userRoleService.AssignRoleAsync(dto);

        // Assert
        _userRoleRepositoryMock.Verify(r => r.AddAsync(It.IsAny<UserRole>()), Times.Once);
        _userRoleRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    /// <summary>
    /// Verifies that a <see cref="KeyNotFoundException"/> is thrown when the specified user does not exist.
    /// </summary>
    [Fact]
    public async Task AssignRoleAsync_UserNotFound_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var dto = new UserRoleCreateDTO { UserId = Guid.NewGuid(), RoleId = Guid.NewGuid() };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(dto.UserId)).ReturnsAsync((User?)null);

        // Act
        Func<Task> act = async () => await _userRoleService.AssignRoleAsync(dto);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"User with ID {dto.UserId} not found.");
    }

    /// <summary>
    /// Verifies that a <see cref="KeyNotFoundException"/> is thrown when the specified role does not exist.
    /// </summary>
    [Fact]
    public async Task AssignRoleAsync_RoleNotFound_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var dto = new UserRoleCreateDTO { UserId = userId, RoleId = Guid.NewGuid() };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(new User { Id = userId });
        _roleRepositoryMock.Setup(r => r.GetByIdAsync(dto.RoleId)).ReturnsAsync((Role?)null);

        // Act
        Func<Task> act = async () => await _userRoleService.AssignRoleAsync(dto);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"Role with ID {dto.RoleId} not found.");
    }

    /// <summary>
    /// Verifies that an <see cref="InvalidOperationException"/> is thrown when attempt is made 
    /// to assign a role that is already associated with the user.
    /// </summary>
    [Fact]
    public async Task AssignRoleAsync_DuplicateAssignment_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var dto = new UserRoleCreateDTO { UserId = userId, RoleId = roleId };
        var user = new User { Id = userId, FullName = "User" };
        var role = new Role { Id = roleId, Name = "ADMIN" };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
        _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync(role);
        _userRoleRepositoryMock.Setup(r => r.ExistsAsync(userId, roleId)).ReturnsAsync(true);

        // Act
        Func<Task> act = async () => await _userRoleService.AssignRoleAsync(dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"Role 'ADMIN' is already assigned to user 'User'.");
    }
}
