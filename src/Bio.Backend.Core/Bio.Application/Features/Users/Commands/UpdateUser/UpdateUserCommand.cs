using Bio.Application.DTOs;
using Bio.Domain.Exceptions;
using Bio.Domain.Interfaces;
using MediatR;
using AutoMapper;

namespace Bio.Application.Features.Users.Commands.UpdateUser;

public record UpdateUserCommand(Guid Id, UserUpdateDTO UserUpdateDTO) : IRequest<UserResponseDTO>;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, UserResponseDTO>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateUserCommandHandler(IUserRepository userRepository, IUnitOfWork unitOfWork, IMapper mapper)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<UserResponseDTO> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.Id);
        if (user == null)
            throw new NotFoundException($"User with ID {request.Id} not found.");

        if (user.Email != request.UserUpdateDTO.Email)
        {
            var existingByEmail = await _userRepository.GetByEmailExcludingIdAsync(request.UserUpdateDTO.Email, request.Id);
            if (existingByEmail != null)
                throw new ConflictException("Email is already in use by another account.");
        }

        if (user.PhoneNumber != request.UserUpdateDTO.PhoneNumber)
        {
            var existingByPhone = await _userRepository.GetByPhoneNumberExcludingIdAsync(request.UserUpdateDTO.PhoneNumber, request.Id);
            if (existingByPhone != null)
                throw new ConflictException("Phone number is already in use by another account.");
        }

        user.UpdateProfile(
            request.UserUpdateDTO.FullName,
            request.UserUpdateDTO.Email,
            request.UserUpdateDTO.PhoneNumber);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<UserResponseDTO>(user);
    }
}
