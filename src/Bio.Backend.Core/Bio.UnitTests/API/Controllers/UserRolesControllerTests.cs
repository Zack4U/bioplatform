using Bio.API.Controllers;
using Bio.Application.DTOs;
using Bio.Application.Features.UserRoles.Commands.AssignRole;
using Bio.Application.Features.UserRoles.Commands.UnassignRole;
using Bio.Application.Features.UserRoles.Queries.GetAllUserRoles;
using Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleName;
using Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleId;
using Bio.Application.Features.UserRoles.Queries.GetUserRolesByUserId;
using Bio.Domain.Exceptions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Moq;
using Xunit;

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="UserRolesController"/> class, organized by endpoint.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IMediator"/>.
/// </summary>
public class UserRolesControllerTests
{
    /// <summary>
    /// Initializes a new instance of the <see cref="UserRolesControllerTests"/> class.
    /// </summary>
    private readonly Mock<IMediator> _mediatorMock;
    private readonly UserRolesController _userRolesController;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserRolesControllerTests"/> class.
    /// </summary>
    public UserRolesControllerTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _userRolesController = new UserRolesController(_mediatorMock.Object);
    }

    public class GetAssignments : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid user role creation request returns a 201 Created response.
        /// </summary>
        [Fact]
        public async Task ShouldReturnOkWithAssignments()
        {
            // Arrange
            var assignments = new List<UserRoleResponseDTO>
            {
                new UserRoleResponseDTO { UserId = Guid.NewGuid(), UserEmail = "a@a.com", RoleName = "ADMIN" }
            };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetAllUserRolesQuery>(), default))
                .ReturnsAsync(assignments);

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
        /// Verifies that a valid user id get request returns a 200 Ok response.
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
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByUserIdQuery>(), default))
                .ReturnsAsync(assignments);

            // Act
            var result = await _userRolesController.GetByUser(userId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(assignments);
        }

        /// <summary>
        /// Verifies that a non-existing user id get request returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByUserIdQuery>(), default))
                .ThrowsAsync(new KeyNotFoundException("User not found."));

            // Act
            var result = await _userRolesController.GetByUser(userId);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }

    public class GetByRole : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role name get request returns a 200 Ok response.
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
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByRoleNameQuery>(), default))
                .ReturnsAsync(assignments);

            // Act
            var result = await _userRolesController.GetByRole(roleName);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(assignments);
        }

        /// <summary>
        /// Verifies that a non-existing role name get request returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExistingRole_ShouldReturnNotFound()
        {
            // Arrange
            var roleName = "NON_EXISTENT";
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByRoleNameQuery>(), default))
                .ThrowsAsync(new KeyNotFoundException("Role not found."));

            // Act
            var result = await _userRolesController.GetByRole(roleName);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }

    public class GetByRoleId : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role id get request returns a 200 Ok response.
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
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByRoleIdQuery>(), default))
                .ReturnsAsync(assignments);

            // Act
            var result = await _userRolesController.GetByRoleId(roleId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(assignments);
        }

        [Fact]
        public async Task NonExistingRoleId_ShouldReturnNotFound()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByRoleIdQuery>(), default))
                .ThrowsAsync(new KeyNotFoundException("Role not found."));

            // Act
            var result = await _userRolesController.GetByRoleId(roleId);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }

    public class AssignRole : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role assignment request returns a 204 No Content response.
        /// </summary>
        [Fact]
        public async Task ValidAssignment_ShouldReturnNoContent()
        {
            // Arrange
            var dto = new UserRoleCreateDTO { UserId = Guid.NewGuid(), RoleId = Guid.NewGuid() };
            _mediatorMock.Setup(m => m.Send(It.IsAny<AssignRoleCommand>(), default))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userRolesController.AssignRole(dto);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that a duplicate role assignment request returns a 409 Conflict response.
        /// </summary>
        [Fact]
        public async Task DuplicateAssignment_ShouldReturnConflict()
        {
            // Arrange
            var dto = new UserRoleCreateDTO { UserId = Guid.NewGuid(), RoleId = Guid.NewGuid() };
            _mediatorMock.Setup(m => m.Send(It.IsAny<AssignRoleCommand>(), default))
                .ThrowsAsync(new ConflictException("Assignment exists."));

            // Act
            var result = await _userRolesController.AssignRole(dto);

            // Assert
            var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
            conflictResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        }

        /// <summary>
        /// Verifies that a user not found role assignment request returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task UserNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var dto = new UserRoleCreateDTO { UserId = Guid.NewGuid(), RoleId = Guid.NewGuid() };
            _mediatorMock.Setup(m => m.Send(It.IsAny<AssignRoleCommand>(), default))
                .ThrowsAsync(new KeyNotFoundException("User not found."));

            // Act
            var result = await _userRolesController.AssignRole(dto);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        }

        /// <summary>
        /// Verifies that a role not found role assignment request returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task RoleNotFound_ShouldReturnNotFound()
        {
            // Arrange
            var dto = new UserRoleCreateDTO { UserId = Guid.NewGuid(), RoleId = Guid.NewGuid() };
            _mediatorMock.Setup(m => m.Send(It.IsAny<AssignRoleCommand>(), default))
                .ThrowsAsync(new KeyNotFoundException("Role not found."));

            // Act
            var result = await _userRolesController.AssignRole(dto);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        }
    }

    public class UnassignRole : UserRolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role unassignment request returns a 204 No Content response.
        /// </summary>
        [Fact]
        public async Task ExistingAssignment_ShouldReturnNoContent()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<UnassignRoleCommand>(), default))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userRolesController.UnassignRole(userId, roleId);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that a non-existing role unassignment request returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExistingAssignment_ShouldReturnNotFound()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<UnassignRoleCommand>(), default))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _userRolesController.UnassignRole(userId, roleId);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        }
    }
}
