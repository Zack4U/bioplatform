using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Domain.Entities;
using Bio.Domain.ReadModels;
using Bio.Domain.Interfaces;

namespace Bio.Application.Services;

/// <summary>
/// Service implementation for managing user-role assignments.
/// Handles business logic and validation for associating users with security roles.
/// </summary>
public class UserRoleService : IUserRoleService
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;

    /// <summary>
    /// Initializes a new instance of the <see cref="UserRoleService"/> class.
    /// </summary>
    /// <param name="userRoleRepository">The repository for user-role assignments.</param>
    /// <param name="userRepository">The repository for user data.</param>
    /// <param name="roleRepository">The repository for security roles.</param>
    public UserRoleService(
        IUserRoleRepository userRoleRepository,
        IUserRepository userRepository,
        IRoleRepository roleRepository)
    {
        _userRoleRepository = userRoleRepository;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
    }

    /// <summary>
    /// Assigns a security role to a user.
    /// Validates that both user and role exist and that the assignment doesn't already exist.
    /// </summary>
    /// <param name="dto">The data transfer object containing the User ID and Role ID.</param>
    /// <exception cref="KeyNotFoundException">Thrown when the user or role does not exist.</exception>
    /// <exception cref="InvalidOperationException">Thrown when the role is already assigned to the user.</exception>
    public async Task AssignRoleAsync(UserRoleCreateDTO dto)
    {
        // 1. Validate User existence
        var user = await _userRepository.GetByIdAsync(dto.UserId);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {dto.UserId} not found.");
        }

        // 2. Validate Role existence
        var role = await _roleRepository.GetByIdAsync(dto.RoleId);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID {dto.RoleId} not found.");
        }

        // 3. Prevent duplicate assignment
        var alreadyExists = await _userRoleRepository.ExistsAsync(dto.UserId, dto.RoleId);
        if (alreadyExists)
        {
            throw new InvalidOperationException($"Role '{role.Name}' is already assigned to user '{user.FullName}'.");
        }

        // 4. Create assignment
        var userRole = new UserRole
        {
            UserId = dto.UserId,
            RoleId = dto.RoleId,
            AssignedAt = DateTime.UtcNow
        };

        await _userRoleRepository.AddAsync(userRole);
        await _userRoleRepository.SaveChangesAsync();
    }

    /// <summary>
    /// Retrieves all existing user-role assignments with full details (user and role names).
    /// </summary>
    /// <returns>A collection of <see cref="UserRoleResponseDTO"/> representing all assignments.</returns>
    public async Task<IEnumerable<UserRoleResponseDTO>> GetAllAssignmentsAsync()
    {
        var details = await _userRoleRepository.GetAllWithDetailsAsync();
        return MapToDTO(details);
    }

    /// <summary>
    /// Retrieves all roles assigned to a specific user, including role names.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <returns>A collection of <see cref="UserRoleResponseDTO"/> for the specified user.</returns>
    public async Task<IEnumerable<UserRoleResponseDTO>> GetAssignmentsByUserIdAsync(Guid userId)
    {
        var details = await _userRoleRepository.GetByUserIdWithDetailsAsync(userId);
        return MapToDTO(details);
    }

    /// <summary>
    /// Retrieves all users assigned to a specific role name.
    /// </summary>
    /// <param name="roleName">The name of the security role.</param>
    /// <returns>A collection of <see cref="UserRoleResponseDTO"/> assigned to the role.</returns>
    public async Task<IEnumerable<UserRoleResponseDTO>> GetAssignmentsByRoleNameAsync(string roleName)
    {
        var details = await _userRoleRepository.GetByRoleNameWithDetailsAsync(roleName);
        return MapToDTO(details);
    }

    /// <summary>
    /// Retrieves all users assigned to a specific role identifier.
    /// </summary>
    /// <param name="roleId">The unique identifier of the security role.</param>
    /// <returns>A collection of <see cref="UserRoleResponseDTO"/> assigned to the role ID.</returns>
    public async Task<IEnumerable<UserRoleResponseDTO>> GetAssignmentsByRoleIdAsync(Guid roleId)
    {
        var details = await _userRoleRepository.GetByRoleIdWithDetailsAsync(roleId);
        return MapToDTO(details);
    }

    /// <summary>
    /// Unassigns a security role from a user.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <exception cref="KeyNotFoundException">Thrown when the assignment does not exist.</exception>
    public async Task UnassignRoleAsync(Guid userId, Guid roleId)
    {
        var userRole = await _userRoleRepository.GetByIdsAsync(userId, roleId);
        if (userRole == null)
        {
            throw new KeyNotFoundException($"Assignment for User {userId} and Role {roleId} not found.");
        }

        await _userRoleRepository.DeleteAsync(userRole);
        await _userRoleRepository.SaveChangesAsync();
    }

    /// <summary>
    /// Maps internal domain detail models to application layer DTOs.
    /// </summary>
    /// <param name="details">The collection of domain details to map.</param>
    /// <returns>A collection of mapped <see cref="UserRoleResponseDTO"/> objects.</returns>
    private static IEnumerable<UserRoleResponseDTO> MapToDTO(IEnumerable<UserRoleDetail> details)
    {
        return details.Select(d => new UserRoleResponseDTO
        {
            UserId = d.UserId,
            UserEmail = d.UserEmail,
            RoleId = d.RoleId,
            RoleName = d.RoleName,
            AssignedAt = d.AssignedAt
        });
    }
}
