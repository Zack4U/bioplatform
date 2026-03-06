using Bio.API.Controllers;
using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="RolesController"/> class, organized by endpoint.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IRoleService"/>.
/// </summary>
public class RolesControllerTests
{
    private readonly Mock<IRoleService> _roleServiceMock;
    private readonly RolesController _rolesController;

    /// <summary>
    /// Initializes a new instance of the <see cref="RolesControllerTests"/> class.
    /// </summary>
    public RolesControllerTests()
    {
        _roleServiceMock = new Mock<IRoleService>();
        _rolesController = new RolesController(_roleServiceMock.Object);
    }

    public class CreateRole : RolesControllerTests
    {
        /// <summary>
        /// Verifies that providing valid role data returns a 201 Created response.
        /// </summary>
        [Fact]
        public async Task ValidData_ShouldReturnCreated()
        {
            // Arrange
            var dto = new RoleCreateDTO { Name = "ADMIN", Description = "Administrator role" };
            var responseDto = new RoleResponseDTO { Id = Guid.NewGuid(), Name = "ADMIN", Description = "Administrator role" };

            _roleServiceMock.Setup(s => s.CreateRoleAsync(dto)).ReturnsAsync(responseDto);

            // Act
            var result = await _rolesController.CreateRole(dto);

            // Assert
            var objectResult = result.Result.Should().BeOfType<ObjectResult>().Subject;
            objectResult.StatusCode.Should().Be(StatusCodes.Status201Created);
            objectResult.Value.Should().Be(responseDto);
        }

        /// <summary>
        /// Verifies that if the role name already exists, it returns a 400 Bad Request.
        /// </summary>
        [Fact]
        public async Task DuplicateName_ShouldReturnBadRequest()
        {
            // Arrange
            var dto = new RoleCreateDTO { Name = "EXISTING" };
            _roleServiceMock.Setup(s => s.CreateRoleAsync(dto))
                .ThrowsAsync(new InvalidOperationException("Role name already exists."));

            // Act
            var result = await _rolesController.CreateRole(dto);

            // Assert
            var badRequest = result.Result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().NotBeNull();
        }
    }

    public class GetAllRoles : RolesControllerTests
    {
        /// <summary>
        /// Verifies that retrieving all roles returns a 200 OK response with the role list.
        /// </summary>
        [Fact]
        public async Task ShouldReturnOkWithRoles()
        {
            // Arrange
            var roles = new List<RoleResponseDTO>
            {
                new RoleResponseDTO { Id = Guid.NewGuid(), Name = "ADMIN" },
                new RoleResponseDTO { Id = Guid.NewGuid(), Name = "USER" }
            };
            _roleServiceMock.Setup(s => s.GetAllRolesAsync()).ReturnsAsync(roles);

            // Act
            var result = await _rolesController.GetAllRoles();

            // Assert
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(roles);
        }
    }

    public class GetRoleById : RolesControllerTests
    {
        /// <summary>
        /// Verifies that requesting an existing role by ID returns a 200 OK response.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var role = new RoleResponseDTO { Id = id, Name = "ADMIN" };
            _roleServiceMock.Setup(s => s.GetRoleByIdAsync(id)).ReturnsAsync(role);

            // Act
            var result = await _rolesController.GetRoleById(id);

            // Assert
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(role);
        }

        /// <summary>
        /// Verifies that requesting a non-existent role by ID returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _roleServiceMock.Setup(s => s.GetRoleByIdAsync(id)).ReturnsAsync((RoleResponseDTO?)null);

            // Act
            var result = await _rolesController.GetRoleById(id);

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class GetRoleByName : RolesControllerTests
    {
        /// <summary>
        /// Verifies that requesting an existing role by name returns a 200 OK response.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var name = "ADMIN";
            var role = new RoleResponseDTO { Id = Guid.NewGuid(), Name = name };
            _roleServiceMock.Setup(s => s.GetRoleByNameAsync(name)).ReturnsAsync(role);

            // Act
            var result = await _rolesController.GetRoleByName(name);

            // Assert
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(role);
        }

        /// <summary>
        /// Verifies that requesting a non-existent role by name returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            _roleServiceMock.Setup(s => s.GetRoleByNameAsync(It.IsAny<string>())).ReturnsAsync((RoleResponseDTO?)null);

            // Act
            var result = await _rolesController.GetRoleByName("GHOST");

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class UpdateRole : RolesControllerTests
    {
        /// <summary>
        /// Verifies that updating an existing role returns a 200 OK response.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "SUPERADMIN" };
            var response = new RoleResponseDTO { Id = id, Name = "SUPERADMIN" };
            _roleServiceMock.Setup(s => s.UpdateRoleAsync(id, dto)).ReturnsAsync(response);

            // Act
            var result = await _rolesController.UpdateRole(id, dto);

            // Assert
            var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(response);
        }

        /// <summary>
        /// Verifies that attempting to update a non-existent role returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "FAIL" };
            _roleServiceMock.Setup(s => s.UpdateRoleAsync(id, dto))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _rolesController.UpdateRole(id, dto);

            // Assert
            result.Result.Should().BeOfType<NotFoundObjectResult>();
        }

        /// <summary>
        /// Verifies that updating a role name to one that already exists results in a 400 Bad Request.
        /// </summary>
        [Fact]
        public async Task DuplicateName_ShouldReturnBadRequest()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "TAKEN" };
            _roleServiceMock.Setup(s => s.UpdateRoleAsync(id, dto))
                .ThrowsAsync(new InvalidOperationException());

            // Act
            var result = await _rolesController.UpdateRole(id, dto);

            // Assert
            result.Result.Should().BeOfType<BadRequestObjectResult>();
        }
    }

    public class DeleteRole : RolesControllerTests
    {
        /// <summary>
        /// Verifies that deleting an existing role returns a 204 No Content response.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnNoContent()
        {
            // Arrange
            var id = Guid.NewGuid();
            _roleServiceMock.Setup(s => s.DeleteRoleAsync(id)).Returns(Task.CompletedTask);

            // Act
            var result = await _rolesController.DeleteRole(id);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that attempting to delete a non-existent role returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _roleServiceMock.Setup(s => s.DeleteRoleAsync(id))
                .ThrowsAsync(new KeyNotFoundException());

            // Act
            var result = await _rolesController.DeleteRole(id);

            // Assert
            result.Should().BeOfType<NotFoundObjectResult>();
        }
    }
}
