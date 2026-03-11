using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleId;

public record GetUserRolesByRoleIdQuery(Guid RoleId) : IRequest<IEnumerable<UserRoleResponseDTO>>;

public class GetUserRolesByRoleIdHandler : IRequestHandler<GetUserRolesByRoleIdQuery, IEnumerable<UserRoleResponseDTO>>
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IRoleRepository _roleRepository;

    public GetUserRolesByRoleIdHandler(IUserRoleRepository userRoleRepository, IRoleRepository roleRepository)
    {
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
    }

    public async Task<IEnumerable<UserRoleResponseDTO>> Handle(GetUserRolesByRoleIdQuery request, CancellationToken cancellationToken)
    {
        var role = await _roleRepository.GetByIdAsync(request.RoleId);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role with ID {request.RoleId} not found.");
        }

        var details = await _userRoleRepository.GetByRoleIdWithDetailsAsync(request.RoleId);
        return details.Select(d => new UserRoleResponseDTO(
            d.UserId,
            d.UserEmail,
            d.RoleId,
            d.RoleName,
            d.AssignedAt
        ));
    }
}
