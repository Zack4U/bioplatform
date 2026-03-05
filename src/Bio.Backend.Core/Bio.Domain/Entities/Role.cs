namespace Bio.Domain.Entities;

/// <summary>
/// Domain entity representing a security role in the BioPlatform.
/// </summary>
public class Role
{
    /// <summary>
    /// Unique identifier for the role.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Unique name of the role (e.g., ADMIN, USER).
    /// Always stored in uppercase.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the role's purpose.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Timestamp of when the role was created.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Timestamp of the last update to the role.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
