using Bio.Application.DTOs;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;

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
    private readonly BioDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    /// <summary>
    /// Initializes a new instance of <see cref="UserService"/>.
    /// </summary>
    /// <param name="context">Database context.</param>
    /// <param name="passwordHasher">Password hashing service for security.</param>
    public UserService(BioDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    /// <summary>
    /// Processes the creation of a user: encrypts the password, maps to the entity, and persists it in the database.
    /// </summary>
    /// <param name="userCreateDTO">Transfer data with the information of the new user.</param>
    /// <returns>DTO with the data of the created user (Id, Name, Email, etc.).</returns>
    public async Task<UserResponseDTO> CreateUserAsync(UserCreateDTO userCreateDTO)
    {
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
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

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
