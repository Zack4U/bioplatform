using Bio.Application.DTOs;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Commands.UpdateUser;

public record UpdateUserCommand(Guid Id, UserUpdateDTO Dto) : IRequest<UserResponseDTO>;

public class UpdateUserHandler : IRequestHandler<UpdateUserCommand, UserResponseDTO>
{
    private readonly IUserRepository _userRepository;

    public UpdateUserHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserResponseDTO> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.Id);
        if (user == null) throw new NotFoundException("User", request.Id);

        // Uniqueness checks
        var emailConflict = await _userRepository.GetByEmailExcludingIdAsync(request.Dto.Email, request.Id);
        if (emailConflict != null)
            throw new Bio.Domain.Exceptions.ConflictException($"User with email {request.Dto.Email} already exists.");

        if (!string.IsNullOrEmpty(request.Dto.PhoneNumber))
        {
            var phoneConflict = await _userRepository.GetByPhoneNumberExcludingIdAsync(request.Dto.PhoneNumber, request.Id);
            if (phoneConflict != null)
                throw new Bio.Domain.Exceptions.ConflictException($"User with phone number {request.Dto.PhoneNumber} already exists.");
        }

        // Domain Logic
        user.UpdateProfile(request.Dto.FullName, request.Dto.Email, request.Dto.PhoneNumber);

        await _userRepository.SaveChangesAsync();

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
