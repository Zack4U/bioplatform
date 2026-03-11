using Bio.API.Controllers;
using Bio.Application.DTOs;
using Bio.Application.Features.Users.Commands.CreateUser;
using Bio.Application.Features.Users.Commands.DeleteUser;
using Bio.Application.Features.Users.Commands.UpdateUser;
using Bio.Application.Features.Users.Queries.GetAllUsers;
using Bio.Application.Features.Users.Queries.GetUserByEmail;
using Bio.Application.Features.Users.Queries.GetUserById;
using Bio.Application.Features.Users.Queries.GetUserByPhoneNumber;
using Bio.Domain.Exceptions;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Moq;
using Xunit;
using System.Security.Claims;

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="UsersController"/> class, organized by endpoint.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IMediator"/>.
/// </summary>
public class UsersControllerTests
{
    /// <summary>
    /// Initializes a new instance of the <see cref="UsersControllerTests"/> class.
    /// </summary>
    private readonly Mock<IMediator> _mediatorMock;
    private readonly UsersController _usersController;

    /// <summary>
    /// Initializes a new instance of the <see cref="UsersControllerTests"/> class.
    /// </summary>
    public UsersControllerTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _usersController = new UsersController(_mediatorMock.Object);
    }

    private void MockUser(Guid userId, string role = "USER")
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        _usersController.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    public class CreateUser : UsersControllerTests
    {
        /// <summary>
        /// Verifies that a valid user creation request returns a 201 Created response.
        /// </summary>
        [Fact]
        public async Task ValidData_ShouldReturnCreated()
        {
            // Arrange
            var dto = new UserCreateDTO("Test", "test@test.com", "123", "Pass123!");
            var responseDto = new UserResponseDTO(Guid.NewGuid(), "Test", "test@test.com", "123", DateTime.UtcNow);

            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateUserCommand>(), default))
                .ReturnsAsync(responseDto);

            // Act
            var result = await _usersController.CreateUser(dto);

            // Assert
            var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
            createdResult.ActionName.Should().Be(nameof(UsersController.GetUserById));
            createdResult.Value.Should().Be(responseDto);
        }

        /// <summary>
        /// Verifies that a duplicate email user creation request throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task DuplicateEmail_ShouldThrowConflictException()
        {
            // Arrange
            var dto = new UserCreateDTO("Test", "duplicate@test.com", string.Empty, "Pass123!");
            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateUserCommand>(), default))
                .ThrowsAsync(new ConflictException("User with email already exists."));

            // Act
            var act = async () => await _usersController.CreateUser(dto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }

        /// <summary>
        /// Verifies that a duplicate phone number user creation request throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task DuplicatePhone_ShouldThrowConflictException()
        {
            // Arrange
            var dto = new UserCreateDTO("Test", "test@test.com", "555555", "Pass123!");
            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateUserCommand>(), default))
                .ThrowsAsync(new ConflictException("User with phone number already exists."));

            // Act
            var act = async () => await _usersController.CreateUser(dto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }

        /// <summary>
        /// Verifies that a request with both duplicate email and phone number throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task BothEmailAndPhoneDuplicate_ShouldThrowConflictException()
        {
            // Arrange
            var dto = new UserCreateDTO("Test", "dup@test.com", "555", "Pass123!");
            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateUserCommand>(), default))
                .ThrowsAsync(new ConflictException("User with email or phone already exists."));

            // Act
            var act = async () => await _usersController.CreateUser(dto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }
    }

    public class GetAllUsers : UsersControllerTests
    {
        /// <summary>
        /// Verifies that a valid user get request returns a 200 Ok response.
        /// </summary>
        [Fact]
        public async Task ShouldReturnOkWithUsers()
        {
            // Arrange
            var users = new List<UserResponseDTO>
            {
                new UserResponseDTO(Guid.NewGuid(), "Test1", "1@t.com", "1", DateTime.UtcNow),
                new UserResponseDTO(Guid.NewGuid(), "Test2", "2@t.com", "2", DateTime.UtcNow)
            };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetAllUsersQuery>(), default))
                .ReturnsAsync(users);

            // Act
            var result = await _usersController.GetAllUsers();

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(users);
        }
    }

    public class GetUserById : UsersControllerTests
    {
        /// <summary>
        /// Verifies that a valid user id get request returns a 200 Ok response.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var user = new UserResponseDTO(id, "John Doe", "john@test.com", "123", DateTime.UtcNow);
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByIdQuery>(), default))
                .ReturnsAsync(user);

            // Act
            var result = await _usersController.GetUserById(id);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(user);
        }

        /// <summary>
        /// Verifies that a non-existing user ID request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldThrowNotFoundException()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByIdQuery>(), default))
                .ThrowsAsync(new NotFoundException("User", id));

            // Act
            var act = async () => await _usersController.GetUserById(id);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }

    public class GetUserByEmail : UsersControllerTests
    {
        /// <summary>
        /// Verifies that a valid user email get request returns a 200 Ok response.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var email = "test@example.com";
            var user = new UserResponseDTO(Guid.NewGuid(), "Test", email, "123", DateTime.UtcNow);
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByEmailQuery>(), default))
                .ReturnsAsync(user);

            // Act
            var result = await _usersController.GetUserByEmail(email);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(user);
        }

        /// <summary>
        /// Verifies that a non-existing user email request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldThrowNotFoundException()
        {
            // Arrange
            var email = "missing@example.com";
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByEmailQuery>(), default))
                .ThrowsAsync(new NotFoundException("User", email));

            // Act
            var act = async () => await _usersController.GetUserByEmail(email);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }

    public class GetUserByPhoneNumber : UsersControllerTests
    {
        /// <summary>
        /// Verifies that a valid user phone number get request returns a 200 Ok response.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var phone = "123456789";
            var user = new UserResponseDTO(Guid.NewGuid(), "Test", "t@t.com", phone, DateTime.UtcNow);
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByPhoneNumberQuery>(), default))
                .ReturnsAsync(user);

            // Act
            var result = await _usersController.GetUserByPhoneNumber(phone);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(user);
        }

        /// <summary>
        /// Verifies that a non-existing user phone number request throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExisting_ShouldThrowNotFoundException()
        {
            // Arrange
            var phone = "0000";
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByPhoneNumberQuery>(), default))
                .ThrowsAsync(new NotFoundException("User", phone));

            // Act
            var act = async () => await _usersController.GetUserByPhoneNumber(phone);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }

    public class UpdateUser : UsersControllerTests
    {
        /// <summary>
        /// Verifies that a valid user update request returns a 200 Ok response.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            MockUser(id);
            var updateDto = new UserUpdateDTO("Updated", "updated@example.com", "999");
            var responseDto = new UserResponseDTO(id, updateDto.FullName, updateDto.Email, updateDto.PhoneNumber, DateTime.UtcNow);

            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateUserCommand>(), default))
                .ReturnsAsync(responseDto);

            // Act
            var result = await _usersController.UpdateUser(id, updateDto);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(responseDto);
        }

        /// <summary>
        /// Verifies that updating a non-existing user throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldThrowNotFoundException()
        {
            // Arrange
            var id = Guid.NewGuid();
            MockUser(id);
            var updateDto = new UserUpdateDTO("Updated", "u@u.com", "1");
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateUserCommand>(), default))
                .ThrowsAsync(new NotFoundException("User", id));

            // Act
            var act = async () => await _usersController.UpdateUser(id, updateDto);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }

        /// <summary>
        /// Verifies that a duplicate email user update request throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task DuplicateEmail_ShouldThrowConflictException()
        {
            // Arrange
            var id = Guid.NewGuid();
            MockUser(id);
            var updateDto = new UserUpdateDTO("Updated", "duplicate@example.com", "1");
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateUserCommand>(), default))
                .ThrowsAsync(new ConflictException("Email already exists."));

            // Act
            var act = async () => await _usersController.UpdateUser(id, updateDto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }

        /// <summary>
        /// Verifies that a duplicate phone number user update request throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task DuplicatePhone_ShouldThrowConflictException()
        {
            // Arrange
            var id = Guid.NewGuid();
            MockUser(id);
            var updateDto = new UserUpdateDTO("Updated", "u@test.com", "555");
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateUserCommand>(), default))
                .ThrowsAsync(new ConflictException("Phone number already exists."));

            // Act
            var act = async () => await _usersController.UpdateUser(id, updateDto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }

        /// <summary>
        /// Verifies that an update request with both duplicate email and phone number throws a ConflictException.
        /// </summary>
        [Fact]
        public async Task BothEmailAndPhoneDuplicate_ShouldThrowConflictException()
        {
            // Arrange
            var id = Guid.NewGuid();
            MockUser(id);
            var updateDto = new UserUpdateDTO("Updated", "dup@test.com", "555");
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateUserCommand>(), default))
                .ThrowsAsync(new ConflictException("Email or Phone already exists."));

            // Act
            var act = async () => await _usersController.UpdateUser(id, updateDto);

            // Assert
            await act.Should().ThrowAsync<ConflictException>();
        }
    }

    public class DeleteUser : UsersControllerTests
    {
        /// <summary>
        /// Verifies that a valid user delete request returns a 204 No Content response.
        /// </summary>
        [Fact]
        public async Task ExistingUser_ShouldReturnNoContent()
        {
            // Arrange
            var id = Guid.NewGuid();
            MockUser(id);
            _mediatorMock.Setup(m => m.Send(It.IsAny<DeleteUserCommand>(), default))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _usersController.DeleteUser(id);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        /// <summary>
        /// Verifies that deleting a non-existing user throws a NotFoundException.
        /// </summary>
        [Fact]
        public async Task NonExistingUser_ShouldThrowNotFoundException()
        {
            // Arrange
            var id = Guid.NewGuid();
            MockUser(id, "ADMIN"); // Admin can delete any user, so we test the handler part
            _mediatorMock.Setup(m => m.Send(It.IsAny<DeleteUserCommand>(), default))
                .ThrowsAsync(new NotFoundException("User", id));

            // Act
            var act = async () => await _usersController.DeleteUser(id);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }
}
