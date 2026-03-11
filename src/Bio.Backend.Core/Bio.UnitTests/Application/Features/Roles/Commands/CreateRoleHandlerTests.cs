using Bio.Application.DTOs;
using Bio.Application.Features.Roles.Commands.CreateRole;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentAssertions;
using Moq;
using Xunit;
using AutoMapper;

namespace Bio.UnitTests.Application.Features.Roles.Commands;

/// <summary>
/// Unit tests for the CreateRoleCommandHandler class.
/// </summary>
public class CreateRoleCommandHandlerTests
{
    private readonly Mock<IRoleRepository> _roleRepositoryMock;
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IMapper> _mapperMock;
    private readonly CreateRoleCommandHandler _handler;

    /// <summary>
    /// Initializes a new instance of the <see cref="CreateRoleCommandHandlerTests"/> class.
    /// </summary>
    public CreateRoleCommandHandlerTests()
    {
        _roleRepositoryMock = new Mock<IRoleRepository>();
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _mapperMock = new Mock<IMapper>();
        _handler = new CreateRoleCommandHandler(_roleRepositoryMock.Object, _unitOfWorkMock.Object, _mapperMock.Object);
    }

    /// <summary>
    /// Tests for the Handle method of CreateRoleCommandHandler.
    /// </summary>
    public class Handle : CreateRoleCommandHandlerTests
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
            _mapperMock.Setup(m => m.Map<RoleResponseDTO>(It.IsAny<Role>()))
                .Returns(new RoleResponseDTO(Guid.NewGuid(), normalizedName, dto.Description, DateTime.UtcNow, DateTime.UtcNow));

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be(normalizedName);
            result.Description.Should().Be(dto.Description);

            _roleRepositoryMock.Verify(repo => repo.AddAsync(It.IsAny<Role>()), Times.Once);
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Once);
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
            _unitOfWorkMock.Verify(uow => uow.SaveChangesAsync(CancellationToken.None), Times.Never);
        }
    }
}
