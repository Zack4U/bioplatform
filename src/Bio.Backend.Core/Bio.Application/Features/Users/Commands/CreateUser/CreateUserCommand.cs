using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using MediatR;

namespace Bio.Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(UserCreateDTO Dto) : IRequest<UserResponseDTO>;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, UserResponseDTO>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IRoleRepository _roleRepository;
    private readonly IUserRoleRepository _userRoleRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateUserCommandHandler(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IRoleRepository roleRepository,
        IUserRoleRepository userRoleRepository,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<UserResponseDTO> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var dto = request.Dto;

        // 1. Check uniqueness
        var existingEmail = await _userRepository.GetByEmailAsync(dto.Email);
        if (existingEmail != null)
            throw new Bio.Domain.Exceptions.ConflictException($"User with email {dto.Email} already exists.");

        if (!string.IsNullOrEmpty(dto.PhoneNumber))
        {
            var existingPhone = await _userRepository.GetByPhoneNumberAsync(dto.PhoneNumber);
            if (existingPhone != null)
                throw new Bio.Domain.Exceptions.ConflictException($"User with phone number {dto.PhoneNumber} already exists.");
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

        // 5. Automatic Role Assignment (Buyer) by default
        var buyerRole = await _roleRepository.GetByNameAsync("Buyer");
        if (buyerRole != null)
        {
            var userRole = new UserRole(user.Id, buyerRole.Id);
            await _userRoleRepository.AddAsync(userRole);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // 6. Response
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
