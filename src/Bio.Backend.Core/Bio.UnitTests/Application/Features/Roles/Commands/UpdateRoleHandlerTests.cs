using Bio.Application.DTOs;
using Bio.Application.Features.Roles.Commands.UpdateRole;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;

namespace Bio.UnitTests.Application.Features.Roles.Commands;

/// <summary>
/// Unit tests for the UpdateRoleCommandHandler class.
/// </summary>
public class UpdateRoleCommandHandlerTests
{
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly UpdateRoleCommandHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="UpdateRoleCommandHandlerTests"/> class.
    /// </summary>
    public UpdateRoleCommandHandlerTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _handler = new UpdateRoleCommandHandler(_roleRepositoryMock.Object, _unitOfWorkMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of UpdateRoleCommandHandler.
    /// </summary>
    public class Handle : UpdateRoleCommandHandlerTests
    {
        /// <summary>
        /// Verifies that a role is successfully updated when the ID exists and the name is unique.
        /// </summary>
        [Fact]
        public async Task Should_UpdateRole_When_ExistsAndNameIsUnique()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var existingRole = new Role(roleId, "OLD_NAME", "Old Description");
            var dto = new RoleUpdateDTO("New Name", "New Description");
            var command = new UpdateRoleCommand(roleId, dto);
            var normalizedName = dto.Name.Trim().ToUpperInvariant();

            _roleRepositoryMock.Setup(repo => repo.GetByIdAsync(roleId))
                .ReturnsAsync(existingRole);
            _roleRepositoryMock.Setup(repo => repo.GetByNameExcludingIdAsync(normalizedName, roleId))
                .ReturnsAsync((Role?)null);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(normalizedName);
            result.Description.Should().Be(dto.Description);

            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Once);
        }

        /// <summary>
        /// Verifies that a NotFoundException is thrown when attempting to update a non-existent role.
        /// </summary>
        [Fact]
        public async Task Should_ThrowNotFoundException_When_RoleDoesNotExist()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var dto = new RoleUpdateDTO("Name", "Description");
            var command = new UpdateRoleCommand(roleId, dto);

            _roleRepositoryMock.Setup(repo => repo.GetByIdAsync(roleId))
                .ReturnsAsync((Role?)null);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<NotFoundException>();

            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Never);
        }

        /// <summary>
        /// Verifies that a ConflictException is thrown when another role with the same name already exists.
        /// </summary>
        [Fact]
        public async Task Should_ThrowConflictException_When_RoleNameAlreadyExists()
        {
            // Arrange
            var roleId = Guid.NewGuid();
            var existingRole = new Role(roleId, "ORIGINAL_NAME", "Description");
            var otherRoleId = Guid.NewGuid();
            var otherRole = new Role(otherRoleId, "CONFLICT_NAME", "Description");
            var dto = new RoleUpdateDTO("Conflict Name", "Description");
            var command = new UpdateRoleCommand(roleId, dto);
            var normalizedName = dto.Name.Trim().ToUpperInvariant();

            _roleRepositoryMock.Setup(repo => repo.GetByIdAsync(roleId))
                .ReturnsAsync(existingRole);
            _roleRepositoryMock.Setup(repo => repo.GetByNameExcludingIdAsync(normalizedName, roleId))
                .ReturnsAsync(otherRole);

            // Act
            Func<Task> act = async () => await _handler.Handle(command, CancellationToken.None);

            // Assert
            await act.Should().ThrowAsync<Bio.Domain.Exceptions.ConflictException>()
                .WithMessage($"Another role with name '{normalizedName}' already exists.");

            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Never);
        }
    }
}
