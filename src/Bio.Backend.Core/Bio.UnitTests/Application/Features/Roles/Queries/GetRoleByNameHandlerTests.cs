using Bio.Application.Features.Roles.Queries.GetRoleByName;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Roles.Queries;

/// <summary>
/// Unit tests for the GetRoleByNameHandler class.
/// </summary>
public class GetRoleByNameHandlerTests
{
    /// <summary>
    /// Initializes a new instance of the <see cref="GetRoleByNameHandlerTests"/> class.
    /// </summary>
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly GetRoleByNameHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetRoleByNameHandlerTests"/> class.
    /// </summary>
    public GetRoleByNameHandlerTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _handler = new GetRoleByNameHandler(_roleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetRoleByNameHandler.
    /// </summary>
    public class Handle : GetRoleByNameHandlerTests
    {
        /// <summary>
        /// Verifies that a role is returned when the name exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnRole_When_NameExists()
        {
            // Arrange
            var roleName = "Admin";
            var normalizedName = roleName.Trim().ToUpperInvariant();
            var role = new Role(Guid.NewGuid(), normalizedName, "Admin Description");

            _roleRepositoryMock.Setup(repo => repo.GetByNameAsync(normalizedName))
                .ReturnsAsync(role);

            // Act
            var result = await _handler.Handle(new GetRoleByNameQuery(roleName), CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result!.Name.Should().Be(normalizedName);
        }

        /// <summary>
        /// Verifies that null is returned when the role name does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnNull_When_NameDoesNotExist()
        {
            // Arrange
            var roleName = "NonExistent";
            var normalizedName = roleName.Trim().ToUpperInvariant();

            _roleRepositoryMock.Setup(repo => repo.GetByNameAsync(normalizedName))
                .ReturnsAsync((Role?)null);

            // Act
            var result = await _handler.Handle(new GetRoleByNameQuery(roleName), CancellationToken.None);

            // Assert
            result.Should().BeNull();
        }
    }
}
