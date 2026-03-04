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
    private readonly UserService _userService;

    /// <summary>
    /// Initializes the test class, mocking all required dependencies.
    /// </summary>
    public UserServiceTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _validatorMock = new Mock<IValidator<UserCreateDTO>>();
        _userService = new UserService(_userRepositoryMock.Object, _passwordHasherMock.Object, _validatorMock.Object);
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
    /// Verifies that various invalid inputs (empty fields, bad formats)
    /// correctly trigger a <see cref="ValidationException"/>.
    /// </summary>
    [Theory]
    [InlineData("", "john@example.com", "Password123", "Full name is required.")]
    [InlineData("John Doe", "invalid-email", "Password123", "Email format is invalid.")]
    [InlineData("John Doe", "john@example.com", "short", "Password must be at least 8 characters long.")]
    public async Task CreateUserAsync_WithInvalidData_ShouldThrowValidationException(
        string fullName, string email, string password, string expectedError)
    {
        // Arrange
        var userCreateDTO = new UserCreateDTO
        {
            FullName = fullName,
            Email = email,
            Password = password
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
}
