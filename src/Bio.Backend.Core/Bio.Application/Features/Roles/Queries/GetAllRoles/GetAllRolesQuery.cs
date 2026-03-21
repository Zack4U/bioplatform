using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Roles.Queries.GetAllRoles;

public record GetAllRolesQuery() : IRequest<IEnumerable<RoleResponseDTO>>;

public class GetAllRolesHandler : IRequestHandler<GetAllRolesQuery, IEnumerable<RoleResponseDTO>>
{
    private readonly IRoleRepository _roleRepository;

    public GetAllRolesHandler(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<IEnumerable<RoleResponseDTO>> Handle(GetAllRolesQuery request, CancellationToken cancellationToken)
    {
        var roles = await _roleRepository.GetAllAsync();
        return roles.Select(role => new RoleResponseDTO(
            role.Id,
            role.Name,
            role.Description,
            role.CreatedAt,
            role.UpdatedAt
        ));
    }
}
