using Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleId;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Bio.Domain.ReadModels;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.UserRoles.Queries;

/// <summary>
/// Unit tests for the GetUserRolesByRoleIdHandler class.
/// </summary>
public class GetUserRolesByRoleIdHandlerTests
{
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly GetUserRolesByRoleIdHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetUserRolesByRoleIdHandlerTests"/> class.
    /// </summary>
    public GetUserRolesByRoleIdHandlerTests()
    {
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _handler = new GetUserRolesByRoleIdHandler(_userRoleRepositoryMock.Object, _roleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetUserRolesByRoleIdHandler.
    /// </summary>
    public class Handle : GetUserRolesByRoleIdHandlerTests
    {
        /// <summary>
        /// Verifies that a list of user assignments is returned when the role exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnUsers_When_RoleExists()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var role = new Role(roleId, "ADMIN", "Admin Role");
            var details = new List<UserRoleDetail>
            {
                new() { UserId = Guid.NewGuid(), UserEmail = "alice@example.com", RoleId = roleId, RoleName = "ADMIN", AssignedAt = DateTime.UtcNow }
            };

            _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync(role);
            _userRoleRepositoryMock.Setup(r => r.GetByRoleIdWithDetailsAsync(roleId)).ReturnsAsync(details);

            // Act
            var result = await _handler.Handle(new GetUserRolesByRoleIdQuery(roleId), CancellationToken.None);

            // Assert
            result.Should().HaveCount(1);
            result.Should().Contain(r => r.UserEmail == "alice@example.com");
        }

        /// <summary>
        /// Verifies that an empty list is returned when the role exists but has no users assigned.
        /// </summary>
        [Fact]
        public async Task Should_ReturnEmptyList_When_RoleExistsButHasNoAssignments()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var role = new Role(roleId, "ADMIN", "Admin Role");

            _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync(role);
            _userRoleRepositoryMock.Setup(r => r.GetByRoleIdWithDetailsAsync(roleId)).ReturnsAsync(new List<UserRoleDetail>());

            // Act
            var result = await _handler.Handle(new GetUserRolesByRoleIdQuery(roleId), CancellationToken.None);

            // Assert
            result.Should().BeEmpty();
        }

        /// <summary>
        /// Verifies that a KeyNotFoundException is thrown when the role does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowKeyNotFoundException_When_RoleDoesNotExist()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync((Role?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(new GetUserRolesByRoleIdQuery(roleId), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<KeyNotFoundException>()
                .WithMessage($"*{roleId}*");
        }
    }
}
