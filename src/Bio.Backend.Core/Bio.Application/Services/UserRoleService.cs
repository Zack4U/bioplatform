using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;

namespace Bio.Application.Services;

/// <summary>
/// Implementation of independent user-role service.
/// </summary>
public class UserRoleService : IUserRoleService
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;

    public UserRoleService(
        IUserRoleRepository userRoleRepository,
        IUserRepository userRepository,
        IRoleRepository roleRepository)
    {
        _userRoleRepository = userRoleRepository;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
    }

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
}
