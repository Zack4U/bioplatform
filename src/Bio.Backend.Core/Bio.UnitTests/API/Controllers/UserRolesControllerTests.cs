using Bio.API.Controllers;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="UserRolesController"/> class, organized by endpoint.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IUserRoleService"/>.
/// </summary>
public class UserRolesControllerTests
{
    private readonly Mock<IUserRoleService> _userRoleServiceMock;
    private readonly UserRolesController _userRolesController;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserRolesControllerTests"/> class.
    /// </summary>
    public UserRolesControllerTests()
    {
        _userRoleServiceMock = new Mock<IUserRoleService>();
        _userRolesController = new UserRolesController(_userRoleServiceMock.Object);
    }

    public class GetAssignments : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that retrieving all assignments returns a 200 OK response.
        /// </summary>
        [Fact]
        public async Task ShouldReturnOkWithAssignments()
        {
            // Arrange
            var assignments = new List<UserRoleResponseDTO>
            {
                new UserRoleResponseDTO { UserId = Guid.NewGuid(), UserEmail = "a@a.com", RoleName = "ADMIN" }
            };
            _userRoleServiceMock.Setup(s => s.GetAllAssignmentsAsync()).ReturnsAsync(assignments);

            // Act
            var result = await _userRolesController.GetAssignments();

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(assignments);
        }
    }

    public class GetByUser : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that retrieving assignments for a specific user returns a 200 OK response.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var assignments = new List<UserRoleResponseDTO>
            {
                new UserRoleResponseDTO { UserId = userId, UserEmail = "test@test.com", RoleName = "EDITOR" }
            };
            _userRoleServiceMock.Setup(s => s.GetAssignmentsByUserIdAsync(userId)).ReturnsAsync(assignments);

            // Act
            var result = await _userRolesController.GetByUser(userId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(assignments);
        }

        /// <summary>
        /// Verifies that if the user does not exist or has no roles, it returns a 200 OK
        /// response with an empty list (current system behavior).
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldReturnEmptyList()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _userRoleServiceMock.Setup(s => s.GetAssignmentsByUserIdAsync(userId))
                .ReturnsAsync(new List<UserRoleResponseDTO>());

            // Act
            var result = await _userRolesController.GetByUser(userId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var list = okResult.Value.Should().BeAssignableTo<IEnumerable<UserRoleResponseDTO>>().Subject;
            list.Should().BeEmpty();
        }
    }

    public class GetByRole : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that retrieving assignments by role name returns a 200 OK response.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var roleName = "ADMIN";
            var assignments = new List<UserRoleResponseDTO>
            {
                new UserRoleResponseDTO { UserId = Guid.NewGuid(), UserEmail = "admin@test.com", RoleName = roleName }
            };
            _userRoleServiceMock.Setup(s => s.GetAssignmentsByRoleNameAsync(roleName)).ReturnsAsync(assignments);

            // Act
            var result = await _userRolesController.GetByRole(roleName);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(assignments);
        }

        /// <summary>
        /// Verifies that if the role name does not exist or has no users, it returns a 200 OK
        /// response with an empty list (current system behavior).
        /// </summary>
        [Fact]
        public async Task NonExistingRole_ShouldReturnEmptyList()
        {
            // Arrange
            var roleName = "NON_EXISTENT";
            _userRoleServiceMock.Setup(s => s.GetAssignmentsByRoleNameAsync(roleName))
                .ReturnsAsync(new List<UserRoleResponseDTO>());

            // Act
            var result = await _userRolesController.GetByRole(roleName);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var list = okResult.Value.Should().BeAssignableTo<IEnumerable<UserRoleResponseDTO>>().Subject;
            list.Should().BeEmpty();
        }
    }

    public class GetByRoleId : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that retrieving assignments by role ID returns a 200 OK response.
        /// </summary>
        [Fact]
        public async Task ExistingRoleId_ShouldReturnOk()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var assignments = new List<UserRoleResponseDTO>
            {
                new UserRoleResponseDTO { RoleId = roleId, RoleName = "DEV" }
            };
            _userRoleServiceMock.Setup(s => s.GetAssignmentsByRoleIdAsync(roleId)).ReturnsAsync(assignments);

            // Act
            var result = await _userRolesController.GetByRoleId(roleId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(assignments);
        }

        /// <summary>
        /// Verifies that if the role ID does not exist or has no users, it returns a 200 OK
        /// response with an empty list (current system behavior).
        /// </summary>
        [Fact]
        public async Task NonExistingRoleId_ShouldReturnEmptyList()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            _userRoleServiceMock.Setup(s => s.GetAssignmentsByRoleIdAsync(roleId))
                .ReturnsAsync(new List<UserRoleResponseDTO>());

            // Act
            var result = await _userRolesController.GetByRoleId(roleId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var list = okResult.Value.Should().BeAssignableTo<IEnumerable<UserRoleResponseDTO>>().Subject;
            list.Should().BeEmpty();
        }
    }

    public class AssignRole : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that assigning a valid role returns a 204 No Content response.
        /// </summary>
        [Fact]
        public async Task ValidAssignment_ShouldReturnNoContent()
        {
            // Arrange
            var dto = new UserRoleCreateDTO { UserId = Guid.NewGuid(), RoleId = Guid.NewGuid() };
            _userRoleServiceMock.Setup(s => s.AssignRoleAsync(dto)).Returns(Task.CompletedTask);

            // Act
            var result = await _userRolesController.AssignRole(dto);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that if the assignment already exists, it returns a 400 Bad Request.
        /// </summary>
        [Fact]
        public async Task DuplicateAssignment_ShouldReturnBadRequest()
        {
            // Arrange
            var dto = new UserRoleCreateDTO { UserId = Guid.NewGuid(), RoleId = Guid.NewGuid() };
            _userRoleServiceMock.Setup(s => s.AssignRoleAsync(dto))
                .ThrowsAsync(new InvalidOperationException("Assignment exists."));

            // Act
            var result = await _userRolesController.AssignRole(dto);

            // Assert
            result.Should().BeOfType<BadRequestObjectResult>();
        }

        /// <summary>
        /// Verifies that if the user or role is not found, it returns a 404 Not Found.
        /// </summary>
        [Fact]
        public async Task EntityNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var dto = new UserRoleCreateDTO { UserId = Guid.NewGuid(), RoleId = Guid.NewGuid() };
            _userRoleServiceMock.Setup(s => s.AssignRoleAsync(dto))
                .ThrowsAsync(new KeyNotFoundException("User not found."));

            // Act
            var result = await _userRolesController.AssignRole(dto);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }

    public class UnassignRole : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that unassigning a role returns a 204 No Content response.
        /// </summary>
        [Fact]
        public async Task ExistingAssignment_ShouldReturnNoContent()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            _userRoleServiceMock.Setup(s => s.UnassignRoleAsync(userId, roleId)).Returns(Task.CompletedTask);

            // Act
            var result = await _userRolesController.UnassignRole(userId, roleId);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that if the assignment is not found, it returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExistingAssignment_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            _userRoleServiceMock.Setup(s => s.UnassignRoleAsync(userId, roleId))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _userRolesController.UnassignRole(userId, roleId);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }
}
