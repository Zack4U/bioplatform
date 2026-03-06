using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Object used to create a new user in the system.
/// </summary>
public class UserCreateDTO
{
    /// <summary>
    /// Full name of the user. It will be used to display in the profile.
    /// </summary>
    /// <example>Juan Pérez</example>
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters.")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Institutional or personal email. Must be unique.
    /// </summary>
    /// <example>juan.perez@ejemplo.com</example>
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Contact phone number.
    /// </summary>
    /// <example>+573001234567</example>
    [Required(ErrorMessage = "Phone number is required.")]
    [Phone(ErrorMessage = "Phone format is invalid.")]
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// Access password. It is recommended to include uppercase letters, numbers and symbols.
    /// </summary>
    /// <example>P@ssword123!</example>
    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
    public string Password { get; set; } = string.Empty;
}
