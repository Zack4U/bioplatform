using Bio.Application.DTOs;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.UserRoles.Queries.GetUserRolesByUserId;

public record GetUserRolesByUserIdQuery(Guid UserId) : IRequest<IEnumerable<UserRoleResponseDTO>>;

public class GetUserRolesByUserIdHandler : IRequestHandler<GetUserRolesByUserIdQuery, IEnumerable<UserRoleResponseDTO>>
{
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUserRepository _userRepository;

    public GetUserRolesByUserIdHandler(IUserRoleRepository userRoleRepository, IUserRepository userRepository)
    {
        _userRoleRepository = userRoleRepository;
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserRoleResponseDTO>> Handle(GetUserRolesByUserIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.UserId);
        if (user == null)
        {
            throw new NotFoundException("User", request.UserId);
        }

        var details = await _userRoleRepository.GetByUserIdWithDetailsAsync(request.UserId);
        return details.Select(d => new UserRoleResponseDTO(
            d.UserId,
            d.UserEmail,
            d.RoleId,
            d.RoleName,
            d.AssignedAt
        ));
    }
}
