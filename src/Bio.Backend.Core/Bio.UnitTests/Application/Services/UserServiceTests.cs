using Bio.Application.DTOs;
using Bio.Application.Services;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
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
    private readonly Mock<IValidator<UserCreateDTO>> _createValidatorMock;
    private readonly Mock<IValidator<UserUpdateDTO>> _updateValidatorMock;
    private readonly UserService _userService;

    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _createValidatorMock = new Mock<IValidator<UserCreateDTO>>();
        _updateValidatorMock = new Mock<IValidator<UserUpdateDTO>>();

        _userService = new UserService(
            _userRepositoryMock.Object,
            _passwordHasherMock.Object,
            _createValidatorMock.Object,
            _updateValidatorMock.Object);
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

        _createValidatorMock.Setup(v => v.ValidateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());
        
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

        _createValidatorMock.Setup(v => v.ValidateAsync(dto, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ValidationResult());

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
}
