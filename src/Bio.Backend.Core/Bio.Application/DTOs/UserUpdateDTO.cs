using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Object used to update an existing user's profile information.
/// Password changes are handled separately via a dedicated endpoint.
/// </summary>
/// <param name="FullName">Full name of the user.</param>
/// <param name="Email">Institutional or personal email. Must be unique.</param>
/// <param name="PhoneNumber">Contact phone number.</param>
public record UserUpdateDTO
{
    public UserUpdateDTO() { }

    public UserUpdateDTO(string fullName, string email, string phoneNumber)
    {
        FullName = fullName;
        Email = email;
        PhoneNumber = phoneNumber;
    }

    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters.")]
    public string FullName { get; init; } = "";

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
    public string Email { get; init; } = "";

    [Required(ErrorMessage = "Phone number is required.")]
    [Phone(ErrorMessage = "Phone format is invalid.")]
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    public string PhoneNumber { get; init; } = "";
}
