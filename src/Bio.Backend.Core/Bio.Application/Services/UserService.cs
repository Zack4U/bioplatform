using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentValidation;

namespace Bio.Application.Services;

/// <summary>
/// Defines the services for user management.
/// </summary>
public interface IUserService
{
    /// <summary>
    /// Creates a new user in the system, processing their password and saving it to the database.
    /// </summary>
    /// <param name="userCreateDTO">User creation data.</param>
    /// <returns>Information of the created user without sensitive data.</returns>
    Task<UserResponseDTO> CreateUserAsync(UserCreateDTO userCreateDTO);
}

/// <summary>
/// Implementation of user services.
/// Contains the business logic for registration and profile management.
/// </summary>
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IValidator<UserCreateDTO> _validator;

    /// <summary>
    /// Initializes a new instance of <see cref="UserService"/>.
    /// </summary>
    /// <param name="userRepository">User repository.</param>
    /// <param name="passwordHasher">Password hashing service for security.</param>
    /// <param name="validator">Validator for user creation data.</param>
    public UserService(IUserRepository userRepository, IPasswordHasher passwordHasher, IValidator<UserCreateDTO> validator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _validator = validator;
    }

    /// <summary>
    /// Processes the creation of a user: encrypts the password, maps to the entity, and persists it in the database.
    /// </summary>
    /// <param name="userCreateDTO">Transfer data with the information of the new user.</param>
    /// <returns>DTO with the data of the created user (Id, Name, Email, etc.).</returns>
    public async Task<UserResponseDTO> CreateUserAsync(UserCreateDTO userCreateDTO)
    {
        // 0. Validation
        var validationResult = await _validator.ValidateAsync(userCreateDTO);
        if (!validationResult.IsValid)
        {
            throw new ValidationException(validationResult.Errors);
        }

        // 0. Check if user already exists
        var existingUser = await _userRepository.GetByEmailAsync(userCreateDTO.Email);
        if (existingUser != null)
        {
            throw new InvalidOperationException($"User with email {userCreateDTO.Email} already exists.");
        }

        // 1. Generate hash and salt using the security service
        var (hash, salt) = _passwordHasher.HashPassword(userCreateDTO.Password);

        // 2. Map the DTO to the Domain Entity 'User'
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = userCreateDTO.FullName,
            Email = userCreateDTO.Email,
            PhoneNumber = userCreateDTO.PhoneNumber,
            PasswordHash = hash,
            Salt = salt,
            CreatedAt = DateTime.UtcNow
        };

        // 3. Save to the database
        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();

        // 4. Return only public information (without hashes)
        return new UserResponseDTO
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            CreatedAt = user.CreatedAt
        };
    }
}
