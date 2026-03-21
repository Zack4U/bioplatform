using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Request containing the 6-digit verification code from the authenticator app.
/// </summary>
public record TwoFactorVerifyRequestDTO
{
    [Required(ErrorMessage = "The 6-digit code is required.")]
    public required string Code { get; init; }
}
