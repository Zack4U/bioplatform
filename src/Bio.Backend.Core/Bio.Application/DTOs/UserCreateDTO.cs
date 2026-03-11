using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Object used to create a new user in the system.
/// </summary>
/// <param name="FullName">Full name of the user. It will be used to display in the profile.</param>
/// <param name="Email">Institutional or personal email. Must be unique.</param>
/// <param name="PhoneNumber">Contact phone number.</param>
/// <param name="Password">Access password. It is recommended to include uppercase letters, numbers and symbols.</param>
public record UserCreateDTO(
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters.")]
    string FullName = "",

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
    string Email = "",

    [Required(ErrorMessage = "Phone number is required.")]
    [Phone(ErrorMessage = "Phone format is invalid.")]
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    string PhoneNumber = "",

    [Required(ErrorMessage = "Password is required.")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters long.")]
    string Password = ""
);
