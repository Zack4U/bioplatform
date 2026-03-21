using Bio.API.Controllers;
using Bio.Domain.Constants;
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
                new UserRoleResponseDTO(Guid.NewGuid(), "a@a.com", Guid.NewGuid(), RoleNames.Admin, DateTime.UtcNow)
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
                new UserRoleResponseDTO(userId, "test@test.com", Guid.NewGuid(), "EDITOR", DateTime.UtcNow)
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
        /// Verifies that a non-existing user ID get request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldThrowNotFoundException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByUserIdQuery>(), default))
                .ThrowsAsync(new NotFoundException("User", userId));

            // Act
            var act = async () => await _userRolesController.GetByUser(userId);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
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
            var roleName = RoleNames.Admin;
            var assignments = new List<UserRoleResponseDTO>
            {
                new UserRoleResponseDTO(Guid.NewGuid(), "admin@test.com", Guid.NewGuid(), roleName, DateTime.UtcNow)
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
        /// Verifies that a non-existing role name get request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExistingRole_ShouldThrowNotFoundException()
        {
            // Arrange
            var roleName = "NON_EXISTENT";
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByRoleNameQuery>(), default))
                .ThrowsAsync(new NotFoundException("Role", roleName));

            // Act
            var act = async () => await _userRolesController.GetByRole(roleName);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
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
                new UserRoleResponseDTO(Guid.NewGuid(), "u@u.com", roleId, "DEV", DateTime.UtcNow)
            };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByRoleIdQuery>(), default))
                .ReturnsAsync(assignments);

            // Act
            var result = await _userRolesController.GetByRoleId(roleId);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(assignments);
        }

        /// <summary>
        /// Verifies that a non-existing role ID get request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExistingRoleId_ShouldThrowNotFoundException()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserRolesByRoleIdQuery>(), default))
                .ThrowsAsync(new NotFoundException("Role", roleId));

            // Act
            var act = async () => await _userRolesController.GetByRoleId(roleId);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
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
            var dto = new UserRoleCreateDTO(Guid.NewGuid(), Guid.NewGuid());
            _mediatorMock.Setup(m => m.Send(It.IsAny<AssignRoleCommand>(), default))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _userRolesController.AssignRole(dto);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that a duplicate role assignment request throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task DuplicateAssignment_ShouldThrowConflictException()
        {
            // Arrange
            var dto = new UserRoleCreateDTO(Guid.NewGuid(), Guid.NewGuid());
            _mediatorMock.Setup(m => m.Send(It.IsAny<AssignRoleCommand>(), default))
                .ThrowsAsync(new ConflictException("Assignment exists."));

            // Act
            var act = async () => await _userRolesController.AssignRole(dto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }

        /// <summary>
        /// Verifies that a user not found role assignment request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task UserNotFound_ShouldThrowNotFoundException()
        {
            // Arrange
            var dto = new UserRoleCreateDTO(Guid.NewGuid(), Guid.NewGuid());
            var userId = dto.UserId!.Value;
            _mediatorMock.Setup(m => m.Send(It.IsAny<AssignRoleCommand>(), default))
                .ThrowsAsync(new NotFoundException("User", userId));

            // Act
            var act = async () => await _userRolesController.AssignRole(dto);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }

        /// <summary>
        /// Verifies that a role not found role assignment request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task RoleNotFound_ShouldThrowNotFoundException()
        {
            // Arrange
            var dto = new UserRoleCreateDTO(Guid.NewGuid(), Guid.NewGuid());
            var roleId = dto.RoleId!.Value;
            _mediatorMock.Setup(m => m.Send(It.IsAny<AssignRoleCommand>(), default))
                .ThrowsAsync(new NotFoundException("Role", roleId));

            // Act
            var act = async () => await _userRolesController.AssignRole(dto);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
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
        /// Verifies that a non-existing role unassignment request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExistingAssignment_ShouldThrowNotFoundException()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var roleId = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<UnassignRoleCommand>(), default))
                .ThrowsAsync(new NotFoundException("Assignment", $"{userId}-{roleId}"));

            // Act
            var act = async () => await _userRolesController.UnassignRole(userId, roleId);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }
}
