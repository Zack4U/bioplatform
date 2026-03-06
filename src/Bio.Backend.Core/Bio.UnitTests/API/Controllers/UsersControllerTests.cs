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
/// Unit tests for the <see cref="UsersController"/> class, organized by endpoint.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IUserService"/>.
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

    public class CreateUser : UsersControllerTests
    {
        /// <summary>
        /// Verifies that providing valid user data to the CreateUser endpoint
        /// returns a 201 Created response containing the newly created user's details.
        /// </summary>
        [Fact]
        public async Task ValidData_ShouldReturnCreated()
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

        /// <summary>
        /// Verifies that if the underlying service rejects the creation
        /// (e.g., throwing InvalidOperationException for duplicate email),
        /// the controller gracefully intercepts it and returns a 400 Bad Request.
        /// </summary>
        [Fact]
        public async Task InvalidData_ShouldThrowInvalidOperationException()
        {
            // Arrange
            var dto = new UserCreateDTO { FullName = "Test", Email = "duplicate@test.com", Password = "Pass123!", PhoneNumber = "123" };
            var errorMessage = $"User with email {dto.Email} already exists.";

            // Simulate the service throwing an error due to business rule validation failure
            _userServiceMock.Setup(s => s.CreateUserAsync(dto))
                .ThrowsAsync(new InvalidOperationException(errorMessage));

            // Act
            // Note: Since ASP.NET global error handling middleware is not active in unit tests,
            // the exception bubbles up directly. The test verifies that the exception is thrown
            // with the correct message.
            Func<Task> act = async () => await _usersController.CreateUser(dto);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage(errorMessage);
        }
    }

    public class GetAllUsers : UsersControllerTests
    {
        /// <summary>
        /// Verifies that calling the GetAllUsers endpoint successfully triggers the service
        /// and returns a 200 OK response with a list of all existing users.
        /// </summary>
        [Fact]
        public async Task ShouldReturnOkWithUsers()
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
    }

    public class GetUserById : UsersControllerTests
    {
        /// <summary>
        /// Verifies that requesting a user by an existing ID returns a 200 OK response
        /// populated with the correct user data.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
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

        /// <summary>
        /// Verifies that requesting a user by an ID that does not exist in the system
        /// correctly returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _userServiceMock.Setup(s => s.GetUserByIdAsync(id)).ReturnsAsync((UserResponseDTO?)null);

            // Act
            var result = await _usersController.GetUserById(id);

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class GetUserByEmail : UsersControllerTests
    {
        /// <summary>
        /// Verifies that searching for a user by an existing registered email
        /// returns a 200 OK response with the matching user's data.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
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

        /// <summary>
        /// Verifies that searching for an email that is not registered in the system
        /// results in a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            _userServiceMock.Setup(s => s.GetUserByEmailAsync(It.IsAny<string>())).ReturnsAsync((UserResponseDTO?)null);

            // Act
            var result = await _usersController.GetUserByEmail("missing@example.com");

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class GetUserByPhoneNumber : UsersControllerTests
    {
        /// <summary>
        /// Verifies that searching for a user by an existing phone number
        /// returns a 200 OK response with the matching user's data.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
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

        /// <summary>
        /// Verifies that searching for a phone number that is not registered
        /// results in a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            _userServiceMock.Setup(s => s.GetUserByPhoneNumberAsync(It.IsAny<string>())).ReturnsAsync((UserResponseDTO?)null);

            // Act
            var result = await _usersController.GetUserByPhoneNumber("0000");

            // Assert
            result.Result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class UpdateUser : UsersControllerTests
    {
        /// <summary>
        /// Verifies that sending valid update data for an existing user
        /// correctly updates the profile and returns a 200 OK with the updated data.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
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

        /// <summary>
        /// Verifies that attempting to update a user that does not exist
        /// correctly fails and returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldReturnNotFound()
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

        /// <summary>
        /// Verifies that if the underlying service rejects the update
        /// (e.g., throwing InvalidOperationException for a duplicate email),
        /// it bubbles up properly to be converted to a 400 Bad Request by the middleware.
        /// </summary>
        [Fact]
        public async Task InvalidData_ShouldThrowInvalidOperationException()
        {
            // Arrange
            var id = Guid.NewGuid();
            var updateDto = new UserUpdateDTO { FullName = "Updated", Email = "duplicate@example.com", PhoneNumber = "999" };
            var errorMessage = $"Another user with email {updateDto.Email} already exists.";

            // Simulate the service rejecting the update due to business validations
            _userServiceMock.Setup(s => s.UpdateUserAsync(id, updateDto))
                .ThrowsAsync(new InvalidOperationException(errorMessage));

            // Act
            Func<Task> act = async () => await _usersController.UpdateUser(id, updateDto);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage(errorMessage);
        }
    }

    public class DeleteUser : UsersControllerTests
    {
        /// <summary>
        /// Verifies that requesting the deletion of an existing user works successfully
        /// and returns a 204 No Content response (indicating successful deletion with no body).
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnNoContent()
        {
            // Arrange
            var id = Guid.NewGuid();
            _userServiceMock.Setup(s => s.DeleteUserAsync(id)).ReturnsAsync(true);

            // Act
            var result = await _usersController.DeleteUser(id);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that attempting to delete a user ID that does not exist
        /// correctly returns a 404 Not Found response.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldReturnNotFound()
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
}
