using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for login requests.
/// </summary>
public class LoginRequestDTO
{
    /// <summary>
    /// Institutional or personal email.
    /// </summary>
    /// <example>user@example.com</example>
    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Access password.
    /// </summary>
    /// <example>P@ssword123!</example>
    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;
}
