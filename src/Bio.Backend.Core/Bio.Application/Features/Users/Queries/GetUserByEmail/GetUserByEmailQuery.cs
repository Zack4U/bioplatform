using Bio.Application.DTOs;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Queries.GetUserByEmail;

public record GetUserByEmailQuery(string Email) : IRequest<UserResponseDTO>;

public class GetUserByEmailHandler : IRequestHandler<GetUserByEmailQuery, UserResponseDTO>
{
    private readonly IUserRepository _userRepository;

    public GetUserByEmailHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserResponseDTO> Handle(GetUserByEmailQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(request.Email);
        if (user == null) throw new NotFoundException("User", request.Email);

        return new UserResponseDTO(
            user.Id,
            user.FullName,
            user.Email,
            user.PhoneNumber,
            user.CreatedAt,
            user.UpdatedAt
        );
    }
}
