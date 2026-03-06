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

    /// <summary>
    /// Verifies that all user-role assignments are retrieved with their details.
    /// </summary>
    [Fact]
    public async Task GetAllAssignmentsAsync_ShouldReturnAssignments()
    {
        // Arrange
        var assignments = new List<UserRoleDetail>
        {
            new UserRoleDetail { UserId = Guid.NewGuid(), UserEmail = "user1@example.com", RoleId = Guid.NewGuid(), RoleName = "ADMIN" },
            new UserRoleDetail { UserId = Guid.NewGuid(), UserEmail = "user2@example.com", RoleId = Guid.NewGuid(), RoleName = "USER" }
        };

        _userRoleRepositoryMock.Setup(r => r.GetAllWithDetailsAsync()).ReturnsAsync(assignments);

        // Act
        var result = await _userRoleService.GetAllAssignmentsAsync();

        // Assert
        result.Should().HaveCount(2);
        var first = result.First();
        first.UserEmail.Should().Be("user1@example.com");
        first.RoleName.Should().Be("ADMIN");
        _userRoleRepositoryMock.Verify(r => r.GetAllWithDetailsAsync(), Times.Once);
    }

    /// <summary>
    /// Verifies that roles assigned to a specific user are correctly retrieved.
    /// </summary>
    [Fact]
    public async Task GetAssignmentsByUserIdAsync_ShouldReturnAssignments()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var assignments = new List<UserRoleDetail>
        {
            new UserRoleDetail { UserId = userId, UserEmail = "user1@example.com", RoleId = Guid.NewGuid(), RoleName = "ADMIN" }
        };

        _userRoleRepositoryMock.Setup(r => r.GetByUserIdWithDetailsAsync(userId)).ReturnsAsync(assignments);

        // Act
        var result = await _userRoleService.GetAssignmentsByUserIdAsync(userId);

        // Assert
        result.Should().HaveCount(1);
        result.First().UserEmail.Should().Be("user1@example.com");
        _userRoleRepositoryMock.Verify(r => r.GetByUserIdWithDetailsAsync(userId), Times.Once);
    }

    /// <summary>
    /// Verifies that users assigned to a specific role name are correctly retrieved.
    /// </summary>
    [Fact]
    public async Task GetAssignmentsByRoleNameAsync_ShouldReturnAssignments()
    {
        // Arrange
        var roleName = "ADMIN";
        var assignments = new List<UserRoleDetail>
        {
            new UserRoleDetail { UserId = Guid.NewGuid(), UserEmail = "user1@example.com", RoleId = Guid.NewGuid(), RoleName = roleName }
        };

        _userRoleRepositoryMock.Setup(r => r.GetByRoleNameWithDetailsAsync(roleName)).ReturnsAsync(assignments);

        // Act
        var result = await _userRoleService.GetAssignmentsByRoleNameAsync(roleName);

        // Assert
        result.Should().HaveCount(1);
        result.First().UserEmail.Should().Be("user1@example.com");
        _userRoleRepositoryMock.Verify(r => r.GetByRoleNameWithDetailsAsync(roleName), Times.Once);
    }

    /// <summary>
    /// Verifies that users assigned to a specific role ID are correctly retrieved.
    /// </summary>
    [Fact]
    public async Task GetAssignmentsByRoleIdAsync_ShouldReturnAssignments()
    {
        // Arrange
        var roleId = Guid.NewGuid();
        var assignments = new List<UserRoleDetail>
        {
            new UserRoleDetail { UserId = Guid.NewGuid(), UserEmail = "user1@example.com", RoleId = roleId, RoleName = "ADMIN" }
        };

        _userRoleRepositoryMock.Setup(r => r.GetByRoleIdWithDetailsAsync(roleId)).ReturnsAsync(assignments);

        // Act
        var result = await _userRoleService.GetAssignmentsByRoleIdAsync(roleId);

        // Assert
        result.Should().HaveCount(1);
        result.First().UserEmail.Should().Be("user1@example.com");
        _userRoleRepositoryMock.Verify(r => r.GetByRoleIdWithDetailsAsync(roleId), Times.Once);
    }

    /// <summary>
    /// Verifies that an existing role assignment is successfully removed.
    /// </summary>
    [Fact]
    public async Task UnassignRoleAsync_ExistingAssignment_ShouldRemoveRole()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();
        var userRole = new UserRole { UserId = userId, RoleId = roleId };

        _userRoleRepositoryMock.Setup(r => r.GetByIdsAsync(userId, roleId)).ReturnsAsync(userRole);
        _userRoleRepositoryMock.Setup(r => r.DeleteAsync(userRole)).Returns(Task.CompletedTask);
        _userRoleRepositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Act
        await _userRoleService.UnassignRoleAsync(userId, roleId);

        // Assert
        _userRoleRepositoryMock.Verify(r => r.GetByIdsAsync(userId, roleId), Times.Once);
        _userRoleRepositoryMock.Verify(r => r.DeleteAsync(userRole), Times.Once);
        _userRoleRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    /// <summary>
    /// Verifies that a <see cref="KeyNotFoundException"/> is thrown when attempt is made 
    /// to unassign a role that is not associated with the user.
    /// </summary>
    [Fact]
    public async Task UnassignRoleAsync_NonExistingAssignment_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        _userRoleRepositoryMock.Setup(r => r.GetByIdsAsync(userId, roleId)).ReturnsAsync((UserRole?)null);

        // Act
        Func<Task> act = async () => await _userRoleService.UnassignRoleAsync(userId, roleId);

        // Assert
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage($"Assignment for User {userId} and Role {roleId} not found.");
        _userRoleRepositoryMock.Verify(r => r.DeleteAsync(It.IsAny<UserRole>()), Times.Never);
        _userRoleRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
    }
}
