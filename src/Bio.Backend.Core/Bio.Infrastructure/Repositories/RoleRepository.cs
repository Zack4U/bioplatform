using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

/// <summary>
/// Implementation of the role repository using Entity Framework Core.
/// </summary>
public class RoleRepository : IRoleRepository
{
    private readonly BioDbContext _context;

    public RoleRepository(BioDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Asynchronously adds a new role to the database.
    /// </summary>
    /// <param name="role">The role entity to add.</param>
    public async Task AddAsync(Role role)
    {
        await _context.Roles.AddAsync(role);
    }

    /// <summary>
    /// Asynchronously retrieves a role by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the role.</param>
    /// <returns>The role entity if found; otherwise, null.</returns>
    public async Task<Role?> GetByIdAsync(Guid id)
    {
        return await _context.Roles.FindAsync(id);
    }

    /// <summary>
    /// Asynchronously retrieves a role by its unique name.
    /// </summary>
    /// <param name="name">The name of the role to search for.</param>
    /// <returns>The role entity if found; otherwise, null.</returns>
    public async Task<Role?> GetByNameAsync(string name)
    {
        return await _context.Roles.FirstOrDefaultAsync(r => r.Name == name);
    }

    /// <summary>
    /// Asynchronously retrieves a role by its unique name, excluding a specified ID.
    /// </summary>
    public async Task<Role?> GetByNameExcludingIdAsync(string name, Guid id)
    {
        return await _context.Roles.FirstOrDefaultAsync(r => r.Name == name && r.Id != id);
    }

    /// <summary>
    /// Asynchronously retrieves all roles from the database.
    /// </summary>
    /// <returns>A collection of all role entities.</returns>
    public async Task<IEnumerable<Role>> GetAllAsync()
    {
        return await _context.Roles.ToListAsync();
    }

    /// <summary>
    /// Asynchronously deletes a role from the database.
    /// </summary>
    /// <param name="role">The role entity to delete.</param>
    public Task DeleteAsync(Role role)
    {
        _context.Roles.Remove(role);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Asynchronously saves all changes made in this context to the database.
    /// </summary>
    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
