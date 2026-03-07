using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(UserCreateDTO Dto) : IRequest<UserResponseDTO>;

public class CreateUserHandler : IRequestHandler<CreateUserCommand, UserResponseDTO>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;

    public CreateUserHandler(IUserRepository userRepository, IPasswordHasher passwordHasher)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserResponseDTO> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        // 1. Check uniqueness
        var existingEmail = await _userRepository.GetByEmailAsync(dto.Email);
        if (existingEmail != null)
            throw new InvalidOperationException($"User with email {dto.Email} already exists.");

        if (!string.IsNullOrEmpty(dto.PhoneNumber))
        {
            var existingPhone = await _userRepository.GetByPhoneNumberAsync(dto.PhoneNumber);
            if (existingPhone != null)
                throw new InvalidOperationException($"User with phone number {dto.PhoneNumber} already exists.");
        }

        // 2. Hash Password
        var (hash, salt) = _passwordHasher.HashPassword(dto.Password);

        // 3. Create Entity (DDD Constructor)
        var user = new User(
            Guid.NewGuid(),
            dto.FullName,
            dto.Email,
            hash,
            salt,
            dto.PhoneNumber
        );

        // 4. Persistence
        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        // 5. Response
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
