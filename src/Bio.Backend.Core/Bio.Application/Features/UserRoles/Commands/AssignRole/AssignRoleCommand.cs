using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.UserRoles.Commands.AssignRole;

public record AssignRoleCommand(UserRoleCreateDTO Dto) : IRequest;

public class AssignRoleHandler : IRequestHandler<AssignRoleCommand>
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;

    public AssignRoleHandler(
        IUserRoleRepository userRoleRepository,
        IUserRepository userRepository,
        IRoleRepository roleRepository)
    {
        _userRoleRepository = userRoleRepository;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
    }

    public async Task Handle(AssignRoleCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        // 1. Ensure User Exists
        var user = await _userRepository.GetByIdAsync(dto.UserId);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {dto.UserId} not found.");
        }

        // 2. Ensure Role Exists
        var role = await _roleRepository.GetByIdAsync(dto.RoleId);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID {dto.RoleId} not found.");
        }

        // 3. Check for existing assignment
        var alreadyExists = await _userRoleRepository.ExistsAsync(dto.UserId, dto.RoleId);
        if (alreadyExists)
        {
            throw new InvalidOperationException($"Role '{role.Name}' is already assigned to user '{user.FullName}'.");
        }

        // 4. Create via Domain Constructor
        var userRole = new UserRole(dto.UserId, dto.RoleId);

        await _userRoleRepository.AddAsync(userRole);
        await _userRoleRepository.SaveChangesAsync();
    }
}
