namespace Bio.Application.DTOs;

/// <summary>
/// Data Transfer Object for updating an existing security role.
/// </summary>
public class RoleUpdateDTO
{
    /// <summary>
    /// Gets or sets the name of the role.
    /// Case-insensitive.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the optional description of the role.
    /// </summary>
    public string? Description { get; set; }
}
