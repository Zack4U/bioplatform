namespace Bio.Application.DTOs;

/// <summary>
/// Data transfer object for role creation.
/// </summary>
public class RoleCreateDTO
{
    /// <summary>
    /// Name of the role (e.g., ADMIN). Will be normalized to uppercase.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Optional description of the role.
    /// </summary>
    public string? Description { get; set; }
}
