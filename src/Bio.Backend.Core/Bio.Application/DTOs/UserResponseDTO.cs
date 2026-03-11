namespace Bio.Application.DTOs;

/// <summary>
/// Data Transfer Object representing the user information sent back to the client.
/// This object excludes sensitive data like password hashes or salts.
/// </summary>
/// <param name="Id">Unique identifier for the user.</param>
/// <param name="FullName">Full name of the user.</param>
/// <param name="Email">User's registered email address.</param>
/// <param name="PhoneNumber">User's phone number.</param>
/// <param name="CreatedAt">The date and time when the user account was created.</param>
/// <param name="UpdatedAt">The date and time when the user account was updated.</param>
public record UserResponseDTO(
    Guid Id,
    string FullName = "",
    string Email = "",
    string? PhoneNumber = null,
    DateTime CreatedAt = default,
    DateTime? UpdatedAt = null
);
