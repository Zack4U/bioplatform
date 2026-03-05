using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentValidation;

namespace Bio.Application.Services;

/// <summary>
/// Defines the services for role management.
/// </summary>
public interface IRoleService
{
    /// <summary>
    /// Creates a new role in the system.
    /// </summary>
    /// <param name="dto">Role creation data.</param>
    /// <returns>Information of the created role.</returns>
    Task<RoleResponseDTO> CreateRoleAsync(RoleCreateDTO dto);

    /// <summary>
    /// Retrieves all roles.
    /// </summary>
    /// <returns>A collection of roles.</returns>
    Task<IEnumerable<RoleResponseDTO>> GetAllRolesAsync();
}

/// <summary>
/// Implementation of role services.
/// </summary>
public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;
    private readonly IValidator<RoleCreateDTO> _validator;

    public RoleService(IRoleRepository roleRepository, IValidator<RoleCreateDTO> validator)
    {
        _roleRepository = roleRepository;
        _validator = validator;
    }

    public async Task<RoleResponseDTO> CreateRoleAsync(RoleCreateDTO dto)
    {
        // 1. Validation
        var validationResult = await _validator.ValidateAsync(dto);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        // 2. Normalization (Uppercase as requested)
        var normalizedName = dto.Name.Trim().ToUpperInvariant();

        // 3. Check uniqueness
        var existingRole = await _roleRepository.GetByNameAsync(normalizedName);
        if (existingRole != null)
        {
            throw new InvalidOperationException($"Role with name '{normalizedName}' already exists.");
        }

        // 4. Map to Entity
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };

        // 5. Save to database
        await _roleRepository.AddAsync(role);
        await _roleRepository.SaveChangesAsync();

        // 6. Map to Response DTO
        return MapToResponseDTO(role);
    }

    /// <summary>
    /// Retrieves all security roles from the repository.
    /// </summary>
    /// <returns>A collection of role transfer objects.</returns>
    public async Task<IEnumerable<RoleResponseDTO>> GetAllRolesAsync()
    {
        var roles = await _roleRepository.GetAllAsync();
        return roles.Select(MapToResponseDTO);
    }

    /// <summary>
    /// Maps a Role domain entity to a RoleResponseDTO.
    /// </summary>
    /// <param name="role">The role entity to map.</param>
    /// <returns>A normalized response DTO.</returns>
    private static RoleResponseDTO MapToResponseDTO(Role role)
    {
        return new RoleResponseDTO
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            CreatedAt = role.CreatedAt,
            UpdatedAt = role.UpdatedAt
        };
    }
}
