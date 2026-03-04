using Bio.Application.DTOs;
using Bio.Application.Services;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Moq;

namespace Bio.UnitTests.Services;

/// <summary>
/// Unit tests for the <see cref="UserService"/> class.
/// Uses Moq for dependency isolation and FluentAssertions for validation.
/// </summary>
public class UserServiceTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IValidator<UserCreateDTO>> _validatorMock;
    private readonly Mock<IValidator<UserUpdateDTO>> _updateValidatorMock;
    private readonly UserService _userService;

    /// <summary>
    /// Initializes the test class, mocking all required dependencies.
    /// </summary>
    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _validatorMock = new Mock<IValidator<UserCreateDTO>>();
        _updateValidatorMock = new Mock<IValidator<UserUpdateDTO>>();
        _userService = new UserService(_userRepositoryMock.Object, _passwordHasherMock.Object, _validatorMock.Object, _updateValidatorMock.Object);
    }

    /// <summary>
    /// Helper method to simulate validation results from FluentValidation.
    /// </summary>
    /// <param name="isValid">Whether the validation should succeed.</param>
    /// <param name="propertyName">Target property for failure (optional).</param>
    /// <param name="errorMessage">Error message for failure (optional).</param>
    private void SetupValidatorResult(bool isValid, string? propertyName = null, string? errorMessage = null)
    {
        var result = new ValidationResult(isValid 
            ? new List<ValidationFailure>() 
            : new List<ValidationFailure> { new ValidationFailure(propertyName ?? "Property", errorMessage ?? "Error") });

        _validatorMock
            .Setup(v => v.ValidateAsync(It.IsAny<UserCreateDTO>(), default))
            .ReturnsAsync(result);
    }

    /// <summary>
    /// Verifies that a valid user creation request results in a successful creation
    /// and correctly persistence in the repository.
    /// </summary>
    [Fact]
    public async Task CreateUserAsync_WithValidData_ShouldCreateUserAndReturnResponse()
    {
        // Arrange
        var userCreateDTO = new UserCreateDTO
        {
            FullName = "John Doe",
            Email = "john.doe@example.com",
            Password = "SecurePassword123",
            PhoneNumber = "1234567890"
        };

        SetupValidatorResult(true);

        var expectedHash = "hashedPassword";
        var expectedSalt = "randomSalt";

        _passwordHasherMock
            .Setup(ph => ph.HashPassword(userCreateDTO.Password))
            .Returns((expectedHash, expectedSalt));

        // Act
        var result = await _userService.CreateUserAsync(userCreateDTO);

        // Assert
        result.Should().NotBeNull();
        result.FullName.Should().Be(userCreateDTO.FullName);
        result.Email.Should().Be(userCreateDTO.Email);

        _userRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<User>()), Times.Once);
        _userRepositoryMock.Verify(repo => repo.SaveChangesAsync(), Times.Once);
    }

    /// <summary>
    /// Verifies that attempting to create a user with an already registered email
    /// throws an <see cref="InvalidOperationException"/>.
    /// </summary>
    [Fact]
    public async Task CreateUserAsync_WithDuplicateEmail_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userCreateDTO = new UserCreateDTO
        {
            FullName = "Existing User",
            Email = "duplicate@example.com",
            Password = "SomePassword123"
        };

        SetupValidatorResult(true);

        _userRepositoryMock
            .Setup(repo => repo.GetByEmailAsync(userCreateDTO.Email))
            .ReturnsAsync(new User { Email = userCreateDTO.Email });

        // Act
        Func<Task<UserResponseDTO>> act = () => _userService.CreateUserAsync(userCreateDTO);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    /// <summary>
    /// Verifies that attempting to create a user with an already registered phone number
    /// throws an <see cref="InvalidOperationException"/>.
    /// </summary>
    [Fact]
    public async Task CreateUserAsync_WithDuplicatePhoneNumber_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userCreateDTO = new UserCreateDTO
        {
            FullName = "Existing Phone",
            Email = "new@example.com",
            Password = "SomePassword123",
            PhoneNumber = "1234567890"
        };

        SetupValidatorResult(true);

        _userRepositoryMock
            .Setup(repo => repo.GetByEmailAsync(userCreateDTO.Email))
            .ReturnsAsync((User?)null);

        _userRepositoryMock
            .Setup(repo => repo.GetByPhoneNumberAsync(userCreateDTO.PhoneNumber))
            .ReturnsAsync(new User { PhoneNumber = userCreateDTO.PhoneNumber });

        // Act
        Func<Task<UserResponseDTO>> act = () => _userService.CreateUserAsync(userCreateDTO);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage($"User with phone number {userCreateDTO.PhoneNumber} already exists.");
    }

    /// <summary>
    /// Verifies that various invalid inputs (empty fields, bad formats)
    /// correctly trigger a <see cref="ValidationException"/>.
    /// </summary>
    [Theory]
    [InlineData("", "john@example.com", "Password123", "123456", "Full name is required.")]
    [InlineData("John Doe", "invalid-email", "Password123", "123456", "Email format is invalid.")]
    [InlineData("John Doe", "john@example.com", "short", "123456", "Password must be at least 8 characters long.")]
    [InlineData("John Doe", "john@example.com", "Password123", "", "Phone number is required.")]
    public async Task CreateUserAsync_WithInvalidData_ShouldThrowValidationException(
        string fullName, string email, string password, string phoneNumber, string expectedError)
    {
        // Arrange
        var userCreateDTO = new UserCreateDTO
        {
            FullName = fullName,
            Email = email,
            Password = password,
            PhoneNumber = phoneNumber
        };

        SetupValidatorResult(false, propertyName: "TestProperty", errorMessage: expectedError);

        // Act
        Func<Task<UserResponseDTO>> act = () => _userService.CreateUserAsync(userCreateDTO);

        // Assert
        var exception = await act.Should().ThrowAsync<ValidationException>();
        exception.Which.Errors.Should().Contain(e => e.ErrorMessage == expectedError);

        // Verify that business logic was NOT executed
        _userRepositoryMock.Verify(repo => repo.GetByEmailAsync(It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task GetAllUsersAsync_ShouldReturnAllUsers()
    {
        // Arrange
        var users = new List<User>
        {
            new User { Id = Guid.NewGuid(), FullName = "User 1", Email = "user1@example.com" },
            new User { Id = Guid.NewGuid(), FullName = "User 2", Email = "user2@example.com" }
        };

        _userRepositoryMock
            .Setup(repo => repo.GetAllAsync())
            .ReturnsAsync(users);

        // Act
        var result = await _userService.GetAllUsersAsync();

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(u => u.Email == "user1@example.com");
        result.Should().Contain(u => u.Email == "user2@example.com");
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserExists_ShouldReturnUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, FullName = "Test User", Email = "test@example.com" };

        _userRepositoryMock
            .Setup(repo => repo.GetByIdAsync(userId))
            .ReturnsAsync(user);

        // Act
        var result = await _userService.GetUserByIdAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(userId);
        result.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task GetUserByIdAsync_WhenUserDoesNotExist_ShouldReturnNull()
    {
        // Arrange
        _userRepositoryMock
            .Setup(repo => repo.GetByIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _userService.GetUserByIdAsync(Guid.NewGuid());

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserByEmailAsync_WhenUserExists_ShouldReturnUser()
    {
        // Arrange
        var email = "test@example.com";
        var user = new User { Id = Guid.NewGuid(), FullName = "Test User", Email = email };

        _userRepositoryMock
            .Setup(repo => repo.GetByEmailAsync(email))
            .ReturnsAsync(user);

        // Act
        var result = await _userService.GetUserByEmailAsync(email);

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be(email);
    }

    [Fact]
    public async Task GetUserByPhoneNumberAsync_WhenUserExists_ShouldReturnUser()
    {
        // Arrange
        var phone = "1234567890";
        var user = new User { Id = Guid.NewGuid(), FullName = "Test User", Email = "test@example.com", PhoneNumber = phone };

        _userRepositoryMock
            .Setup(repo => repo.GetByPhoneNumberAsync(phone))
            .ReturnsAsync(user);

        // Act
        var result = await _userService.GetUserByPhoneNumberAsync(phone);

        // Assert
        result.Should().NotBeNull();
        result!.PhoneNumber.Should().Be(phone);
    }

    [Fact]
    public async Task UpdateUserAsync_WhenUserExists_ShouldUpdateAndReturnUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var existingUser = new User { Id = userId, FullName = "Old Name", Email = "old@example.com", PhoneNumber = "111" };
        var dto = new UserUpdateDTO { FullName = "New Name", Email = "new@example.com", PhoneNumber = "222" };

        _updateValidatorMock
            .Setup(v => v.ValidateAsync(dto, default))
            .ReturnsAsync(new FluentValidation.Results.ValidationResult());
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
        _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(dto.Email, userId)).ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.GetByPhoneNumberExcludingIdAsync(dto.PhoneNumber, userId)).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.UpdateUserAsync(userId, dto);

        // Assert
        result.Should().NotBeNull();
        result!.FullName.Should().Be("New Name");
        result.Email.Should().Be("new@example.com");
        result.PhoneNumber.Should().Be("222");
        _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
    }

    [Fact]
    public async Task UpdateUserAsync_WhenUserDoesNotExist_ShouldReturnNull()
    {
        // Arrange
        var dto = new UserUpdateDTO { FullName = "X", Email = "x@example.com", PhoneNumber = "123" };
        _updateValidatorMock
            .Setup(v => v.ValidateAsync(dto, default))
            .ReturnsAsync(new FluentValidation.Results.ValidationResult());
        _userRepositoryMock.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((User?)null);

        // Act
        var result = await _userService.UpdateUserAsync(Guid.NewGuid(), dto);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateUserAsync_WithDuplicateEmail_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var existingUser = new User { Id = userId, FullName = "A", Email = "a@example.com", PhoneNumber = "1" };
        var dto = new UserUpdateDTO { FullName = "A", Email = "taken@example.com", PhoneNumber = "1" };

        _updateValidatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new FluentValidation.Results.ValidationResult());
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
        _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(dto.Email, userId)).ReturnsAsync(new User { Email = dto.Email });

        // Act
        Func<Task<UserResponseDTO?>> act = () => _userService.UpdateUserAsync(userId, dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }

    [Fact]
    public async Task UpdateUserAsync_WithDuplicatePhone_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var existingUser = new User { Id = userId, FullName = "A", Email = "a@example.com", PhoneNumber = "1" };
        var dto = new UserUpdateDTO { FullName = "A", Email = "a@example.com", PhoneNumber = "taken" };

        _updateValidatorMock.Setup(v => v.ValidateAsync(dto, default)).ReturnsAsync(new FluentValidation.Results.ValidationResult());
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
        _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(dto.Email, userId)).ReturnsAsync((User?)null);
        _userRepositoryMock.Setup(r => r.GetByPhoneNumberExcludingIdAsync(dto.PhoneNumber, userId)).ReturnsAsync(new User { PhoneNumber = dto.PhoneNumber });

        // Act
        Func<Task<UserResponseDTO?>> act = () => _userService.UpdateUserAsync(userId, dto);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
