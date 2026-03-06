using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.ReadModels;
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
    /// Retrieves all user-role assignments with user and role names from the database.
    /// </summary>
    /// <returns>A collection of assignment details.</returns>
    public async Task<IEnumerable<UserRoleDetail>> GetAllWithDetailsAsync()
    {
        return await GetBaseQuery().ToListAsync();
    }

    /// <summary>
    /// Retrieves all roles assigned to a specific user.
    /// </summary>
    /// <param name="userId">The user's unique identifier.</param>
    /// <returns>A collection of roles assigned to the user.</returns>
    public async Task<IEnumerable<UserRoleDetail>> GetByUserIdWithDetailsAsync(Guid userId)
    {
        return await GetBaseQuery()
            .Where(ur => ur.UserId == userId)
            .ToListAsync();
    }

    /// <summary>
    /// Retrieves all users assigned to a specific role name.
    /// </summary>
    /// <param name="roleName">The name of the role.</param>
    /// <returns>A collection of users assigned to the role.</returns>
    public async Task<IEnumerable<UserRoleDetail>> GetByRoleNameWithDetailsAsync(string roleName)
    {
        return await GetBaseQuery()
            .Where(r => r.RoleName == roleName)
            .ToListAsync();
    }

    /// <summary>
    /// Retrieves all users assigned to a specific role ID.
    /// </summary>
    /// <param name="roleId">The unique identifier of the role.</param>
    /// <returns>A collection of users assigned to the role.</returns>
    public async Task<IEnumerable<UserRoleDetail>> GetByRoleIdWithDetailsAsync(Guid roleId)
    {
        return await GetBaseQuery()
            .Where(ur => ur.RoleId == roleId)
            .ToListAsync();
    }

    /// <summary>
    /// Provides a base query with the necessary joins and projections for user-role details.
    /// </summary>
    /// <returns>An IQueryable of <see cref="UserRoleDetail"/>.</returns>
    private IQueryable<UserRoleDetail> GetBaseQuery()
    {
        return from ur in _context.Set<UserRole>()
               join u in _context.Users on ur.UserId equals u.Id
               join r in _context.Roles on ur.RoleId equals r.Id
               select new UserRoleDetail
               {
                   UserId = ur.UserId,
                   UserEmail = u.Email,
                   RoleId = ur.RoleId,
                   RoleName = r.Name,
                   AssignedAt = ur.AssignedAt
               };
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
    /// Retrieves a specific user-role assignment by IDs.
    /// </summary>
    public async Task<UserRole?> GetByIdsAsync(Guid userId, Guid roleId)
    {
        return await _context.Set<UserRole>()
            .FirstOrDefaultAsync(ur => ur.UserId == userId && ur.RoleId == roleId);
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
    /// Removes a user-role assignment from the context.
    /// </summary>
    /// <param name="userRole">The assignment entity to remove.</param>
    public async Task DeleteAsync(UserRole userRole)
    {
        _context.Set<UserRole>().Remove(userRole);
        await Task.CompletedTask;
    }

    /// <summary>
    /// Persists all pending changes to the database.
    /// </summary>
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
