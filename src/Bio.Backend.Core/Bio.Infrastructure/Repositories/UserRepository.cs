using Bio.Backend.Core.Bio.Infrastructure.Persistence;
using Bio.Domain.Entities;
using Bio.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Bio.Backend.Core.Bio.Infrastructure.Repositories;

/// <summary>
/// Implementation of the user repository using Entity Framework Core.
/// Handles the persistence of user data to the database.
/// </summary>
public class UserRepository : IUserRepository
{
    private readonly BioDbContext _context;

    /// <summary>
    /// Initializes a new instance of <see cref="UserRepository"/>.
    /// </summary>
    /// <param name="context">The database context.</param>
    public UserRepository(BioDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Asynchronously adds a new user to the database.
    /// </summary>
    /// <param name="user">The user entity to add.</param>
    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
    }

    /// <summary>
    /// Asynchronously retrieves all users from the database.
    /// </summary>
    /// <returns>A collection of all user entities.</returns>
    public async Task<IEnumerable<User>> GetAllAsync()
    {
        return await _context.Users.ToListAsync();
    }

    /// <summary>
    /// Asynchronously retrieves a user by their unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the user.</param>
    /// <returns>The user entity with the specified ID, or null if not found.</returns>
    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FindAsync(id);
    }

    /// <summary>
    /// Asynchronously retrieves a user by their email address.
    /// </summary>
    /// <param name="email">The email to search for.</param>
    /// <returns>The user entity with the specified email, or null if not found.</returns>
    public async Task<User?> GetByEmailAsync(string email)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    /// <summary>
    /// Asynchronously retrieves a user by their phone number.
    /// </summary>
    /// <param name="phoneNumber">The phone number to search for.</param>
    /// <returns>The user entity with the specified phone number, or null if not found.</returns>
    public async Task<User?> GetByPhoneNumberAsync(string phoneNumber)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);
    }

    /// <summary>
    /// Checks if another user (not the one being updated) already has the given email.
    /// </summary>
    public async Task<User?> GetByEmailExcludingIdAsync(string email, Guid excludeId)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email && u.Id != excludeId);
    }

    /// <summary>
    /// Checks if another user (not the one being updated) already has the given phone number.
    /// </summary>
    public async Task<User?> GetByPhoneNumberExcludingIdAsync(string phoneNumber, Guid excludeId)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber && u.Id != excludeId);
    }

    /// <summary>
    /// Asynchronously removes a user from the database.
    /// </summary>
    /// <param name="user">The user entity to remove.</param>
    public Task DeleteAsync(User user)
    {
        _context.Users.Remove(user);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Admin paginated query with optional filters.
    /// </summary>
    public async Task<(IReadOnlyList<User> Items, int TotalCount)> GetFilteredPagedAsync(
        string? search, string? roleName, bool? isActive, bool? isVerified,
        DateTime? fromDate, DateTime? toDate, int page, int pageSize, CancellationToken ct)
    {
        var q = _context.Users.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(u => u.FullName.Contains(search) || u.Email.Contains(search));
        if (isActive.HasValue) q = q.Where(u => u.IsActive == isActive.Value);
        if (isVerified.HasValue) q = q.Where(u => u.IsVerified == isVerified.Value);
        if (fromDate.HasValue) q = q.Where(u => u.CreatedAt >= fromDate.Value);
        if (toDate.HasValue) q = q.Where(u => u.CreatedAt <= toDate.Value);
        if (!string.IsNullOrWhiteSpace(roleName))
            q = q.Where(u => _context.UserRoles
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Any(x => x.UserId == u.Id && x.Name == roleName));
        q = q.OrderByDescending(u => u.CreatedAt);
        var total = await q.CountAsync(ct);
        var items = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (items, total);
    }

    /// <summary>Gets count of users grouped by role name.</summary>
    public async Task<IReadOnlyList<(string RoleName, int Count)>> GetCountByRoleAsync(CancellationToken ct)
    {
        var result = await _context.UserRoles
            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => r.Name)
            .GroupBy(name => name)
            .Select(g => new { RoleName = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        return result.Select(x => (x.RoleName, x.Count)).ToList();
    }
}
