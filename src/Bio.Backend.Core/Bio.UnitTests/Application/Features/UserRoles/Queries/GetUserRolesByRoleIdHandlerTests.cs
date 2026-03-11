using Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleId;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
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
        /// Verifies that a list of user assignments is returned when the role ID exists.
        /// </summary>
        [Fact]
        public async Task Should_ReturnUsers_When_RoleIdExists()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var role = new Role(roleId, "ADMIN", "Admin Role");
            var details = new List<UserRoleDetail>
            {
                new() { UserId = Guid.NewGuid(), UserEmail = "admin@example.com", RoleId = roleId, RoleName = "ADMIN", AssignedAt = DateTime.UtcNow }
            };

            _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync(role);
            _userRoleRepositoryMock.Setup(r => r.GetByRoleIdWithDetailsAsync(roleId)).ReturnsAsync(details);

            // Act
            var result = await _handler.Handle(new GetUserRolesByRoleIdQuery(roleId), CancellationToken.None);

            // Assert
            result.Should().HaveCount(1);
            result.Should().Contain(r => r.RoleName == "ADMIN");
        }

        /// <summary>
        /// Verifies that an empty list is returned when the role ID exists but no users have it assigned.
        /// </summary>
        [Fact]
        public async Task Should_ReturnEmptyList_When_RoleIdExistsButHasNoAssignments()
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
        /// Verifies that a NotFoundException is thrown when the role does not exist.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_RoleDoesNotExist()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            _roleRepositoryMock.Setup(r => r.GetByIdAsync(roleId)).ReturnsAsync((Role?)null);
 
            // Act
            Func<Task> act = async () => await _handler.Handle(new GetUserRolesByRoleIdQuery(roleId), CancellationToken.None);
 
            // Assert
            await act.Should().ThrowAsync<NotFoundException>()
                .WithMessage($"*Role*{roleId}*not found*");
        }
    }
}
