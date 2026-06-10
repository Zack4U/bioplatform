using Bio.Application.Features.Roles.Queries.GetAllRoles;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Roles.Queries;

/// <summary>
/// Unit tests for the GetAllRolesHandler class.
/// </summary>
public class GetAllRolesHandlerTests
{
    /// <summary>
    /// Initializes a new instance of the <see cref="GetAllRolesHandlerTests"/> class.
    /// </summary>
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly GetAllRolesHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetAllRolesHandlerTests"/> class.
    /// </summary>
    public GetAllRolesHandlerTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _handler = new GetAllRolesHandler(_roleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetAllRolesHandler.
    /// </summary>
    public class Handle : GetAllRolesHandlerTests
    {
        /// <summary>
        /// Verifies that a list of roles is returned when roles exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnRolesList_When_RolesExist()
        {
            // Arrange
            var roles = new List<Role>
            {
                new Role(Guid.NewGuid(), "ADMIN", "Admin Role"),
                new Role(Guid.NewGuid(), "USER", "User Role")
            };

            _roleRepositoryMock.Setup(repo => repo.GetAllAsync())
                .ReturnsAsync(roles);

            // Act
            var result = await _handler.Handle(new GetAllRolesQuery(), CancellationToken.None);

            // Assert
            result.Should().NotBeNullOrEmpty();
            result.Should().HaveCount(2);
            result.Should().Contain(r => r.Name == "ADMIN");
            result.Should().Contain(r => r.Name == "USER");
        }

        /// <summary>
        /// Verifies that an empty list is returned when no roles exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnEmptyList_When_NoRolesExist()
        {
            // Arrange
            _roleRepositoryMock.Setup(repo => repo.GetAllAsync())
                .ReturnsAsync(new List<Role>());

            // Act
            var result = await _handler.Handle(new GetAllRolesQuery(), CancellationToken.None);

            // Assert
            result.Should().BeEmpty();
        }
    }
}
