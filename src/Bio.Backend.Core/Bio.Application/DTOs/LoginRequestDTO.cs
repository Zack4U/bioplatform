using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for login requests.
/// </summary>
/// <param name="Email">Institutional or personal email.</param>
/// <param name="Password">Access password.</param>
public record LoginRequestDTO(
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    string Email = "",
    
    [Required(ErrorMessage = "Password is required.")]
    string Password = ""
);
