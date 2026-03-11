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
    /// <summary>
    /// Initializes a new instance of the <see cref="RolesControllerTests"/> class.
    /// </summary>
    private readonly Mock<IMediator> _mediatorMock;
    private readonly RolesController _rolesController;

    /// <summary>
    /// Initializes a new instance of the <see cref="RolesControllerTests"/> class.
    /// </summary>
    public RolesControllerTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _rolesController = new RolesController(_mediatorMock.Object);
    }

    public class CreateRole : RolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role creation request returns a 201 Created response.
        /// </summary>
        [Fact]
        public async Task ValidData_ShouldReturnCreated()
        {
            // Arrange
            var dto = new RoleCreateDTO("ADMIN", "Administrator role");
            var responseDto = new RoleResponseDTO(Guid.NewGuid(), "ADMIN", "Administrator role", DateTime.UtcNow);

            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateRoleCommand>(), default))
                .ReturnsAsync(responseDto);

            // Act
            var result = await _rolesController.CreateRole(dto);

            // Assert
            var objectResult = result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(StatusCodes.Status201Created);
            objectResult.Value.Should().Be(responseDto);
        }

        /// <summary>
        /// Verifies that a role creation request with a duplicate name throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task DuplicateName_ShouldThrowConflictException()
        {
            // Arrange
            var dto = new RoleCreateDTO("EXISTING");
            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateRoleCommand>(), default))
                .ThrowsAsync(new ConflictException("Role name already exists."));

            // Act
            var act = async () => await _rolesController.CreateRole(dto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }
    }

    public class GetAllRoles : RolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role creation request returns a 201 Created response.
        /// </summary>
        [Fact]
        public async Task ShouldReturnOkWithRoles()
        {
            // Arrange
            var roles = new List<RoleResponseDTO>
            {
                new RoleResponseDTO(Guid.NewGuid(), "ADMIN"),
                new RoleResponseDTO(Guid.NewGuid(), "USER")
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
        /// <summary>
        /// Verifies that a valid role creation request returns a 201 Created response.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var role = new RoleResponseDTO(id, "ADMIN");
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetRoleByIdQuery>(), default))
                .ReturnsAsync(role);

            // Act
            var result = await _rolesController.GetRoleById(id);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(role);
        }

        /// <summary>
        /// Verifies that a non-existing role ID request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldThrowNotFoundException()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetRoleByIdQuery>(), default))
                .ThrowsAsync(new NotFoundException("Role", id));
 
            // Act
            var act = async () => await _rolesController.GetRoleById(id);
 
            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }

    public class GetRoleByName : RolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role creation request returns a 201 Created response.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var name = "ADMIN";
            var role = new RoleResponseDTO(Guid.NewGuid(), name);
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetRoleByNameQuery>(), default))
                .ReturnsAsync(role);

            // Act
            var result = await _rolesController.GetRoleByName(name);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(role);
        }

        /// <summary>
        /// Verifies that a non-existing role name request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldThrowNotFoundException()
        {
            // Arrange
            var name = "GHOST";
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetRoleByNameQuery>(), default))
                .ThrowsAsync(new NotFoundException("Role", name));
 
            // Act
            var act = async () => await _rolesController.GetRoleByName(name);
 
            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }

    public class UpdateRole : RolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role creation request returns a 201 Created response.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO("SUPERADMIN");
            var response = new RoleResponseDTO(id, "SUPERADMIN");
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateRoleCommand>(), default))
                .ReturnsAsync(response);

            // Act
            var result = await _rolesController.UpdateRole(id, dto);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(response);
        }

        /// <summary>
        /// Verifies that updating a non-existing role throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldThrowNotFoundException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO("FAIL");
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateRoleCommand>(), default))
                .ThrowsAsync(new NotFoundException("Role", id));
 
            // Act
            var act = async () => await _rolesController.UpdateRole(id, dto);
 
            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }

        /// <summary>
        /// Verifies that a role update request with a duplicate name throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task DuplicateName_ShouldThrowConflictException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO("TAKEN");
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateRoleCommand>(), default))
                .ThrowsAsync(new ConflictException("Role name already exists."));

            // Act
            var act = async () => await _rolesController.UpdateRole(id, dto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }
    }

    public class DeleteRole : RolesControllerTests
    {
        /// <summary>
        /// Verifies that a valid role creation request returns a 201 Created response.
        /// </summary>
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

        /// <summary>
        /// Verifies that deleting a non-existing role throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldThrowNotFoundException()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<DeleteRoleCommand>(), default))
                .ThrowsAsync(new NotFoundException("Role", id));
 
            // Act
            var act = async () => await _rolesController.DeleteRole(id);
 
            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }
}
