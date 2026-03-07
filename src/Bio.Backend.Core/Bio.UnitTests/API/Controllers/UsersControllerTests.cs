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

namespace Bio.UnitTests.API.Controllers;

/// <summary>
/// Unit tests for the <see cref="UsersController"/> class, organized by endpoint.
/// These tests verify the API endpoints respond correctly using a mocked <see cref="IMediator"/>.
/// </summary>
public class UsersControllerTests
{
    private readonly Mock<IMediator> _mediatorMock;
    private readonly UsersController _usersController;

    public UsersControllerTests()
    {
        _mediatorMock = new Mock<IMediator>();
        _usersController = new UsersController(_mediatorMock.Object);
    }

    public class CreateUser : UsersControllerTests
    {
        [Fact]
        public async Task ValidData_ShouldReturnCreated()
        {
            // Arrange
            var dto = new UserCreateDTO { FullName = "Test", Email = "test@test.com", Password = "Pass123!", PhoneNumber = "123" };
            var responseDto = new UserResponseDTO { Id = Guid.NewGuid(), FullName = "Test", Email = "test@test.com", PhoneNumber = "123" };

            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateUserCommand>(), default))
                .ReturnsAsync(responseDto);

            // Act
            var result = await _usersController.CreateUser(dto);

            // Assert
            var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
            createdResult.ActionName.Should().Be(nameof(UsersController.GetUserById));
            createdResult.Value.Should().Be(responseDto);
        }

        [Fact]
        public async Task DuplicateEmail_ShouldReturnConflict()
        {
            // Arrange
            var dto = new UserCreateDTO { FullName = "Test", Email = "duplicate@test.com", Password = "Pass123!" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<CreateUserCommand>(), default))
                .ThrowsAsync(new ConflictException("User with email already exists."));

            // Act
            var result = await _usersController.CreateUser(dto);

            // Assert
            var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
            conflictResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        }
    }

    public class GetAllUsers : UsersControllerTests
    {
        [Fact]
        public async Task ShouldReturnOkWithUsers()
        {
            // Arrange
            var users = new List<UserResponseDTO>
            {
                new UserResponseDTO { Id = Guid.NewGuid(), FullName = "Test1" },
                new UserResponseDTO { Id = Guid.NewGuid(), FullName = "Test2" }
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
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var user = new UserResponseDTO { Id = id, FullName = "Test1" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByIdQuery>(), default))
                .ReturnsAsync(user);

            // Act
            var result = await _usersController.GetUserById(id);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(user);
        }

        [Fact]
        public async Task NonExistingUser_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByIdQuery>(), default))
                .ReturnsAsync((UserResponseDTO?)null);

            // Act
            var result = await _usersController.GetUserById(id);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class GetUserByEmail : UsersControllerTests
    {
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var email = "test@example.com";
            var user = new UserResponseDTO { Id = Guid.NewGuid(), Email = email };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByEmailQuery>(), default))
                .ReturnsAsync(user);

            // Act
            var result = await _usersController.GetUserByEmail(email);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(user);
        }

        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByEmailQuery>(), default))
                .ReturnsAsync((UserResponseDTO?)null);

            // Act
            var result = await _usersController.GetUserByEmail("missing@example.com");

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class GetUserByPhoneNumber : UsersControllerTests
    {
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var phone = "123456789";
            var user = new UserResponseDTO { Id = Guid.NewGuid(), PhoneNumber = phone };
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByPhoneNumberQuery>(), default))
                .ReturnsAsync(user);

            // Act
            var result = await _usersController.GetUserByPhoneNumber(phone);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(user);
        }

        [Fact]
        public async Task NonExisting_ShouldReturnNotFound()
        {
            // Arrange
            _mediatorMock.Setup(m => m.Send(It.IsAny<GetUserByPhoneNumberQuery>(), default))
                .ReturnsAsync((UserResponseDTO?)null);

            // Act
            var result = await _usersController.GetUserByPhoneNumber("0000");

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }
    }

    public class UpdateUser : UsersControllerTests
    {
        [Fact]
        public async Task ExistingUser_ShouldReturnOk()
        {
            // Arrange
            var id = Guid.NewGuid();
            var updateDto = new UserUpdateDTO { FullName = "Updated", Email = "updated@example.com", PhoneNumber = "999" };
            var responseDto = new UserResponseDTO { Id = id, FullName = updateDto.FullName, Email = updateDto.Email, PhoneNumber = updateDto.PhoneNumber };

            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateUserCommand>(), default))
                .ReturnsAsync(responseDto);

            // Act
            var result = await _usersController.UpdateUser(id, updateDto);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            okResult.Value.Should().BeEquivalentTo(responseDto);
        }

        [Fact]
        public async Task NonExistingUser_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var updateDto = new UserUpdateDTO { FullName = "Updated" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateUserCommand>(), default))
                .ReturnsAsync((UserResponseDTO?)null);

            // Act
            var result = await _usersController.UpdateUser(id, updateDto);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }

        [Fact]
        public async Task DuplicateEmail_ShouldReturnConflict()
        {
            // Arrange
            var id = Guid.NewGuid();
            var updateDto = new UserUpdateDTO { FullName = "Updated", Email = "duplicate@example.com" };
            _mediatorMock.Setup(m => m.Send(It.IsAny<UpdateUserCommand>(), default))
                .ThrowsAsync(new ConflictException("Email already exists."));

            // Act
            var result = await _usersController.UpdateUser(id, updateDto);

            // Assert
            var conflictResult = result.Should().BeOfType<ConflictObjectResult>().Subject;
            conflictResult.StatusCode.Should().Be(StatusCodes.Status409Conflict);
        }
    }

    public class DeleteUser : UsersControllerTests
    {
        [Fact]
        public async Task ExistingUser_ShouldReturnNoContent()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<DeleteUserCommand>(), default))
                .ReturnsAsync(true);

            // Act
            var result = await _usersController.DeleteUser(id);

            // Assert
            result.Should().BeOfType<NoContentResult>();
        }

        [Fact]
        public async Task NonExistingUser_ShouldReturnNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _mediatorMock.Setup(m => m.Send(It.IsAny<DeleteUserCommand>(), default))
                .ReturnsAsync(false);

            // Act
            var result = await _usersController.DeleteUser(id);

            // Assert
            result.Should().BeOfType<NotFoundResult>();
        }
    }
}
