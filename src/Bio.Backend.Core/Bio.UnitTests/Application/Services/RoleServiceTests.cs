using Bio.Application.DTOs;
using Bio.Application.Services;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Services;

/// <summary>
/// Unit tests for the <see cref="RoleService"/> class.
/// Tests the business logic for role creation, retrieval, updating, and deletion.
/// </summary>
public class RoleServiceTests
{
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly RoleService _roleService;

    public RoleServiceTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _roleService = new RoleService(_roleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the CreateRoleAsync method.
    /// </summary>
    public class CreateRole : RoleServiceTests
    {
        /// <summary>
        /// Verifies that a role is successfully created when valid data is provided.
        /// </summary>
        [Fact]
        public async Task ValidData_ShouldCreateAndReturnRole()
        {
            // Arrange
            var dto = new RoleCreateDTO { Name = "admin", Description = "Admin Role" };
            _roleRepositoryMock.Setup(r => r.GetByNameAsync("ADMIN")).ReturnsAsync((Role?)null);
            _roleRepositoryMock.Setup(r => r.AddAsync(It.IsAny<Role>())).Returns(Task.CompletedTask);
            _roleRepositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            // Act
            var result = await _roleService.CreateRoleAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be("ADMIN");
            _roleRepositoryMock.Verify(r => r.AddAsync(It.IsAny<Role>()), Times.Once);
            _roleRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that attempting to create a role with an existing name throws an InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task ExistingName_ShouldThrowInvalidOperationException()
        {
            // Arrange
            var dto = new RoleCreateDTO { Name = "ADMIN" };
            _roleRepositoryMock.Setup(r => r.GetByNameAsync("ADMIN")).ReturnsAsync(new Role { Name = "ADMIN" });

            // Act
            Func<Task> act = async () => await _roleService.CreateRoleAsync(dto);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Role with name 'ADMIN' already exists.");
        }
    }

    /// <summary>
    /// Tests for the UpdateRoleAsync method.
    /// </summary>
    public class UpdateRole : RoleServiceTests
    {
        /// <summary>
        /// Verifies that a role is successfully updated when valid data is provided.
        /// </summary>
        [Fact]
        public async Task ValidData_ShouldUpdateAndReturnRole()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "editor", Description = "Updated Desc" };
            var role = new Role { Id = id, Name = "ADMIN" };

            _roleRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(role);
            _roleRepositoryMock.Setup(r => r.GetByNameExcludingIdAsync("EDITOR", id)).ReturnsAsync((Role?)null);
            _roleRepositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            // Act
            var result = await _roleService.UpdateRoleAsync(id, dto);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be("EDITOR");
            role.Name.Should().Be("EDITOR");
            _roleRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that attempting to update a non-existent role throws a KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task RoleNotFound_ShouldThrowKeyNotFoundException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "NEW" };
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Role?)null);

            // Act
            Func<Task> act = async () => await _roleService.UpdateRoleAsync(id, dto);

            // Assert
            await act.Should().ThrowAsync<KeyNotFoundException>();
        }

        /// <summary>
        /// Verifies that updating a role with a name already used by another role throws an InvalidOperationException.
        /// </summary>
        [Fact]
        public async Task NameConflict_ShouldThrowInvalidOperationException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new RoleUpdateDTO { Name = "EXISTING" };
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(new Role { Id = id });
            _roleRepositoryMock.Setup(r => r.GetByNameExcludingIdAsync("EXISTING", id)).ReturnsAsync(new Role { Id = Guid.NewGuid() });

            // Act
            Func<Task> act = async () => await _roleService.UpdateRoleAsync(id, dto);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Another role with name 'EXISTING' already exists.");
        }
    }

    /// <summary>
    /// Tests for the DeleteRoleAsync method.
    /// </summary>
    public class DeleteRole : RoleServiceTests
    {
        /// <summary>
        /// Verifies that an existing role is successfully deleted.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldDelete()
        {
            // Arrange
            var id = Guid.NewGuid();
            var role = new Role { Id = id };
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(role);
            _roleRepositoryMock.Setup(r => r.DeleteAsync(role)).Returns(Task.CompletedTask);
            _roleRepositoryMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

            // Act
            await _roleService.DeleteRoleAsync(id);

            // Assert
            _roleRepositoryMock.Verify(r => r.DeleteAsync(role), Times.Once);
            _roleRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that attempting to delete a non-existent role throws a KeyNotFoundException.
        /// </summary>
        [Fact]
        public async Task NotFound_ShouldThrowKeyNotFoundException()
        {
            // Arrange
            var id = Guid.NewGuid();
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Role?)null);

            // Act
            Func<Task> act = async () => await _roleService.DeleteRoleAsync(id);

            // Assert
            await act.Should().ThrowAsync<KeyNotFoundException>();
        }
    }

    /// <summary>
    /// Tests for the GetAllRolesAsync method.
    /// </summary>
    public class GetAllRoles : RoleServiceTests
    {
        /// <summary>
        /// Verifies that all roles are successfully retrieved.
        /// </summary>
        [Fact]
        public async Task ShouldReturnAllRoles()
        {
            // Arrange
            var roles = new List<Role> { new Role { Name = "R1" }, new Role { Name = "R2" } };
            _roleRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(roles);

            // Act
            var result = await _roleService.GetAllRolesAsync();

            // Assert
            result.Should().HaveCount(2);
        }
    }

    /// <summary>
    /// Tests for the GetRoleByIdAsync method.
    /// </summary>
    public class GetRoleById : RoleServiceTests
    {
        /// <summary>
        /// Verifies that a role is successfully retrieved by its unique identifier.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnRole()
        {
            // Arrange
            var id = Guid.NewGuid();
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(new Role { Id = id, Name = "ADMIN" });

            // Act
            var result = await _roleService.GetRoleByIdAsync(id);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(id);
        }

        /// <summary>
        /// Verifies that searching for a non-existent role ID returns null.
        /// </summary>
        [Fact]
        public async Task NotExisting_ShouldReturnNull()
        {
            // Arrange
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Role?)null);

            // Act
            var result = await _roleService.GetRoleByIdAsync(Guid.NewGuid());

            // Assert
            result.Should().BeNull();
        }
    }

    /// <summary>
    /// Tests for the GetRoleByNameAsync method.
    /// </summary>
    public class GetRoleByName : RoleServiceTests
    {
        /// <summary>
        /// Verifies that a role is successfully retrieved by its unique name.
        /// </summary>
        [Fact]
        public async Task ExistingRole_ShouldReturnRole()
        {
            // Arrange
            var name = "ADMIN";
            _roleRepositoryMock.Setup(r => r.GetByNameAsync(name)).ReturnsAsync(new Role { Name = name });

            // Act
            var result = await _roleService.GetRoleByNameAsync(name);

            // Assert
            result.Should().NotBeNull();
            result!.Name.Should().Be(name);
        }

        /// <summary>
        /// Verifies that searching for a non-existent role name returns null.
        /// </summary>
        [Fact]
        public async Task NotExisting_ShouldReturnNull()
        {
            // Arrange
            _roleRepositoryMock.Setup(r => r.GetByNameAsync(It.IsAny<string>())).ReturnsAsync((Role?)null);

            // Act
            var result = await _roleService.GetRoleByNameAsync("GHOST");

            // Assert
            result.Should().BeNull();
        }
    }
}
