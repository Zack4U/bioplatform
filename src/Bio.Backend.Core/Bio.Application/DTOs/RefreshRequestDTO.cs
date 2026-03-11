using System.ComponentModel.DataAnnotations;

namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for refresh token requests.
/// </summary>
/// <param name="AccessToken">The expired access token.</param>
/// <param name="RefreshToken">The valid refresh token.</param>
public record RefreshRequestDTO(
    [property: Required(ErrorMessage = "AccessToken is required.")]
    string AccessToken = "",

    [property: Required(ErrorMessage = "RefreshToken is required.")]
    string RefreshToken = ""
);
