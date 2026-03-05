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
    /// Updates an existing security role.
    /// </summary>
    /// <param name="id">The unique identifier of the role to update.</param>
    /// <param name="dto">The update data.</param>
    /// <returns>The updated role information.</returns>
    Task<RoleResponseDTO> UpdateRoleAsync(Guid id, RoleUpdateDTO dto);

    /// <summary>
    /// Retrieves all roles.
    /// </summary>
    /// <returns>A collection of roles.</returns>
    Task<IEnumerable<RoleResponseDTO>> GetAllRolesAsync();

    /// <summary>
    /// Retrieves a role by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the role.</param>
    /// <returns>The role information or null if not found.</returns>
    Task<RoleResponseDTO?> GetRoleByIdAsync(Guid id);

    /// <summary>
    /// Retrieves a role by its unique name.
    /// </summary>
    /// <param name="name">The name of the role.</param>
    /// <returns>The role information or null if not found.</returns>
    Task<RoleResponseDTO?> GetRoleByNameAsync(string name);
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

    public async Task<RoleResponseDTO> UpdateRoleAsync(Guid id, RoleUpdateDTO dto)
    {
        var role = await _roleRepository.GetByIdAsync(id);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID '{id}' not found.");
        }

        var normalizedName = dto.Name.Trim().ToUpperInvariant();

        // Check if the new name is already taken by ANOTHER role
        var existingWithSameName = await _roleRepository.GetByNameExcludingIdAsync(normalizedName, id);
        if (existingWithSameName != null)
        {
            throw new InvalidOperationException($"Another role with name '{normalizedName}' already exists.");
        }

        role.Name = normalizedName;
        role.Description = dto.Description;
        role.UpdatedAt = DateTime.UtcNow;

        await _roleRepository.SaveChangesAsync();

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
    /// Retrieves a role by its unique identifier.
    /// </summary>
    public async Task<RoleResponseDTO?> GetRoleByIdAsync(Guid id)
    {
        var role = await _roleRepository.GetByIdAsync(id);
        return role != null ? MapToResponseDTO(role) : null;
    }

    /// <summary>
    /// Retrieves a role by its unique name (case-insensitive).
    /// </summary>
    public async Task<RoleResponseDTO?> GetRoleByNameAsync(string name)
    {
        var normalizedName = name.Trim().ToUpperInvariant();
        var role = await _roleRepository.GetByNameAsync(normalizedName);
        return role != null ? MapToResponseDTO(role) : null;
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
