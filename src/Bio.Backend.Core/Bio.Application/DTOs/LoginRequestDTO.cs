using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for login requests.
/// </summary>
/// <param name="Email">Institutional or personal email.</param>
/// <param name="Password">Access password.</param>
public record LoginRequestDTO
{
    public LoginRequestDTO() { }

    public LoginRequestDTO(string email, string password)
    {
        Email = email;
        Password = password;
    }

    [Required(ErrorMessage = "Email is required.")]
    [EmailAddress(ErrorMessage = "Email format is invalid.")]
    public string Email { get; init; } = "";

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; init; } = "";
}
