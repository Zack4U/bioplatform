using Bio.API.Controllers;
using Bio.Application.DTOs;
using Bio.Application.Services;
using Bio.Application.Interfaces;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="UsersController"/> class.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IUserService"/>.
/// Note: Swagger is not used in the test project, but XML comments are maintained for project consistency.
/// </summary>
public class UsersControllerTests
{
    private readonly Mock<IUserService> _userServiceMock;
    private readonly UsersController _usersController;

    public UsersControllerTests()
    {
        _userServiceMock = new Mock<IUserService>();
        _usersController = new UsersController(_userServiceMock.Object);
    }

    [Fact]
    public async Task CreateUser_ValidData_ShouldReturnCreated()
    {
        // Arrange
        var dto = new UserCreateDTO { FullName = "Test", Email = "test@test.com", Password = "Pass123!", PhoneNumber = "123" };
        var responseDto = new UserResponseDTO { Id = Guid.NewGuid(), FullName = "Test", Email = "test@test.com", PhoneNumber = "123" };

        _userServiceMock.Setup(s => s.CreateUserAsync(dto)).ReturnsAsync(responseDto);

        // Act
        var result = await _usersController.CreateUser(dto);

        // Assert
        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(UsersController.GetUserById));
        createdResult.RouteValues!["id"].Should().Be(responseDto.Id);
        createdResult.Value.Should().Be(responseDto);
    }

    [Fact]
    public async Task GetAllUsers_ShouldReturnOkWithUsers()
    {
        // Arrange
        var users = new List<UserResponseDTO>
        {
            new UserResponseDTO { Id = Guid.NewGuid(), FullName = "Test1" },
            new UserResponseDTO { Id = Guid.NewGuid(), FullName = "Test2" }
        };
        _userServiceMock.Setup(s => s.GetAllUsersAsync()).ReturnsAsync(users);

        // Act
        var result = await _usersController.GetAllUsers();

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(users);
    }

    [Fact]
    public async Task GetUserById_ExistingUser_ShouldReturnOk()
    {
        // Arrange
        var id = Guid.NewGuid();
        var user = new UserResponseDTO { Id = id, FullName = "Test1" };
        _userServiceMock.Setup(s => s.GetUserByIdAsync(id)).ReturnsAsync(user);

        // Act
        var result = await _usersController.GetUserById(id);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(user);
    }

    [Fact]
    public async Task GetUserById_NonExistingUser_ShouldReturnNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _userServiceMock.Setup(s => s.GetUserByIdAsync(id)).ReturnsAsync((UserResponseDTO?)null);

        // Act
        var result = await _usersController.GetUserById(id);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetUserByEmail_ExistingUser_ShouldReturnOk()
    {
        // Arrange
        var email = "test@example.com";
        var user = new UserResponseDTO { Id = Guid.NewGuid(), Email = email };
        _userServiceMock.Setup(s => s.GetUserByEmailAsync(email)).ReturnsAsync(user);

        // Act
        var result = await _usersController.GetUserByEmail(email);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(user);
    }

    [Fact]
    public async Task GetUserByEmail_NonExisting_ShouldReturnNotFound()
    {
        // Arrange
        _userServiceMock.Setup(s => s.GetUserByEmailAsync(It.IsAny<string>())).ReturnsAsync((UserResponseDTO?)null);

        // Act
        var result = await _usersController.GetUserByEmail("missing@example.com");

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task GetUserByPhoneNumber_ExistingUser_ShouldReturnOk()
    {
        // Arrange
        var phone = "123456789";
        var user = new UserResponseDTO { Id = Guid.NewGuid(), PhoneNumber = phone };
        _userServiceMock.Setup(s => s.GetUserByPhoneNumberAsync(phone)).ReturnsAsync(user);

        // Act
        var result = await _usersController.GetUserByPhoneNumber(phone);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(user);
    }

    [Fact]
    public async Task GetUserByPhoneNumber_NonExisting_ShouldReturnNotFound()
    {
        // Arrange
        _userServiceMock.Setup(s => s.GetUserByPhoneNumberAsync(It.IsAny<string>())).ReturnsAsync((UserResponseDTO?)null);

        // Act
        var result = await _usersController.GetUserByPhoneNumber("0000");

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task UpdateUser_ExistingUser_ShouldReturnOk()
    {
        // Arrange
        var id = Guid.NewGuid();
        var updateDto = new UserUpdateDTO { FullName = "Updated", Email = "updated@example.com", PhoneNumber = "999" };
        var responseDto = new UserResponseDTO { Id = id, FullName = updateDto.FullName, Email = updateDto.Email, PhoneNumber = updateDto.PhoneNumber };

        _userServiceMock.Setup(s => s.UpdateUserAsync(id, updateDto)).ReturnsAsync(responseDto);

        // Act
        var result = await _usersController.UpdateUser(id, updateDto);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeEquivalentTo(responseDto);
    }

    [Fact]
    public async Task UpdateUser_NonExistingUser_ShouldReturnNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        var updateDto = new UserUpdateDTO { FullName = "Updated" };

        _userServiceMock.Setup(s => s.UpdateUserAsync(id, updateDto)).ReturnsAsync((UserResponseDTO?)null);

        // Act
        var result = await _usersController.UpdateUser(id, updateDto);

        // Assert
        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task DeleteUser_ExistingUser_ShouldReturnNoContent()
    {
        // Arrange
        var id = Guid.NewGuid();
        _userServiceMock.Setup(s => s.DeleteUserAsync(id)).ReturnsAsync(true);

        // Act
        var result = await _usersController.DeleteUser(id);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteUser_NonExistingUser_ShouldReturnNotFound()
    {
        // Arrange
        var id = Guid.NewGuid();
        _userServiceMock.Setup(s => s.DeleteUserAsync(id)).ReturnsAsync(false);

        // Act
        var result = await _usersController.DeleteUser(id);

        // Assert
        result.Should().BeOfType<NotFoundResult>();
    }
}
