using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Request containing the temporary 2FA token and the 6-digit code for final authentication.
/// </summary>
public record TwoFactorLoginRequestDTO
{
    [Required(ErrorMessage = "Two-factor token is required.")]
    public required string TwoFactorToken { get; init; }

    [Required(ErrorMessage = "The 6-digit code is required.")]
    public required string Code { get; init; }
}
