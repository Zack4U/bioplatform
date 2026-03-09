using Bio.Application.Features.UserRoles.Queries.GetUserRolesByUserId;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Bio.Domain.ReadModels;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.UserRoles.Queries;

/// <summary>
/// Unit tests for the GetUserRolesByUserIdHandler class.
/// </summary>
public class GetUserRolesByUserIdHandlerTests
{
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly GetUserRolesByUserIdHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetUserRolesByUserIdHandlerTests"/> class.
    /// </summary>
    public GetUserRolesByUserIdHandlerTests()
    {
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new GetUserRolesByUserIdHandler(_userRoleRepositoryMock.Object, _userRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetUserRolesByUserIdHandler.
    /// </summary>
    public class Handle : GetUserRolesByUserIdHandlerTests
    {
        /// <summary>
        /// Verifies that a list of roles is returned when the user exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnRoles_When_UserExists()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Alice", "alice@example.com", "h", "s");
            var details = new List<UserRoleDetail>
            {
                new() { UserId = userId, UserEmail = "alice@example.com", RoleId = Guid.NewGuid(), RoleName = "ADMIN", AssignedAt = DateTime.UtcNow }
            };

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _userRoleRepositoryMock.Setup(r => r.GetByUserIdWithDetailsAsync(userId)).ReturnsAsync(details);

            // Act
            var result = await _handler.Handle(new GetUserRolesByUserIdQuery(userId), CancellationToken.None);

            // Assert
            result.Should().HaveCount(1);
            result.Should().Contain(r => r.RoleName == "ADMIN");
        }

        /// <summary>
        /// Verifies that an empty list is returned when the user exists but has no roles assigned.
        /// </summary>
        [Fact]
        public async Task Should_ReturnEmptyList_When_UserExistsButHasNoRoles()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Alice", "alice@example.com", "h", "s");

            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);
            _userRoleRepositoryMock.Setup(r => r.GetByUserIdWithDetailsAsync(userId)).ReturnsAsync(new List<UserRoleDetail>());

            // Act
            var result = await _handler.Handle(new GetUserRolesByUserIdQuery(userId), CancellationToken.None);

            // Assert
            result.Should().BeEmpty();
        }

        /// <summary>
        /// Verifies that a KeyNotFoundException is thrown when the user does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowKeyNotFoundException_When_UserDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(new GetUserRolesByUserIdQuery(userId), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<KeyNotFoundException>()
                .WithMessage($"*{userId}*");
        }
    }
}
