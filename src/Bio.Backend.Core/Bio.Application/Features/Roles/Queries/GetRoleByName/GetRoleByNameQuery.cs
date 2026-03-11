using Bio.Application.DTOs;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Roles.Queries.GetRoleByName;

public record GetRoleByNameQuery(string Name) : IRequest<RoleResponseDTO>;

public class GetRoleByNameHandler : IRequestHandler<GetRoleByNameQuery, RoleResponseDTO>
{
    private readonly IRoleRepository _roleRepository;

    public GetRoleByNameHandler(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<RoleResponseDTO> Handle(GetRoleByNameQuery request, CancellationToken cancellationToken)
    {
        var normalizedName = request.Name.Trim().ToUpperInvariant();
        var role = await _roleRepository.GetByNameAsync(normalizedName);
        if (role == null) throw new NotFoundException("Role", normalizedName);

        return new RoleResponseDTO(
            role.Id,
            role.Name,
            role.Description,
            role.CreatedAt,
            role.UpdatedAt
        );
    }
}
