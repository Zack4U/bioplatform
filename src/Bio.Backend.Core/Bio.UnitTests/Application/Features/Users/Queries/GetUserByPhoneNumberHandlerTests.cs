using Bio.Application.Features.Users.Queries.GetUserByPhoneNumber;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Users.Queries;

/// <summary>
/// Unit tests for the GetUserByPhoneNumberHandler class.
/// </summary>
public class GetUserByPhoneNumberHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly GetUserByPhoneNumberHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetUserByPhoneNumberHandlerTests"/> class.
    /// </summary>
    public GetUserByPhoneNumberHandlerTests()
    {
        _userRepositoryMock = new Mock<IUserRepository>();
        _handler = new GetUserByPhoneNumberHandler(_userRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetUserByPhoneNumberHandler.
    /// </summary>
    public class Handle : GetUserByPhoneNumberHandlerTests
    {
        /// <summary>
        /// Verifies that a user DTO is returned when the phone number exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnUser_When_PhoneExists()
        {
            // Arrange
            var phone = "+1234567890";
            var user = new User(Guid.NewGuid(), "Alice", "alice@example.com", "h", "s", phone);
            _userRepositoryMock.Setup(r => r.GetByPhoneNumberAsync(phone)).ReturnsAsync(user);

            // Act
            var result = await _handler.Handle(new GetUserByPhoneNumberQuery(phone), CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result!.PhoneNumber.Should().Be(phone);
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when the user phone number does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_PhoneDoesNotExist()
        {
            // Arrange
            var phone = "+0000000000";
            _userRepositoryMock.Setup(r => r.GetByPhoneNumberAsync(phone)).ReturnsAsync((User?)null);

            // Act
            var act = async () => await _handler.Handle(new GetUserByPhoneNumberQuery(phone), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }
}
