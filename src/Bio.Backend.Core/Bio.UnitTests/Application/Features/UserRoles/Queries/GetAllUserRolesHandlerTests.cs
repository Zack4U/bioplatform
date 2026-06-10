using Bio.Application.Features.UserRoles.Queries.GetAllUserRoles;
using Bio.Domain.Interfaces;
using Bio.Domain.ReadModels;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.UserRoles.Queries;

/// <summary>
/// Unit tests for the GetAllUserRolesHandler class.
/// </summary>
public class GetAllUserRolesHandlerTests
{
    private readonly Mock<IUserRoleRepository> _userRoleRepositoryMock;
    private readonly GetAllUserRolesHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="GetAllUserRolesHandlerTests"/> class.
    /// </summary>
    public GetAllUserRolesHandlerTests()
    {
        _userRoleRepositoryMock = new Mock<IUserRoleRepository>();
        _handler = new GetAllUserRolesHandler(_userRoleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of GetAllUserRolesHandler.
    /// </summary>
    public class Handle : GetAllUserRolesHandlerTests
    {
        /// <summary>
        /// Verifies that a list of user-role assignments is returned when assignments exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnList_When_AssignmentsExist()
        {
            // Arrange
            var details = new List<UserRoleDetail>
            {
                new() { UserId = Guid.NewGuid(), UserEmail = "a@a.com", RoleId = Guid.NewGuid(), RoleName = "ADMIN", AssignedAt = DateTime.UtcNow },
                new() { UserId = Guid.NewGuid(), UserEmail = "b@b.com", RoleId = Guid.NewGuid(), RoleName = "USER", AssignedAt = DateTime.UtcNow }
            };

            _userRoleRepositoryMock.Setup(r => r.GetAllWithDetailsAsync()).ReturnsAsync(details);

            // Act
            var result = await _handler.Handle(new GetAllUserRolesQuery(), CancellationToken.None);

            // Assert
            result.Should().HaveCount(2);
            result.Should().Contain(r => r.RoleName == "ADMIN");
        }

        /// <summary>
        /// Verifies that an empty list is returned when no assignments exist.
        /// </summary>
        [Fact]
        public async Task Should_ReturnEmptyList_When_NoAssignmentsExist()
        {
            // Arrange
            _userRoleRepositoryMock.Setup(r => r.GetAllWithDetailsAsync()).ReturnsAsync(new List<UserRoleDetail>());

            // Act
            var result = await _handler.Handle(new GetAllUserRolesQuery(), CancellationToken.None);

            // Assert
            result.Should().BeEmpty();
        }
    }
}
