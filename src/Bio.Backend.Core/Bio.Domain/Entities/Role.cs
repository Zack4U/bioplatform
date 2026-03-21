namespace Bio.Domain.Entities;

/// <summary>
/// Domain entity representing a security role in the BioPlatform.
/// Follows DDD principles with encapsulated state.
/// </summary>
public class Role
{
    /// <summary>
    /// Unique identifier for the role.
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// Unique name of the role (e.g., ADMIN, USER).
    /// Always stored in uppercase.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Optional description of the role's purpose.
    /// </summary>
    public string? Description { get; private set; }

    /// <summary>
    /// Timestamp of when the role was created.
    /// </summary>
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp of the last update to the role.
    /// </summary>
    public DateTime? UpdatedAt { get; private set; }

    // Required for EF Core
    private Role() { }

    /// <summary>
    /// Creates a new role.
    /// </summary>
    /// <param name="id">The ID of the role.</param>
    /// <param name="name">The name of the role.</param>
    /// <param name="description">The description of the role.</param>
    public Role(Guid id, string name, string? description = null)
    {
        if (id == Guid.Empty) throw new ArgumentException("Role ID cannot be empty.", nameof(id));
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Role name is required.", nameof(name));

        Id = id;
        Name = name.Trim().ToUpperInvariant();
        Description = description?.Trim();
        CreatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Updates the role information.
    /// </summary>
    /// <param name="name">The new name of the role.</param>
    /// <param name="description">The new description of the role.</param>
    public void Update(string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Role name cannot be empty.", nameof(name));

        Name = name.Trim().ToUpperInvariant();
        Description = description?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}
