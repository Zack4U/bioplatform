using Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleName;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using Bio.Domain.ReadModels;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.UserRoles.Queries;

/// <summary>
/// Unit tests for the GetUserRolesByRoleNameHandler class.
/// </summary>
public class GetUserRolesByRoleNameHandlerTests
{
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly GetUserRolesByRoleNameHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetUserRolesByRoleNameHandlerTests"/> class.
    /// </summary>
    public GetUserRolesByRoleNameHandlerTests()
    {
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _handler = new GetUserRolesByRoleNameHandler(_userRoleRepositoryMock.Object, _roleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetUserRolesByRoleNameHandler.
    /// </summary>
    public class Handle : GetUserRolesByRoleNameHandlerTests
    {
        /// <summary>
        /// Verifies that a list of user assignments is returned when the role name exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnUsers_When_RoleNameExists()
        {
            // Arrange
            var roleName = "Admin";
            var normalizedName = roleName.Trim().ToUpperInvariant();
            var role = new Role(Guid.NewGuid(), normalizedName, "Admin Role");
            var details = new List<UserRoleDetail>
            {
                new() { UserId = Guid.NewGuid(), UserEmail = "alice@example.com", RoleId = role.Id, RoleName = normalizedName, AssignedAt = DateTime.UtcNow }
            };

            _roleRepositoryMock.Setup(r => r.GetByNameAsync(normalizedName)).ReturnsAsync(role);
            _userRoleRepositoryMock.Setup(r => r.GetByRoleNameWithDetailsAsync(normalizedName)).ReturnsAsync(details);

            // Act
            var result = await _handler.Handle(new GetUserRolesByRoleNameQuery(roleName), CancellationToken.None);

            // Assert
            result.Should().HaveCount(1);
            result.Should().Contain(r => r.RoleName == normalizedName);
        }

        /// <summary>
        /// Verifies that an empty list is returned when the role name exists but no users have it assigned.
        /// </summary>
        [Fact]
        public async Task Should_ReturnEmptyList_When_RoleNameExistsButHasNoAssignments()
        {
            // Arrange
            var roleName = "Admin";
            var normalizedName = roleName.Trim().ToUpperInvariant();
            var role = new Role(Guid.NewGuid(), normalizedName, "Admin Role");

            _roleRepositoryMock.Setup(r => r.GetByNameAsync(normalizedName)).ReturnsAsync(role);
            _userRoleRepositoryMock.Setup(r => r.GetByRoleNameWithDetailsAsync(normalizedName)).ReturnsAsync(new List<UserRoleDetail>());

            // Act
            var result = await _handler.Handle(new GetUserRolesByRoleNameQuery(roleName), CancellationToken.None);

            // Assert
            result.Should().BeEmpty();
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when the role name does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_RoleNameDoesNotExist()
        {
            // Arrange
            var roleName = "NonExistent";
            var normalizedName = roleName.Trim().ToUpperInvariant();
            _roleRepositoryMock.Setup(r => r.GetByNameAsync(normalizedName)).ReturnsAsync((Role?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(new GetUserRolesByRoleNameQuery(roleName), CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"*Role*{roleName}*not found*");
        }
    }
}
