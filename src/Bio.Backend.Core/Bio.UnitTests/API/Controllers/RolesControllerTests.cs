using Bio.API.Controllers;
using Bio.Application.DTOs;
using Bio.Application.Features.Roles.Commands.CreateRole;
using Bio.Application.Features.Roles.Commands.DeleteRole;
using Bio.Application.Features.Roles.Commands.UpdateRole;
using Bio.Application.Features.Roles.Queries.GetAllRoles;
using Bio.Application.Features.Roles.Queries.GetRoleById;
using Bio.Application.Features.Roles.Queries.GetRoleByName;
using Bio.Domain.Exceptions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Moq;
using Xunit;

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="RolesController"/> class, organized by endpoint.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IMediator"/>.
/// </summary>
public class RolesControllerTests
{
    private readonly Mock<IMediator> _mediatorMock;
    private readonly RolesController _rolesController;

    public RolesControllerTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _rolesController = new RolesController(_mediatorMock.Object);
    }

    public class CreateRole : RolesControllerTests
    {
        [Fact]
        public async Task ValidData_ShouldReturnCreated()
        {
            // Arrange
            var dto = new RoleCreateDTO { Name = "ADMIN", Description = "Administrator role" };
            var responseDto = new RoleResponseDTO { Id = Guid.NewGuid(), Name = "ADMIN", Description = "Administrator role" };

            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateRoleCommand>(), default))
                .ReturnsAsync(responseDto);

            // Act
            var result = await _rolesController.CreateRole(dto);

            // Assert
            var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(StatusCodes.Status201Created);
            objectResult.Value.Should().Be(responseDto);
        }

        [Fact]
        public async Task DuplicateName_ShouldReturnConflict()
        {
            // Arrange
            var dto = new RoleCreateDTO { Name = "EXISTING" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateRoleCommand>(), default))
                .ThrowsAsync(new ConflictException("Role name already exists."));

            // Act
            var result = await _rolesController.CreateRole(dto);

            // Assert
            var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
            conflictResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        }
    }

    public class GetAllRoles : RolesControllerTests
    {
        [Fact]
        public async Task ShouldReturnOkWithRoles()
        {
            // Arrange
            var roles = new List<RoleResponseDTO>
            {
                new RoleResponseDTO { Id = Guid.NewGuid(), Name = "ADMIN" },
                new RoleResponseDTO { Id = Guid.NewGuid(), Name = "USER" }
            };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetAllRolesQuery>(), default))
                .ReturnsAsync(roles);

            // Act
            var result = await _rolesController.GetAllRoles();

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(roles);
        }
    }

    public class GetRoleById : RolesControllerTests
    {
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var role = new RoleResponseDTO { Id = id, Name = "ADMIN" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetRoleByIdQuery>(), default))
                .ReturnsAsync(role);

            // Act
            var result = await _rolesController.GetRoleById(id);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(role);
        }

        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetRoleByIdQuery>(), default))
                .ReturnsAsync((RoleResponseDTO?)null);

            // Act
            var result = await _rolesController.GetRoleById(id);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class GetRoleByName : RolesControllerTests
    {
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var name = "ADMIN";
            var role = new RoleResponseDTO { Id = Guid.NewGuid(), Name = name };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetRoleByNameQuery>(), default))
                .ReturnsAsync(role);

            // Act
            var result = await _rolesController.GetRoleByName(name);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(role);
        }

        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetRoleByNameQuery>(), default))
                .ReturnsAsync((RoleResponseDTO?)null);

            // Act
            var result = await _rolesController.GetRoleByName("GHOST");

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class UpdateRole : RolesControllerTests
    {
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "SUPERADMIN" };
            var response = new RoleResponseDTO { Id = id, Name = "SUPERADMIN" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateRoleCommand>(), default))
                .ReturnsAsync(response);

            // Act
            var result = await _rolesController.UpdateRole(id, dto);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(response);
        }

        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "FAIL" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateRoleCommand>(), default))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _rolesController.UpdateRole(id, dto);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        }

        [Fact]
        public async Task DuplicateName_ShouldReturnConflict()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "TAKEN" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateRoleCommand>(), default))
                .ThrowsAsync(new ConflictException("Role name already exists."));

            // Act
            var result = await _rolesController.UpdateRole(id, dto);

            // Assert
            var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
            conflictResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        }
    }

    public class DeleteRole : RolesControllerTests
    {
        [Fact]
        public async Task ExistingRole_ShouldReturnNoContent()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<DeleteRoleCommand>(), default))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _rolesController.DeleteRole(id);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<DeleteRoleCommand>(), default))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _rolesController.DeleteRole(id);

            // Assert
            var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
            notFoundResult.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        }
    }
}
