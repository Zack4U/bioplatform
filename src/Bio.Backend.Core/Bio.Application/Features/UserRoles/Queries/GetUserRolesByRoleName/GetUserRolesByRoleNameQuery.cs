using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.UserRoles.Queries.GetUserRolesByRoleName;

public record GetUserRolesByRoleNameQuery(string RoleName) : IRequest<IEnumerable<UserRoleResponseDTO>>;

public class GetUserRolesByRoleNameHandler : IRequestHandler<GetUserRolesByRoleNameQuery, IEnumerable<UserRoleResponseDTO>>
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IRoleRepository _roleRepository;

    public GetUserRolesByRoleNameHandler(IUserRoleRepository userRoleRepository, IRoleRepository roleRepository)
    {
        _userRoleRepository = userRoleRepository;
        _roleRepository = roleRepository;
    }

    public async Task<IEnumerable<UserRoleResponseDTO>> Handle(GetUserRolesByRoleNameQuery request, CancellationToken cancellationToken)
    {
        var normalizedName = request.RoleName.Trim().ToUpperInvariant();
        var role = await _roleRepository.GetByNameAsync(normalizedName);
        if (role == null)
        {
            throw new KeyNotFoundException($"Role '{request.RoleName}' not found.");
        }

        var details = await _userRoleRepository.GetByRoleNameWithDetailsAsync(normalizedName);
        return details.Select(d => new UserRoleResponseDTO(
            d.UserId,
            d.UserEmail,
            d.RoleId,
            d.RoleName,
            d.AssignedAt
        ));
    }
}
