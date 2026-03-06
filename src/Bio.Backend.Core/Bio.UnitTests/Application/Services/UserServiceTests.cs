using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Application.Services;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Services;

/// <summary>
/// Unit tests for the <see cref="UserService"/> class.
/// Tests the business logic for user creation, retrieval, updating, and deletion.
/// </summary>
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();

        _userService = new UserService(
            _userRepositoryMock.Object,
            _passwordHasherMock.Object);
    }

    [Fact]
    public async Task CreateUserAsync_ValidData_ShouldCreateAndReturnUser()
    {
        // Arrange
        var dto = new UserCreateDTO
        {
            FullName = "Test User",
            Email = "test@example.com",
            Password = "Password123!",
            PhoneNumber = "1234567890"
        };



        _userRepositoryMock.Setup(r => r.GetByEmailAsync(dto.Email))
            .ReturnsAsync((User?)null);

        _userRepositoryMock.Setup(r => r.GetByPhoneNumberAsync(dto.PhoneNumber))
            .ReturnsAsync((User?)null);

        _passwordHasherMock.Setup(p => p.HashPassword(dto.Password))
            .Returns(("hashed", "salt"));

        _userRepositoryMock.Setup(r => r.AddAsync(It.IsAny<User>()))
            .Returns(Task.CompletedTask);

        _userRepositoryMock.Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _userService.CreateUserAsync(dto);

        // Assert
        result.Should().NotBeNull();
        result.FullName.Should().Be(dto.FullName);
        result.Email.Should().Be(dto.Email);
        _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
        _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateUserAsync_ExistingEmail_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var dto = new UserCreateDTO { Email = "existing@example.com", FullName = "Test" };
        var existingUser = new User { Email = "existing@example.com" };



        _userRepositoryMock.Setup(r => r.GetByEmailAsync(dto.Email))
            .ReturnsAsync(existingUser);

        // Act
        Func<Task> act = async () => await _userService.CreateUserAsync(dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"User with email {dto.Email} already exists.");
    }

    [Fact]
    public async Task GetUserByIdAsync_ExistingUser_ShouldReturnUserResponseDTO()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@test.com" };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        // Act
        var result = await _userService.GetUserByIdAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);
        result.FullName.Should().Be("Test User");
    }

    [Fact]
    public async Task DeleteUserAsync_ExistingUser_ShouldDeleteAndReturnTrue()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId))
            .ReturnsAsync(user);

        _userRepositoryMock.Setup(r => r.DeleteAsync(user))
            .Returns(Task.CompletedTask);

        _userRepositoryMock.Setup(r => r.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _userService.DeleteUserAsync(userId);

        // Assert
        result.Should().BeTrue();
        _userRepositoryMock.Verify(r => r.DeleteAsync(user), Times.Once);
        _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateUserAsync_ExistingPhoneNumber_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var dto = new UserCreateDTO { Email = "new@example.com", PhoneNumber = "123456", FullName = "Test" };
        var existingUser = new User { PhoneNumber = "123456" };

        _userRepositoryMock.Setup(r => r.GetByEmailAsync(dto.Email)).ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.GetByPhoneNumberAsync(dto.PhoneNumber)).ReturnsAsync(existingUser);

        // Act
        Func<Task> act = async () => await _userService.CreateUserAsync(dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"User with phone number {dto.PhoneNumber} already exists.");
    }

    [Fact]
    public async Task GetAllUsersAsync_ShouldReturnAllUsers()
    {
        // Arrange
        var users = new List<User> { new User { FullName = "U1" }, new User { FullName = "U2" } };
        _userRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);

        // Act
        var result = await _userService.GetAllUsersAsync();

        // Assert
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetUserByIdAsync_NotExisting_ShouldReturnNull()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.GetUserByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserByEmailAsync_Existing_ShouldReturnUser()
    {
        // Arrange
        var email = "test@test.com";
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(email)).ReturnsAsync(new User { Email = email });

        // Act
        var result = await _userService.GetUserByEmailAsync(email);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be(email);
    }

    [Fact]
    public async Task GetUserByEmailAsync_NotExisting_ShouldReturnNull()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.GetByEmailAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.GetUserByEmailAsync("not@found.com");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserByPhoneNumberAsync_Existing_ShouldReturnUser()
    {
        // Arrange
        var phone = "12345";
        _userRepositoryMock.Setup(r => r.GetByPhoneNumberAsync(phone)).ReturnsAsync(new User { PhoneNumber = phone });

        // Act
        var result = await _userService.GetUserByPhoneNumberAsync(phone);

        // Assert
        result.Should().NotBeNull();
        result!.PhoneNumber.Should().Be(phone);
    }

    [Fact]
    public async Task GetUserByPhoneNumberAsync_NotExisting_ShouldReturnNull()
    {
        // Arrange
        _userRepositoryMock.Setup(r => r.GetByPhoneNumberAsync(It.IsAny<string>())).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.GetUserByPhoneNumberAsync("000");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateUserAsync_ValidData_ShouldUpdateAndReturnUser()
    {
        // Arrange
        var id = Guid.NewGuid();
        var dto = new UserUpdateDTO { FullName = "New Name", Email = "new@test.com", PhoneNumber = "999" };
        var user = new User { Id = id, FullName = "Old", Email = "old@test.com" };

        _userRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(user);
        _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(dto.Email, id)).ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.GetByPhoneNumberExcludingIdAsync(dto.PhoneNumber, id)).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.UpdateUserAsync(id, dto);

        // Assert
        result.Should().NotBeNull();
        result!.FullName.Should().Be(dto.FullName);
        user.FullName.Should().Be(dto.FullName);
        _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateUserAsync_UserNotFound_ShouldReturnNull()
    {
        // Arrange
        var id = Guid.NewGuid();
        var dto = new UserUpdateDTO { FullName = "New" };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.UpdateUserAsync(id, dto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateUserAsync_EmailConflict_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var dto = new UserUpdateDTO { Email = "conflict@test.com" };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(new User { Id = id });
        _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(dto.Email, id)).ReturnsAsync(new User { Id = Guid.NewGuid() });

        // Act
        Func<Task> act = async () => await _userService.UpdateUserAsync(id, dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"User with email {dto.Email} already exists.");
    }

    [Fact]
    public async Task UpdateUserAsync_PhoneConflict_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var id = Guid.NewGuid();
        var dto = new UserUpdateDTO { PhoneNumber = "999" };
        _userRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(new User { Id = id });
        _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(It.IsAny<string>(), id)).ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.GetByPhoneNumberExcludingIdAsync(dto.PhoneNumber, id)).ReturnsAsync(new User { Id = Guid.NewGuid() });

        // Act
        Func<Task> act = async () => await _userService.UpdateUserAsync(id, dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"User with phone number {dto.PhoneNumber} already exists.");
    }

    [Fact]
    public async Task DeleteUserAsync_UserNotFound_ShouldReturnFalse()
    {
        // Arrange
        var id = Guid.NewGuid();
        _userRepositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.DeleteUserAsync(id);

        // Assert
        result.Should().BeFalse();
    }
}
