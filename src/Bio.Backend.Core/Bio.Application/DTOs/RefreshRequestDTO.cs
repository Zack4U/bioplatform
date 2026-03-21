using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for refresh token requests.
/// </summary>
/// <param name="AccessToken">The expired access token.</param>
/// <param name="RefreshToken">The valid refresh token.</param>
public record RefreshRequestDTO
{
    public RefreshRequestDTO() { }

    public RefreshRequestDTO(string accessToken, string refreshToken)
    {
        AccessToken = accessToken;
        RefreshToken = refreshToken;
    }

    [Required(ErrorMessage = "AccessToken is required.")]
    public string AccessToken { get; init; } = "";

    [Required(ErrorMessage = "RefreshToken is required.")]
    public string RefreshToken { get; init; } = "";
}
