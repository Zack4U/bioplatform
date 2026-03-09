namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for login requests.
/// </summary>
public record LoginRequestDTO(string Email, string Password);

/// <summary>
/// Data transfer object for authentication responses.
/// </summary>
public record AuthResponseDTO(string AccessToken, string RefreshToken, DateTime AccessTokenExpiration);
