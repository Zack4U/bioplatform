using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;

namespace Bio.Application.Services;

/// <summary>
/// Implementation of role services.
/// </summary>
public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    /// <summary>
    /// Initializes a new instance of the <see cref="RoleService"/> class.
    /// </summary>
    /// <param name="roleRepository">The repository for role data.</param>
    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<RoleResponseDTO> CreateRoleAsync(RoleCreateDTO dto)
    {
        // 1. Normalization (Uppercase as requested)
        var normalizedName = dto.Name.Trim().ToUpperInvariant();

        // 2. Check uniqueness
        var existingRole = await _roleRepository.GetByNameAsync(normalizedName);
        if (existingRole != null)
        {
            throw new InvalidOperationException($"Role with name '{normalizedName}' already exists.");
        }

        // 3. Map to Entity
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Name = normalizedName,
            Description = dto.Description,
            CreatedAt = DateTime.UtcNow
        };

        // 4. Save to database
        await _roleRepository.AddAsync(role);
        await _roleRepository.SaveChangesAsync();

        // 5. Map to Response DTO
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

    public async Task DeleteRoleAsync(Guid id)
    {
        var role = await _roleRepository.GetByIdAsync(id);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID '{id}' not found.");
        }

        await _roleRepository.DeleteAsync(role);
        await _roleRepository.SaveChangesAsync();
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
