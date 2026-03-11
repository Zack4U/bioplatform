using Bio.Application.DTOs;
using Bio.Application.Features.Users.Commands.UpdateUser;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Commands;

/// <summary>
/// Unit tests for the UpdateUserHandler class.
/// </summary>
public class UpdateUserHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly UpdateUserHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="UpdateUserHandlerTests"/> class.
    /// </summary>
    public UpdateUserHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new UpdateUserHandler(_userRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of UpdateUserHandler.
    /// </summary>
    public class Handle : UpdateUserHandlerTests
    {
        /// <summary>
        /// Verifies that a user profile is successfully updated when no conflicts exist.
        /// </summary>
        [Fact]
        public async Task Should_UpdateUser_When_UserExistsAndNoConflicts()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var existingUser = new User(userId, "Old Name", "old@example.com", "h", "s", "+111");
            var dto = new UserUpdateDTO("New Name", "new@example.com", "+999");
            var command = new UpdateUserCommand(userId, dto);

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
            _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(dto.Email, userId)).ReturnsAsync((User?)null);
            _userRepositoryMock.Setup(r => r.GetByPhoneNumberExcludingIdAsync(dto.PhoneNumber, userId)).ReturnsAsync((User?)null);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result!.FullName.Should().Be(dto.FullName);
            result.Email.Should().Be(dto.Email);
            _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when attempting to update a non-existent user.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_UserDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var dto = new UserUpdateDTO("Name", "email@test.com", "+1");
            var command = new UpdateUserCommand(userId, dto);

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act
            var act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
            _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        /// <summary>
        /// Verifies that a ConflictException is thrown when the new email belongs to another user.
        /// </summary>
        [Fact]
        public async Task Should_ThrowConflictException_When_EmailBelongsToAnotherUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var existingUser = new User(userId, "User", "user@example.com", "h", "s");
            var conflictUser = new User(Guid.NewGuid(), "Other", "conflict@example.com", "h", "s");
            var dto = new UserUpdateDTO("User", "conflict@example.com", "+1");
            var command = new UpdateUserCommand(userId, dto);

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
            _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(dto.Email, userId)).ReturnsAsync(conflictUser);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<Bio.Domain.Exceptions.ConflictException>()
                .WithMessage($"*{dto.Email}*");
            _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }

        /// <summary>
        /// Verifies that a ConflictException is thrown when the new phone number belongs to another user.
        /// </summary>
        [Fact]
        public async Task Should_ThrowConflictException_When_PhoneBelongsToAnotherUser()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var existingUser = new User(userId, "User", "user@example.com", "h", "s", "+111");
            var conflictUser = new User(Guid.NewGuid(), "Other", "other@example.com", "h", "s", "+999");
            var dto = new UserUpdateDTO("User", "user@example.com", "+999");
            var command = new UpdateUserCommand(userId, dto);

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(existingUser);
            _userRepositoryMock.Setup(r => r.GetByEmailExcludingIdAsync(dto.Email, userId)).ReturnsAsync((User?)null);
            _userRepositoryMock.Setup(r => r.GetByPhoneNumberExcludingIdAsync(dto.PhoneNumber, userId)).ReturnsAsync(conflictUser);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<Bio.Domain.Exceptions.ConflictException>()
                .WithMessage($"*{dto.PhoneNumber}*");
            _userRepositoryMock.Verify(r => r.SaveChangesAsync(), Times.Never);
        }
    }
}
