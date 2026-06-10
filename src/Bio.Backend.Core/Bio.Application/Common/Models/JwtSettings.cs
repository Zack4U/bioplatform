namespace Bio.Application.Common.Models;

/// <summary>
/// Settings for JWT generation and validation.
/// </summary>
public class JwtSettings
{
    /// <summary>
    /// The section name for JWT settings in the configuration.
    /// </summary>
    public const string SectionName = "JwtSettings";

    /// <summary>
    /// The secret key used for JWT signing.
    /// </summary>
    public string Secret { get; init; } = string.Empty;

    /// <summary>
    /// The issuer of the JWT.
    /// </summary>
    public string Issuer { get; init; } = string.Empty;

    /// <summary>
    /// The audience of the JWT.
    /// </summary>
    public string Audience { get; init; } = string.Empty;

    /// <summary>
    /// The expiration time of the JWT in minutes.
    /// </summary>
    public int ExpiryMinutes { get; init; }

    /// <summary>
    /// The expiration time of the refresh token in days.
    /// </summary>
    public int RefreshTokenExpiryDays { get; init; }
}
