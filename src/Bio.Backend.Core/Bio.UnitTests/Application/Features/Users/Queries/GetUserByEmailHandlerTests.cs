using Bio.Application.Features.Users.Queries.GetUserByEmail;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Queries;

/// <summary>
/// Unit tests for the GetUserByEmailHandler class.
/// </summary>
public class GetUserByEmailHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly GetUserByEmailHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetUserByEmailHandlerTests"/> class.
    /// </summary>
    public GetUserByEmailHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new GetUserByEmailHandler(_userRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetUserByEmailHandler.
    /// </summary>
    public class Handle : GetUserByEmailHandlerTests
    {
        /// <summary>
        /// Verifies that a user DTO is returned when the email exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnUser_When_EmailExists()
        {
            // Arrange
            var email = "alice@example.com";
            var user = new User(Guid.NewGuid(), "Alice", email, "h", "s");
            _userRepositoryMock.Setup(r => r.GetByEmailAsync(email)).ReturnsAsync(user);

            // Act
            var result = await _handler.Handle(new GetUserByEmailQuery(email), CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be(email);
        }

        /// <summary>
        /// Verifies that null is returned when the email does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnNull_When_EmailDoesNotExist()
        {
            // Arrange
            var email = "missing@example.com";
            _userRepositoryMock.Setup(r => r.GetByEmailAsync(email)).ReturnsAsync((User?)null);

            // Act
            var result = await _handler.Handle(new GetUserByEmailQuery(email), CancellationToken.None);

            // Assert
            result.Should().BeNull();
        }
    }
}
