using Bio.Application.Features.Users.Queries.GetAllUsers;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Queries;

/// <summary>
/// Unit tests for the GetAllUsersHandler class.
/// </summary>
public class GetAllUsersHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly GetAllUsersHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetAllUsersHandlerTests"/> class.
    /// </summary>
    public GetAllUsersHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new GetAllUsersHandler(_userRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetAllUsersHandler.
    /// </summary>
    public class Handle : GetAllUsersHandlerTests
    {
        /// <summary>
        /// Verifies that a list of users is returned when users exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnUserList_When_UsersExist()
        {
            // Arrange
            var users = new List<User>
            {
                new User(Guid.NewGuid(), "Alice", "alice@example.com", "h", "s"),
                new User(Guid.NewGuid(), "Bob", "bob@example.com", "h", "s")
            };
            _userRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(users);

            // Act
            var result = await _handler.Handle(new GetAllUsersQuery(), CancellationToken.None);

            // Assert
            result.Should().HaveCount(2);
            result.Should().Contain(u => u.Email == "alice@example.com");
        }

        /// <summary>
        /// Verifies that an empty list is returned when no users exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnEmptyList_When_NoUsersExist()
        {
            // Arrange
            _userRepositoryMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<User>());

            // Act
            var result = await _handler.Handle(new GetAllUsersQuery(), CancellationToken.None);

            // Assert
            result.Should().BeEmpty();
        }
    }
}
