namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for role responses.
/// </summary>
public class RoleResponseDTO
{
    /// <summary>
    /// Unique identifier for the role.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// Name of the role.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Description of the role.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Timestamp of when the role was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Timestamp of when the role was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }
}
