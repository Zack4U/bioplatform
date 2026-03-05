using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

/// <summary>
/// Implementation of user-role assignment repository.
/// </summary>
public class UserRoleRepository : IUserRoleRepository
{
    private readonly BioDbContext _context;

    /// <summary>
    /// Initializes a new instance of <see cref="UserRoleRepository"/>.
    /// </summary>
    /// <param name="context">The database context.</param>
    public UserRoleRepository(BioDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Checks if a specific role assignment already exists for a user.
    /// </summary>
    /// <param name="userId">The unique identifier of the user.</param>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>True if the assignment exists, otherwise false.</returns>
    public async Task<bool> ExistsAsync(Guid userId, Guid roleId)
    {
        return await _context.Set<UserRole>().AnyAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
    }

    /// <summary>
    /// Adds a new user-role assignment to the context.
    /// </summary>
    /// <param name="userRole">The assignment entity to add.</param>
    public async Task AddAsync(UserRole userRole)
    {
        await _context.Set<UserRole>().AddAsync(userRole);
    }

    /// <summary>
    /// Persists all pending changes to the database.
    /// </summary>
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
