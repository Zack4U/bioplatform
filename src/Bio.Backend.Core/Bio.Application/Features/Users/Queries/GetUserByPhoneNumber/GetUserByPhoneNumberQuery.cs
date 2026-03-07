using Bio.Application.DTOs;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Queries.GetUserByPhoneNumber;

public record GetUserByPhoneNumberQuery(string PhoneNumber) : IRequest<UserResponseDTO?>;

public class GetUserByPhoneNumberHandler : IRequestHandler<GetUserByPhoneNumberQuery, UserResponseDTO?>
{
    private readonly IUserRepository _userRepository;

    public GetUserByPhoneNumberHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserResponseDTO?> Handle(GetUserByPhoneNumberQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByPhoneNumberAsync(request.PhoneNumber);
        if (user == null) return null;

        return new UserResponseDTO
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }
}
