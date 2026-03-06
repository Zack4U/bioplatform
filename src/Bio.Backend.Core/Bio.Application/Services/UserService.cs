using Bio.Application.DTOs;
using Bio.Application.Interfaces;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using FluentValidation;

namespace Bio.Application.Services;

/// <summary>
/// Implementation of user services.
/// Contains the business logic for registration and profile management.
/// </summary>
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IValidator<UserCreateDTO> _validator;
    private readonly IValidator<UserUpdateDTO> _updateValidator;

    /// <summary>
    /// Initializes a new instance of <see cref="UserService"/>.
    /// </summary>
    /// <param name="userRepository">User repository.</param>
    /// <param name="passwordHasher">Password hashing service for security.</param>
    /// <param name="validator">Validator for user creation data.</param>
    /// <param name="updateValidator">Validator for user update data.</param>
    public UserService(IUserRepository userRepository, IPasswordHasher passwordHasher, IValidator<UserCreateDTO> validator, IValidator<UserUpdateDTO> updateValidator)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _validator = validator;
        _updateValidator = updateValidator;
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

        if (!string.IsNullOrEmpty(userCreateDTO.PhoneNumber))
        {
            var existingUserByPhone = await _userRepository.GetByPhoneNumberAsync(userCreateDTO.PhoneNumber);
            if (existingUserByPhone != null)
            {
                throw new InvalidOperationException($"User with phone number {userCreateDTO.PhoneNumber} already exists.");
            }
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
        return MapToResponseDTO(user);
    }

    /// <summary>
    /// Retrieves all users and maps them to public DTOs.
    /// </summary>
    public async Task<IEnumerable<UserResponseDTO>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllAsync();
        return users.Select(MapToResponseDTO);
    }

    /// <summary>
    /// Finds a user by ID and maps them to a public DTO.
    /// </summary>
    public async Task<UserResponseDTO?> GetUserByIdAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        return user != null ? MapToResponseDTO(user) : null;
    }

    /// <summary>
    /// Finds a user by email and maps them to a public DTO.
    /// </summary>
    public async Task<UserResponseDTO?> GetUserByEmailAsync(string email)
    {
        var user = await _userRepository.GetByEmailAsync(email);
        return user != null ? MapToResponseDTO(user) : null;
    }

    /// <summary>
    /// Finds a user by phone number and maps them to a public DTO.
    /// </summary>
    public async Task<UserResponseDTO?> GetUserByPhoneNumberAsync(string phoneNumber)
    {
        var user = await _userRepository.GetByPhoneNumberAsync(phoneNumber);
        return user != null ? MapToResponseDTO(user) : null;
    }

    /// <summary>
    /// Helper method to centralize the mapping from User entity to UserResponseDTO.
    /// </summary>
    private static UserResponseDTO MapToResponseDTO(User user)
    {
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

    /// <summary>
    /// Updates a user's FullName, Email, and PhoneNumber.
    /// Validates uniqueness of email and phone excluding the current user.
    /// </summary>
    public async Task<UserResponseDTO?> UpdateUserAsync(Guid id, UserUpdateDTO dto)
    {
        // 1. Validate DTO format
        var validationResult = await _updateValidator.ValidateAsync(dto);
        if (!validationResult.IsValid)
            throw new ValidationException(validationResult.Errors);

        // 2. Retrieve the user to update
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return null;

        // 3. Check uniqueness of email (excluding self)
        var emailConflict = await _userRepository.GetByEmailExcludingIdAsync(dto.Email, id);
        if (emailConflict != null)
            throw new InvalidOperationException($"User with email {dto.Email} already exists.");

        // 4. Check uniqueness of phone (excluding self)
        var phoneConflict = await _userRepository.GetByPhoneNumberExcludingIdAsync(dto.PhoneNumber, id);
        if (phoneConflict != null)
            throw new InvalidOperationException($"User with phone number {dto.PhoneNumber} already exists.");

        // 5. Apply changes
        user.FullName = dto.FullName;
        user.Email = dto.Email;
        user.PhoneNumber = dto.PhoneNumber;
        user.UpdatedAt = DateTime.UtcNow;

        await _userRepository.SaveChangesAsync();

        return MapToResponseDTO(user);
    }

    /// <summary>
    /// Deletes a user by ID. Returns false if the user was not found.
    /// </summary>
    public async Task<bool> DeleteUserAsync(Guid id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null) return false;

        await _userRepository.DeleteAsync(user);
        await _userRepository.SaveChangesAsync();
        return true;
    }
}
