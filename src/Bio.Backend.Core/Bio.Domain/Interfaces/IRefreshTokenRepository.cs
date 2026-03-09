using Bio.Domain.Entities;

namespace Bio.Domain.Interfaces;

/// <summary>
/// Defines the contract for managing refresh tokens in the persistence layer.
/// </summary>
public interface IRefreshTokenRepository
{
    /// <summary>
    /// Adds a new refresh token.
    /// </summary>
    /// <param name="refreshToken">The refresh token to add.</param>
    Task AddAsync(RefreshToken refreshToken);

    /// <summary>
    /// Gets a refresh token by its token value.
    /// </summary>
    /// <param name="token">The token value.</param>
    /// <returns>The refresh token if found, otherwise null.</returns>
    Task<RefreshToken?> GetByTokenAsync(string token);

    /// <summary>
    /// Gets a refresh token by its token value and user ID.
    /// </summary>
    /// <param name="token">The token value.</param>
    /// <param name="userId">The user ID.</param>
    /// <returns>The refresh token if found, otherwise null.</returns>
    Task<RefreshToken?> GetByTokenAsync(string token, Guid userId);

    /// <summary>
    /// Updates an existing refresh token.
    /// </summary>
    /// <param name="refreshToken">The refresh token to update.</param>
    Task UpdateAsync(RefreshToken refreshToken);

    /// <summary>
    /// Saves the changes to the database.
    /// </summary>
    Task SaveChangesAsync();
}
