using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.UserRoles.Queries.GetAllUserRoles;

public record GetAllUserRolesQuery() : IRequest<IEnumerable<UserRoleResponseDTO>>;

public class GetAllUserRolesHandler : IRequestHandler<GetAllUserRolesQuery, IEnumerable<UserRoleResponseDTO>>
{
    private readonly IUserRoleRepository _userRoleRepository;

    public GetAllUserRolesHandler(IUserRoleRepository userRoleRepository)
    {
        _userRoleRepository = userRoleRepository;
    }

    public async Task<IEnumerable<UserRoleResponseDTO>> Handle(GetAllUserRolesQuery request, CancellationToken cancellationToken)
    {
        var details = await _userRoleRepository.GetAllWithDetailsAsync();
        return details.Select(d => new UserRoleResponseDTO(
            d.UserId,
            d.UserEmail,
            d.RoleId,
            d.RoleName,
            d.AssignedAt
        ));
    }
}
