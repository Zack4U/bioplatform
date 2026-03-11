using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Queries.GetUserById;

public record GetUserByIdQuery(Guid Id) : IRequest<UserResponseDTO?>;

public class GetUserByIdHandler : IRequestHandler<GetUserByIdQuery, UserResponseDTO?>
{
    private readonly IUserRepository _userRepository;

    public GetUserByIdHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserResponseDTO?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.Id);
        if (user == null) return null;

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
