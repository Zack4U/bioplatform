using AutoMapper;
using Bio.Application.DTOs;
using Bio.Application.Mappings;
using Bio.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Bio.UnitTests.Application.Mappings;

/// <summary>
/// Unit tests for the <see cref="MappingProfile"/> class.
/// </summary>
public class MappingProfileTests
{
    private readonly IConfigurationProvider _configuration;
    private readonly IMapper _mapper;

    public MappingProfileTests()
    {
        _configuration = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
        _mapper = _configuration.CreateMapper();
    }

    /// <summary>
    /// Verifies that the AutoMapper configuration is valid.
    /// </summary>
    [Fact]
    public void Should_HaveValidConfiguration()
    {
        _configuration.AssertConfigurationIsValid();
    }

    /// <summary>
    /// Tests for specific entity to DTO mappings.
    /// </summary>
    public class EntityToDtoMappings : MappingProfileTests
    {
        /// <summary>
        /// Verifies that a User entity is correctly mapped to a UserResponseDTO.
        /// </summary>
        [Fact]
        public void Should_MapUserToUserResponseDTO()
        {
            // Arrange
            var entity = new User(Guid.NewGuid(), "John Doe", "john@example.com", "hash", "salt", "123456789");

            // Act
            var result = _mapper.Map<UserResponseDTO>(entity);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(entity.Id);
            result.FullName.Should().Be(entity.FullName);
            result.Email.Should().Be(entity.Email);
            result.PhoneNumber.Should().Be(entity.PhoneNumber);
        }

        /// <summary>
        /// Verifies that a Role entity is correctly mapped to a RoleResponseDTO.
        /// </summary>
        [Fact]
        public void Should_MapRoleToRoleResponseDTO()
        {
            // Arrange
            var entity = new Role(Guid.NewGuid(), "Admin", "Administrator role");

            // Act
            var result = _mapper.Map<RoleResponseDTO>(entity);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(entity.Id);
            result.Name.Should().Be(entity.Name);
            result.Description.Should().Be(entity.Description);
        }
    }
}
