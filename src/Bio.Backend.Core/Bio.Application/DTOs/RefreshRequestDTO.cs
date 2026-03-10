using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for refresh token requests.
/// </summary>
public class RefreshRequestDTO
{
    /// <summary>
    /// The expired access token.
    /// </summary>
    [Required(ErrorMessage = "AccessToken is required.")]
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>
    /// The valid refresh token.
    /// </summary>
    [Required(ErrorMessage = "RefreshToken is required.")]
    public string RefreshToken { get; set; } = string.Empty;
}
