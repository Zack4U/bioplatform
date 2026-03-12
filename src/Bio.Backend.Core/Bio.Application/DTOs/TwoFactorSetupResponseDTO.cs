namespace Bio.Application.DTOs;

/// <summary>
/// Response containing the configuration details for Two-Factor Authentication.
/// </summary>
public record TwoFactorSetupResponseDTO(
    string SharedKey,
    string AuthenticatorUri
);
