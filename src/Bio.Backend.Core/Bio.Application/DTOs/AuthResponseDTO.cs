namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for authentication responses.
/// </summary>
public record AuthResponseDTO(string AccessToken, string RefreshToken, DateTime AccessTokenExpiration);
