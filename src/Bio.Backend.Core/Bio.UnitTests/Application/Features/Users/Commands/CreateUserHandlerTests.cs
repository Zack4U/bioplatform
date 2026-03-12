using Bio.Application.DTOs;
using Bio.Application.Features.Users.Commands.CreateUser;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;
using AutoMapper;

namespace Bio.UnitTests.Application.Features.Users.Commands;

/// <summary>
/// Unit tests for the CreateUserCommandHandler class.
/// </summary>
public class CreateUserCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<IPasswordHasher> _passwordHasherMock;
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly CreateUserCommandHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="CreateUserCommandHandlerTests"/> class.
    /// </summary>
    public CreateUserCommandHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _passwordHasherMock = new Mock<IPasswordHasher>();
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();

        _handler = new CreateUserCommandHandler(
            _userRepositoryMock.Object,
            _passwordHasherMock.Object,
            _roleRepositoryMock.Object,
            _userRoleRepositoryMock.Object,
            _unitOfWorkMock.Object,
            _mapperMock.Object);

        // Default: password hasher returns a valid hash/salt pair
        _passwordHasherMock
            .Setup(p => p.HashPassword(It.IsAny<string>()))
            .Returns(("hash", "salt"));
    }

    /// <summary>
    /// Tests for the Handle method of CreateUserCommandHandler.
    /// </summary>
    public class Handle : CreateUserCommandHandlerTests
    {
        /// <summary>
        /// Verifies that a user is successfully created when email and phone are unique.
        /// </summary>
        [Fact]
        public async Task Should_CreateUser_When_EmailAndPhoneAreUnique()
        {
            // Arrange
            var dto = new UserCreateDTO(
                "John Doe",
                "john@example.com",
                "+1234567890",
                "SecurePass123!"
            );
            var command = new CreateUserCommand(dto);

            _userRepositoryMock.Setup(r => r.GetByEmailAsync(dto.Email)).ReturnsAsync((User?)null);
            _userRepositoryMock.Setup(r => r.GetByPhoneNumberAsync(dto.PhoneNumber)).ReturnsAsync((User?)null);
            _mapperMock.Setup(m => m.Map<UserResponseDTO>(It.IsAny<User>()))
                .Returns(new UserResponseDTO(Guid.NewGuid(), dto.FullName, dto.Email, dto.PhoneNumber, DateTime.UtcNow, DateTime.UtcNow));

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result.FullName.Should().Be(dto.FullName);
            result.Email.Should().Be(dto.Email);

            _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Once);
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Once);
        }

        /// <summary>
        /// Verifies that a ConflictException is thrown when a user with the same email already exists.
        /// </summary>
        [Fact]
        public async Task Should_ThrowConflictException_When_EmailAlreadyExists()
        {
            // Arrange
            var dto = new UserCreateDTO(
                "John Doe",
                "existing@example.com",
                "+1234567890",
                "SecurePass123!"
            );
            var command = new CreateUserCommand(dto);
            var existingUser = new User(Guid.NewGuid(), "Other", dto.Email, "h", "s");

            _userRepositoryMock.Setup(r => r.GetByEmailAsync(dto.Email)).ReturnsAsync(existingUser);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<Bio.Domain.Exceptions.ConflictException>()
                .WithMessage($"*{dto.Email}*");

            _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Never);
        }

        /// <summary>
        /// Verifies that a ConflictException is thrown when a user with the same phone number already exists.
        /// </summary>
        [Fact]
        public async Task Should_ThrowConflictException_When_PhoneAlreadyExists()
        {
            // Arrange
            var dto = new UserCreateDTO(
                "John Doe",
                "john@example.com",
                "+1234567890",
                "SecurePass123!"
            );
            var command = new CreateUserCommand(dto);
            var existingUser = new User(Guid.NewGuid(), "Other", "other@example.com", "h", "s", dto.PhoneNumber);

            _userRepositoryMock.Setup(r => r.GetByEmailAsync(dto.Email)).ReturnsAsync((User?)null);
            _userRepositoryMock.Setup(r => r.GetByPhoneNumberAsync(dto.PhoneNumber)).ReturnsAsync(existingUser);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<Bio.Domain.Exceptions.ConflictException>()
                .WithMessage($"*{dto.PhoneNumber}*");

            _userRepositoryMock.Verify(r => r.AddAsync(It.IsAny<User>()), Times.Never);
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Never);
        }
    }
}
