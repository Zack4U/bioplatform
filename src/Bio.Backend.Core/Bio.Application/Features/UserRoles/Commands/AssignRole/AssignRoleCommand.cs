using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Exceptions;
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
        var user = await _userRepository.GetByIdAsync(dto.UserId!.Value);
        if (user == null)
        {
            throw new NotFoundException("User", dto.UserId!.Value);
        }

        // 2. Ensure Role Exists
        var role = await _roleRepository.GetByIdAsync(dto.RoleId!.Value);
        if (role == null)
        {
            throw new NotFoundException("Role", dto.RoleId!.Value);
        }

        // 3. Check for existing assignment
        var alreadyExists = await _userRoleRepository.ExistsAsync(dto.UserId!.Value, dto.RoleId!.Value);
        if (alreadyExists)
        {
            throw new Bio.Domain.Exceptions.ConflictException($"Role '{role.Name}' is already assigned to user '{user.FullName}'.");
        }

        // 4. Create via Domain Constructor
        var userRole = new UserRole(dto.UserId!.Value, dto.RoleId!.Value);

        await _userRoleRepository.AddAsync(userRole);
        await _userRoleRepository.SaveChangesAsync();
    }
}
