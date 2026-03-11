using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Object used to update an existing user's profile information.
/// Password changes are handled separately via a dedicated endpoint.
/// </summary>
/// <param name="FullName">Full name of the user.</param>
/// <param name="Email">Institutional or personal email. Must be unique.</param>
/// <param name="PhoneNumber">Contact phone number.</param>
public record UserUpdateDTO(
    [property: Required(ErrorMessage = "Full name is required.")]
    [property: StringLength(150, ErrorMessage = "Name cannot exceed 150 characters.")]
    string FullName = "",

    [property: Required(ErrorMessage = "Email is required.")]
    [property: EmailAddress(ErrorMessage = "Email format is invalid.")]
    [property: StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
    string Email = "",

    [property: Required(ErrorMessage = "Phone number is required.")]
    [property: Phone(ErrorMessage = "Phone format is invalid.")]
    [property: StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
    string PhoneNumber = ""
);
