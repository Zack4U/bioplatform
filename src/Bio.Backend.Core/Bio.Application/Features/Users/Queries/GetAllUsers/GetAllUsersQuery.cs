using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Queries.GetAllUsers;

public record GetAllUsersQuery() : IRequest<IEnumerable<UserResponseDTO>>;

public class GetAllUsersHandler : IRequestHandler<GetAllUsersQuery, IEnumerable<UserResponseDTO>>
{
    private readonly IUserRepository _userRepository;

    public GetAllUsersHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<IEnumerable<UserResponseDTO>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(u => new UserResponseDTO(
            u.Id,
            u.FullName,
            u.Email,
            u.PhoneNumber,
            u.CreatedAt,
            u.UpdatedAt,
            u.TwoFactorEnabled
        ));
    }
}
