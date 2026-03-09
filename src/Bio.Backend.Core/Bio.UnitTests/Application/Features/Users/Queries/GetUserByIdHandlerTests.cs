using Bio.Application.Features.Users.Queries.GetUserById;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Queries;

/// <summary>
/// Unit tests for the GetUserByIdHandler class.
/// </summary>
public class GetUserByIdHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly GetUserByIdHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetUserByIdHandlerTests"/> class.
    /// </summary>
    public GetUserByIdHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new GetUserByIdHandler(_userRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetUserByIdHandler.
    /// </summary>
    public class Handle : GetUserByIdHandlerTests
    {
        /// <summary>
        /// Verifies that a user DTO is returned when the ID exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnUser_When_IdExists()
        {
            // Arrange
            var userId = Guid.NewGuid();
            var user = new User(userId, "Alice", "alice@example.com", "h", "s");
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync(user);

            // Act
            var result = await _handler.Handle(new GetUserByIdQuery(userId), CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(userId);
            result.Email.Should().Be("alice@example.com");
        }

        /// <summary>
        /// Verifies that null is returned when the user ID does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnNull_When_IdDoesNotExist()
        {
            // Arrange
            var userId = Guid.NewGuid();
            _userRepositoryMock.Setup(r => r.GetByIdAsync(userId)).ReturnsAsync((User?)null);

            // Act
            var result = await _handler.Handle(new GetUserByIdQuery(userId), CancellationToken.None);

            // Assert
            result.Should().BeNull();
        }
    }
}
