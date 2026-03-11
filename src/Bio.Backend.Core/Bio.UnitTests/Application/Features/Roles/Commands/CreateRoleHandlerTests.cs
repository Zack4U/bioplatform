using Bio.Application.DTOs;
using Bio.Application.Features.Roles.Commands.CreateRole;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Roles.Commands;

/// <summary>
/// Unit tests for the CreateRoleHandler class.
/// </summary>
public class CreateRoleHandlerTests
{
    /// <summary>
    /// Initializes a new instance of the <see cref="CreateRoleHandlerTests"/> class.
    /// </summary>
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly CreateRoleHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="CreateRoleHandlerTests"/> class.
    /// </summary>
    public CreateRoleHandlerTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _handler = new CreateRoleHandler(_roleRepositoryMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of CreateRoleHandler.
    /// </summary>
    public class Handle : CreateRoleHandlerTests
    {
        /// <summary>
        /// Verifies that a role is successfully created when the name is unique.
        /// </summary>
        [Fact]
        public async Task Should_CreateRole_When_NameIsUnique()
        {
            // Arrange
            var dto = new RoleCreateDTO("New Role", "New Description");
            var command = new CreateRoleCommand(dto);
            var normalizedName = dto.Name.Trim().ToUpperInvariant();

            _roleRepositoryMock.Setup(repo => repo.GetByNameAsync(normalizedName))
                .ReturnsAsync((Role?)null);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(normalizedName);
            result.Description.Should().Be(dto.Description);

            _roleRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<Role>()), Times.Once);
            _roleRepositoryMock.Verify(repo => repo.SaveChangesAsync(), Times.Once);
        }

        /// <summary>
        /// Verifies that a ConflictException is thrown when a role with the same name already exists.
        /// </summary>
        [Fact]
        public async Task Should_ThrowConflictException_When_RoleNameExists()
        {
            // Arrange
            var dto = new RoleCreateDTO("Existing Role", "Description");
            var command = new CreateRoleCommand(dto);
            var normalizedName = dto.Name.Trim().ToUpperInvariant();
            var existingRole = new Role(Guid.NewGuid(), normalizedName, "Some Description");

            _roleRepositoryMock.Setup(repo => repo.GetByNameAsync(normalizedName))
                .ReturnsAsync(existingRole);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<Bio.Domain.Exceptions.ConflictException>()
                .WithMessage($"Role with name '{normalizedName}' already exists.");

            _roleRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<Role>()), Times.Never);
            _roleRepositoryMock.Verify(repo => repo.SaveChangesAsync(), Times.Never);
        }
    }
}
