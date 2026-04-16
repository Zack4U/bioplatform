using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

/// <summary>
/// Repository for managing refresh tokens.
/// </summary>
public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly BioDbContext _context;

    /// <summary>
    /// Initializes a new instance of the <see cref="RefreshTokenRepository"/> class.
    /// </summary>
    /// <param name="context">The database context.</param>
    public RefreshTokenRepository(BioDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Adds a new refresh token to the database.
    /// </summary>
    /// <param name="refreshToken">The refresh token to add.</param>
    public async Task AddAsync(RefreshToken refreshToken)
    {
        await _context.RefreshTokens.AddAsync(refreshToken);
    }

    /// <summary>
    /// Gets a refresh token by its token value.
    /// </summary>
    /// <param name="token">The token value.</param>
    /// <returns>The refresh token if found, otherwise null.</returns>
    public async Task<RefreshToken?> GetByTokenAsync(string token)
    {
        return await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == token);
    }

    /// <summary>
    /// Gets a refresh token by its token value and user ID.
    /// </summary>
    /// <param name="token">The token value.</param>
    /// <param name="userId">The user ID.</param>
    /// <returns>The refresh token if found, otherwise null.</returns>
    public async Task<RefreshToken?> GetByTokenAsync(string token, Guid userId)
    {
        return await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == token && rt.UserId == userId);
    }

    /// <summary>
    /// Updates an existing refresh token in the database.
    /// </summary>
    /// <param name="refreshToken">The refresh token to update.</param>
    public async Task UpdateAsync(RefreshToken refreshToken)
    {
        _context.RefreshTokens.Update(refreshToken);
        await Task.CompletedTask;
    }

}
