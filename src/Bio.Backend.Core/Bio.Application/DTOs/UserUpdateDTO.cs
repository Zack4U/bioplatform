using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Object used to update an existing user's profile information.
/// Password changes are handled separately via a dedicated endpoint.
/// </summary>
public class UserUpdateDTO
{
    /// <summary>
    /// Full name of the user.
    /// </summary>
    [Required(ErrorMessage = "Full name is required.")]
    [StringLength(150, ErrorMessage = "Name cannot exceed 150 characters.")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Institutional or personal email. Must be unique.
    /// </summary>
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Contact phone number.
    /// </summary>
    [Required(ErrorMessage = "Phone number is required.")]
    [Phone(ErrorMessage = "Phone format is invalid.")]
    public string PhoneNumber { get; set; } = string.Empty;
}
