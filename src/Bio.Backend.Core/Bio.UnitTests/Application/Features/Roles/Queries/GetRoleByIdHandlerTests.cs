using Bio.Application.Features.Roles.Queries.GetRoleById;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Roles.Queries;

/// <summary>
/// Unit tests for the GetRoleByIdHandler class.
/// </summary>
public class GetRoleByIdHandlerTests
{
    /// <summary>
    /// Initializes a new instance of the <see cref="GetRoleByIdHandlerTests"/> class.
    /// </summary>
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly GetRoleByIdHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetRoleByIdHandlerTests"/> class.
    /// </summary>
    public GetRoleByIdHandlerTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _handler = new GetRoleByIdHandler(_roleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetRoleByIdHandler.
    /// </summary>
    public class Handle : GetRoleByIdHandlerTests
    {
        /// <summary>
        /// Verifies that a role is returned when the ID exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnRole_When_IdExists()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var role = new Role(roleId, "ADMIN", "Admin Description");

            _roleRepositoryMock.Setup(repo => repo.GetByIdAsync(roleId))
                .ReturnsAsync(role);

            // Act
            var result = await _handler.Handle(new GetRoleByIdQuery(roleId), CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(roleId);
            result.Name.Should().Be("ADMIN");
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when the role ID does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_IdDoesNotExist()
        {
            // Arrange
            var roleId = Guid.NewGuid();

            _roleRepositoryMock.Setup(repo => repo.GetByIdAsync(roleId))
                .ReturnsAsync((Role?)null);

            // Act
            var act = async () => await _handler.Handle(new GetRoleByIdQuery(roleId), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();
        }
    }
}
